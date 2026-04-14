# Spec

## Feature

### Why

The app currently targets SQLite (`dev.db`) with a driver adapter, which does not match how the project will run on Vercel. Moving the data layer to **Vercel Postgres (Neon)** aligns local and production behavior, enables connection pooling for serverless, and unlocks PostgreSQL-native features (including a proper enum for task status). A **Dockerized PostgreSQL 15** instance gives a safe, repeatable local environment that mirrors production semantics without relying on SQLite.

### What

- **Local:** `docker-compose.yml` running `postgres:15-alpine` with a database named **`chatter`**, plus documented `.env` variables so `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` point at that container.
- **Prisma:** `datasource db` uses `provider = "postgresql"` with **`url = env("POSTGRES_PRISMA_URL")`** (pooled / app traffic) and **`directUrl = env("POSTGRES_URL_NON_POOLING")`** (direct, used for migrations and introspection workflows that require a non-pooled connection).
- **Schema:** Preserve existing models **`Task`**, **`Note`**, **`Event`**, and **`User`** with the same fields and relations; change `Task.status` from `String` to a **Prisma `enum` backed by a native PostgreSQL enum** with values `TODO`, `DONE`, `MIGRATED`, `CANCELLED` (aligned with `TaskStatusSchema` in `src/contracts.ts`).
- **Runtime:** Replace the SQLite adapter wiring in `src/lib/prisma.ts` with a PostgreSQL-appropriate client setup (see Constraints) without changing business logic in UI or Server Actions beyond what importing generated types requires, remove any unnecesary library/dependency related to SQLite.
- **Initialization:** Pragmatic first-time sync against the empty local Docker DB via **`npx prisma migrate dev --name init_postgres`** (after a clean Postgres migration baseline—see Tasks).
- **Production:** In the Vercel project, **map** the Vercel Postgres integration’s connection strings into app env vars **`POSTGRES_PRISMA_URL`** (pooled) and **`POSTGRES_URL_NON_POOLING`** (direct), using the names the integration exposes as the source values—see T8.

### Constraints

#### Must

- Database name **`chatter`** for the Docker service and connection URLs.
- Use **`postgres:15-alpine`** in `docker-compose.yml`.
- `schema.prisma` must declare **`POSTGRES_PRISMA_URL`** and **`POSTGRES_URL_NON_POOLING`** as described above (pooled `url`, non-pooled `directUrl`).
- Keep **`Task`**, **`Note`**, **`Event`**, and **`User`** models logically equivalent; **`Task.status`** must use the enum values above and stay consistent with **`src/contracts.ts`** / **`src/lib/state-machine.ts`**.
- Update **`prisma.config.ts`** so Prisma CLI uses the same datasource story as `schema.prisma` (per Prisma 7 project config conventions).
- Do **not** refactor unrelated UI or Server Actions; only touch data-layer and configuration files required for the database switch.

#### Must not

- Do not introduce unrelated dependencies or broad refactors outside the migration scope.
- Do not change product behavior of task state transitions beyond what enum typing enforces at the DB layer.

#### Out of scope

- **Any** automated **SQLite → Postgres** data migration or record import (confirmed: **fresh Postgres only**; no existing rows to preserve).
- Changes to Next.js routing, auth flows, or dashboard UX beyond strict compile/runtime fixes for Prisma types.

### Current State

- **Prisma schema:** `prisma/schema.prisma` — `provider = "sqlite"`; `Task.status` is `String`; no `url` block in schema (SQLite).
- **Prisma config:** `prisma.config.ts` — `datasource.url` from `env("DATABASE_URL")`.
- **Client:** `src/lib/prisma.ts` — `PrismaBetterSqlite3` adapter + `DATABASE_URL`.
- **Dependencies:** `package.json` includes `@prisma/adapter-better-sqlite3` and `better-sqlite3`.
- **Migrations:** `prisma/migrations/*` are **SQLite**-locked (`migration_lock.toml` provider `sqlite`); SQL uses SQLite/PRAGMA-specific steps.
- **Contracts:** `src/contracts.ts` — `TaskStatusSchema` is already `z.enum(["TODO", "DONE", "MIGRATED", "CANCELLED"])`.
- **Env:** No committed `.env`; local developers rely on `DATABASE_URL` for SQLite today.

### Decisions (confirmed)

