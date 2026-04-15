# Chatter

## What it is

**Chatter** turns unstructured text (a “brain dump”) into **tasks**, **notes**, and **events**, then stores them per user so they show up on a board-style app. The model extracts structured data; the app persists it and surfaces it in the UI.

## How we build it: spec-driven development with AI

Development is **spec-first**: requirements and behavior are written down before implementation. AI assistants help draft specs and code against those specs; humans own correctness, review, and release decisions.

### Human-in-the-loop workflow

1. **Planning** — Human defines goals, constraints, and acceptance criteria.
2. **Writing spec** — AI/agent drafts or expands the spec from that plan.
3. **Review spec** — Human approves or revises the spec (source of truth).
4. **Implementing** — AI/agent implements against the approved spec.
5. **Review code and result** — Human validates behavior, UX, and safety.
6. **Committing** — AI/agent can propose commit messages; human merges when satisfied.

Specs for this repo live under `.ai/specs/` (e.g. brain-dump extraction, migrations).

## Stack

| Layer | Technology |
| --- | --- |
| **App** | [Next.js](https://nextjs.org) (App Router), React, TypeScript |
| **Data** | [PostgreSQL](https://www.postgresql.org/), [Prisma](https://www.prisma.io/) ORM (`@prisma/adapter-pg` + `pg` pool) |
| **Server** | [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) (`"use server"`) for mutations such as brain-dump processing |
| **AI** | [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai`), [`@ai-sdk/openai`](https://sdk.vercel.ai/providers/ai-sdk-providers/openai), OpenAI models (e.g. structured output via `generateText` + `Output.object`) |
| **Contracts** | [Zod](https://zod.dev/) schemas shared between prompts and persistence (`src/contracts.ts`) |
| **Auth** | [NextAuth.js](https://next-auth.js.org/) (GitHub / Google; brain-dump processing requires a signed-in user) |

## Architecture (brain dump flow)

1. User submits text from the dashboard (`BrainDumpForm`).
2. A server action (`processBrainDump`) runs with the session user id.
3. The AI SDK calls OpenAI with a schema-aligned prompt; output is validated against Zod (`tasks`, `notes`, `events`).
4. Prisma writes rows to Postgres (`Task`, `Note`, `Event` linked to `User`).
5. The page revalidates and the board shows the new items.

## Local development

Prerequisites: Node.js, `pnpm`, Docker (for Postgres).

1. Start Postgres: `docker compose up -d`
2. Copy env: `cp .env.example .env` and set secrets (see `.env.example` for `POSTGRES_*`, `NEXTAUTH_*`, `OPENAI_API_KEY`).
3. Install: `pnpm install` (or `npm install`)
4. Migrate: `pnpm db:migrate`
5. Dev server: `pnpm dev` → [http://localhost:3000](http://localhost:3000)

Production builds run `prisma migrate deploy` before `next build` (see `package.json` `build` script). On Vercel, map pooled and direct Postgres URLs to `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` as documented in `.env.example`.

## Scripts

- `pnpm dev` — Next.js dev server  
- `pnpm build` — DB deploy + production build  
- `pnpm db:migrate` — create/apply migrations in development  
- `pnpm db:deploy` — apply migrations (e.g. CI/production)  
- `pnpm test` — Vitest  
