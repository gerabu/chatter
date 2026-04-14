# Add Session Auth + User Scoped Data

## Why

The app currently stores and displays tasks, notes, and events globally, so users can see each other's data. We need account-based sessions so users can sign in with GitHub/Google and only manage their own items in `/dashboard`.

## What

Implement NextAuth-based OAuth authentication (GitHub + Google) with `/signup` and `/signin` pages, redirect authenticated users to `/dashboard`, and make all dashboard data creation/loading user-scoped via `user_id`. Add a `User` model and required relationships so each task/note/event belongs to exactly one user.

## Constraints

### Must
- Use Prisma + SQLite.
- Use NextAuth with only OAuth providers (GitHub, Google), no password/email auth.
- `/signin` and `/signup` stay public; `/dashboard/*` protected.
- Light theme remains default; dark mode supported via existing Tailwind class strategy (no `next-themes`).
- New page-specific components must live in each page's `/_components` folder.
- `User.email` must be unique.
- `User` can have `github_id`, `google_id`, or both; not neither.
- If same email signs in via second provider, link to existing user record (single user row).
- `Task`, `Note`, `Event` must include required `user_id`.
- Server-side filtering by current session user in dashboard data queries.

### Must Not
- Do not add email/password auth.
- Do not introduce `next-themes`.
- Do not modify unrelated pages/features.

### Out of Scope
- Password reset / email verification.
- Profile editing UI.
- Admin role/permissions model.
- Multi-tenant org/workspace support.

## Current State

- Dashboard data is global and unscoped:
  - `src/app/dashboard/page.tsx` loads all records via `prisma.task/note/event.findMany(...)`.
- Brain dump action creates global records (no user relation):
  - `src/app/actions/processBrainDump.ts` uses `createMany` for tasks/notes/events.
- Prisma schema has only:
  - `prisma/schema.prisma`: `Task`, `Note`, `Event` (no `User`, no foreign keys).
- Public landing page and dashboard already use consistent Tailwind visual language:
  - `src/app/page.tsx`
  - `src/app/dashboard/_components/*`
- Theme classes already use `dark:*` utilities, with light-first defaults.

## Tasks

### T1: Add auth infrastructure (NextAuth + providers)
**What:** Configure NextAuth with GitHub and Google providers, set session strategy, expose auth helpers for server components/actions, and protect `/dashboard/*` routes.  
**Files:** `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`.  
**Verify:** Manual OAuth login/logout works; unauthenticated access to `/dashboard` redirects to `/signin`.

### T2: Extend Prisma schema for user + ownership
**What:** Add `User` model with fields `id`, `username`, `email`, `github_id`, `google_id`, plus relations to tasks/notes/events. Add required `user_id` foreign key to `Task`, `Note`, and `Event`.  
**Files:** `prisma/schema.prisma`, generated Prisma client artifacts.  
**Verify:** `pnpm prisma migrate dev` succeeds; DB reflects required foreign keys and unique email.

### T3: Implement OAuth account linking
**What:** In auth callbacks, resolve sign-in by provider ID first, then by email for cross-provider linking, otherwise create a new user. Seamlessly sign in existing users.  
**Files:** `src/auth.ts`.  
**Verify:** Same-email GitHub->Google flow keeps a single user record; different email creates a new account.

### T4: Build `/signup` and `/signin` pages
**What:** Create responsive auth pages with simple copy and two OAuth buttons (Google and GitHub), styled consistent with landing/dashboard, and redirect authenticated users to `/dashboard`.  
**Files:** `src/app/signup/page.tsx`, `src/app/signup/_components/*`, `src/app/signin/page.tsx`, `src/app/signin/_components/*`.  
**Verify:** Pages render on mobile/desktop, support dark classes, and buttons trigger provider login.

### T5: Scope dashboard reads by session user
**What:** Update dashboard server query to filter tasks/notes/events by `user_id` from current session.  
**Files:** `src/app/dashboard/page.tsx`.  
**Verify:** Different users see only their own records.

### T6: Scope brain dump writes by session user
**What:** Require auth in `processBrainDump` and attach `user_id` on inserted tasks/notes/events.  
**Files:** `src/app/actions/processBrainDump.ts`.  
**Verify:** New records include current user's `user_id`; unauthenticated submission is rejected.

### T7: Route access and redirect behavior
**What:** Keep `/`, `/signin`, `/signup` public, protect `/dashboard/*`, and redirect authenticated users away from signin/signup to dashboard.  
**Files:** `src/middleware.ts`, `src/app/signin/page.tsx`, `src/app/signup/page.tsx`.  
**Verify:** Route matrix behaves as expected.

### T8: Data reset and migration
**What:** Since existing data can be discarded, reset local SQLite data during migration if required to enforce new non-null `user_id` constraints.  
**Files:** Prisma migration files.  
**Verify:** Fresh schema applies cleanly and app works with new auth model.

### T9: Add provider setup documentation
**What:** Create two markdown setup guides under `src/docs`, one for GitHub OAuth and one for Google OAuth. Each guide must include step-by-step instructions to create the OAuth app in the provider dashboard and list all required environment variables for local development.  
**Files:** `src/docs/github-auth-setup.md`, `src/docs/google-auth-setup.md`.  
**Verify:** Following each guide from scratch results in valid provider credentials and correctly populated `.env` values used by NextAuth.

## Validation

- `pnpm prisma migrate dev`
- `pnpm prisma generate`
- `pnpm lint`
- `pnpm build`
- Manual E2E:
  - Visit `/signup`, register with GitHub, land on `/dashboard`.
  - Logout, register with Google using same email, confirm same account data.
  - Create tasks/notes/events as user A; confirm invisible to user B.
  - Confirm `/` remains public and responsive.
  - Confirm light default and dark mode styles render correctly on signin/signup/dashboard.
  - Follow `src/docs/github-auth-setup.md` and `src/docs/google-auth-setup.md` to verify docs are complete and actionable.