1. **Fresh database only:** No migration of existing SQLite rows. Baseline a new PostgreSQL migration (archive old SQLite migrations after backup) and run `migrate dev` against an **empty** `chatter` database locally and in production.
2. **Vercel env mapping:** The app **always** reads **`POSTGRES_PRISMA_URL`** and **`POSTGRES_URL_NON_POOLING`**. In Vercel, **map** the Vercel Postgres integration’s supplied connection strings (whatever names the UI shows—e.g. pooled vs direct) **into** those two variable names for Production (and Preview if applicable).
3. **Local pooling parity:** For local Docker, **Neon-style pooling** may not exist; both URLs can point to the same `postgresql://…/chatter` connection string **or** the pooled URL can use parameters documented by your pooler. The important invariant is: **production** uses true pooled vs direct URLs from Vercel Postgres; **local** uses two URLs that both reach the same `chatter` DB without breaking Prisma Migrate.

## Tasks

### T1: Add local Docker PostgreSQL (`chatter`)

**What:** Add `docker-compose.yml` at the repo root using **`postgres:15-alpine`**. Expose PostgreSQL (default `5432`). Set environment variables so Postgres creates database **`chatter`** (e.g. `POSTGRES_DB=chatter`) and define `POSTGRES_USER` / `POSTGRES_PASSWORD` for local-only credentials. Optionally add a named volume for data durability across restarts.

**Files:** `docker-compose.yml` (new)

**Verify:**

```bash
docker compose up -d
docker compose ps
```

Confirm the service is healthy and listening (e.g. `docker ps` shows the container, status `Up`).

---

### T2: Define `.env` mapping for local Postgres (documented template)

**What:** Add or update a **committed** env template (e.g. `.env.example`) documenting:

- `POSTGRES_PRISMA_URL` — connection to the Docker DB `chatter` (the URL the app should use; for local Docker this may match the non-pooling URL unless you add a pooler).
- `POSTGRES_URL_NON_POOLING` — direct connection to the same `chatter` database for migrations.

Use a `postgresql://USER:PASSWORD@HOST:PORT/chatter` form consistent with `docker-compose.yml` ports and credentials. Remove or supersede **`DATABASE_URL`** references in docs for this app’s Postgres phase so there is a single clear mapping (implementation may temporarily support both during the switch if needed).

**Files:** `.env.example` (new or updated), optionally `README.md` only if it already documents env setup (keep edits minimal).

**Verify:**

```bash
# After filling .env locally from the template (not committed):
docker compose exec -T <postgres_service_name> psql -U <POSTGRES_USER> -d chatter -c "SELECT current_database();"
```

---

### T3: Switch Prisma datasource to PostgreSQL with pooled and direct URLs

**What:** In `prisma/schema.prisma`:

- Set `provider = "postgresql"`.
- Set `url = env("POSTGRES_PRISMA_URL")` and `directUrl = env("POSTGRES_URL_NON_POOLING")`.

Ensure `generator` and `output` paths stay consistent with the project (`../src/generated/prisma`).

**Files:** `prisma/schema.prisma`

**Verify:**

```bash
npx prisma validate
```

---

### T4: Model `Task.status` as a Prisma enum mapped to PostgreSQL

**What:** Introduce a Prisma `enum` (e.g. `TaskStatus`) with values **`TODO`**, **`DONE`**, **`MIGRATED`**, **`CANCELLED`**. Change `Task.status` from `String` to that enum. Confirm no other string statuses are persisted in code paths (grep for task creation/updates). Generated Prisma types should align with `TaskStatus` in `src/contracts.ts`; adjust imports/types only where required for compilation—**do not** weaken Zod or state-machine rules.

**Files:** `prisma/schema.prisma`, and only if TypeScript errors require it: minimal updates in `src/app/actions/processBrainDump.ts`, `src/app/dashboard/_components/*`, etc.

**Verify:**

```bash
rg 'status:\s*"' src/ || true
npx prisma validate
pnpm exec tsc --noEmit
```

---

### T5: Align `prisma.config.ts` with the new environment variables

**What:** Update `prisma.config.ts` so the configured datasource URL matches Prisma 7 expectations for **PostgreSQL** (typically the **non-pooling** URL for CLI operations, consistent with `directUrl` in the schema—follow current Prisma 7 docs in `node_modules/next/dist/docs/` and Prisma’s own docs if they differ). Remove SQLite-specific assumptions.

**Files:** `prisma.config.ts`

**Verify:**

```bash
npx prisma validate
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/chatter_pg_diff.sql
```

Confirm the diff SQL is PostgreSQL-flavored (e.g. `CREATE TYPE` for enums, no SQLite PRAGMA).

---

### T6: Replace SQLite Prisma client wiring with PostgreSQL

**What:** Remove `PrismaBetterSqlite3` usage. Instantiate `PrismaClient` for PostgreSQL per Prisma 7 + deployment target (Node.js on Vercel: use the officially recommended `pg` / `@prisma/adapter-pg` pattern **if** the project standard requires a driver adapter; otherwise use the default client configuration that matches Prisma’s Postgres guidance). Use **`POSTGRES_PRISMA_URL`** for runtime connections.

**Files:** `src/lib/prisma.ts`, `package.json` (dependency changes), `pnpm-lock.yaml` (after install)

**Verify:**

```bash
pnpm install
pnpm exec tsc --noEmit
pnpm test
```

---

### T7: Baseline PostgreSQL migrations (archive SQLite history)

**What:** Because existing migrations are SQLite-specific, adopt a **fresh migration baseline** for Postgres:

1. Back up the current `prisma/migrations` folder (e.g. git tag or copy outside repo) for history.
2. Remove SQLite migration folders / replace `migration_lock.toml` with **`provider = "postgresql"`** as generated by Prisma.
3. With Docker Postgres running and `.env` set, run:

```bash
npx prisma migrate dev --name init_postgres
```

This should create an initial migration reflecting `User`, `Task`, `Note`, `Event`, and the **`TaskStatus`** enum.

**Files:** `prisma/migrations/**`, `prisma/migrations/migration_lock.toml`

**Verify:**

```bash
npx prisma migrate status
npx prisma studio
```

In Prisma Studio, confirm tables exist and `Task.status` shows enum values, not free-form strings.

---

### T8: Production (Vercel Postgres) environment configuration

**What:** In the Vercel project → **Settings → Environment Variables**, create **`POSTGRES_PRISMA_URL`** and **`POSTGRES_URL_NON_POOLING`** and **map** their values from the **Vercel Postgres** storage integration: use the integration’s **pooled** connection string for `POSTGRES_PRISMA_URL` and the **direct/non-pooling** string for `POSTGRES_URL_NON_POOLING` (exact labels in the Vercel UI may vary; copy the correct URL into each named variable). Do not rely on the integration’s default variable names in application code—use only these two names in Prisma and `src/lib/prisma.ts`. Ensure production builds do not reference SQLite or `DATABASE_URL` unless retained temporarily as an alias—prefer renaming everywhere for clarity.

**Files:** `.env.example` and/or internal deployment notes (minimal; avoid new markdown files unless the repo already uses them for ops).

**Verify:** In Vercel dashboard, confirm both variables exist with non-empty values and correct mapping (pooled → `POSTGRES_PRISMA_URL`, direct → `POSTGRES_URL_NON_POOLING`). After deploy: Vercel build logs show Prisma migrate/deploy succeeding; smoke-test authenticated flows that read/write `Task`, `Note`, `Event`.

---

### T9: Regression pass (data layer only)

**What:** Run tests and a quick manual pass: sign-in, dashboard load, create/edit flows that touch Prisma. No UI redesign.

**Files:** None unless tests need env mocks for Postgres URLs.

**Verify:**

```bash
pnpm test
pnpm build
```

## Done

- [ ] `docker compose ps` shows PostgreSQL **up**, database **`chatter`** reachable.
- [ ] `npx prisma validate` and `npx prisma migrate status` succeed against local Docker Postgres.
- [ ] `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` are documented for local and production; local `.env` (uncommitted) maps both to the Docker `chatter` DB; **Vercel** maps integration connection strings **into** those same two names (pooled vs direct).
- [ ] `Task`, `Note`, `Event`, `User` behave as before at the application level; `Task.status` is a **PostgreSQL enum** with the four domain values.
- [ ] SQLite-specific dependencies and adapters removed from the runtime path; `pnpm test` and `pnpm build` pass.
- [ ] `npx prisma studio` can inspect and edit rows against local Postgres without schema errors.
