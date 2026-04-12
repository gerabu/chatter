# Foundation (Contracts, Database, and State Machine)

## Why

Before any user interfaces or LLM capabilities are built, we need a reliable foundation. A properly modeled database using Prisma and SQLite, supported by identical Zod schema contracts and a strictly typed state machine for Tasks, secures the structural integrity of this Next.js app.

## What

- A functioning local SQLite database with Prisma ORM.
- Database models and parallel Zod contracts for `Task`, `Note`, and `Event`.
- A pure TypeScript state transition function that strictly delegates how Task states can be updated.
- Fully operational unit tests confirming state limits and boundaries using Vitest.

## Context

**Relevant files:**
- `prisma/schema.prisma` — Source of truth for database models.
- `src/contracts.ts` — Contains matching Zod schema definitions.
- `src/lib/state-machine.ts` — Contains the pure function defining rules and blocks for status transitions.
- `src/lib/state-machine.test.ts` — Asserts boundaries for the status transition mapping.

**Key decisions already made:**
- Framework: Next.js App Router.
- Database: SQLite with Prisma.
- Validation: Zod.
- Domain Statuses: `TODO`, `DONE`, `MIGRATED`, `CANCELLED` (Strict typing required).

## Constraints

**Must:**
- Model `Task`: `id`, `title`, `status`, `createdAt`.
- Model `Note`: `id`, `content`, `createdAt`.
- Model `Event`: `id`, `title`, `dateISO`, `createdAt`.
- Statuses must exclusively be: `TODO`, `DONE`, `MIGRATED`, `CANCELLED`.
- Task state transitions must block invalid operations (e.g., going backwards from CANCELLED to DONE).
- State functions must remain pure UI-agnostic TypeScript logic.

**Must not:**
- Build any user interfaces or web routes.
- Include any LLM integration.

## Tasks

### T1: Setup Prisma & Database Models

**Do:** Install Prisma and Prisma Client. Initialize Prisma with a SQLite provider. Define the `Task` (with Enum/String statuses), `Note`, and `Event` schema configurations including required fields and IDs.

**Files:** `prisma/schema.prisma`

**Verify:** `npx prisma validate` passes cleanly.

### T2: Generate Zod Contracts

**Do:** Install Zod. Produce identical Zod validations for the database domains inside `contracts.ts`, explicitly typing the Task statuses as an exclusive enumeration or union string. 

**Files:** `src/contracts.ts`

**Verify:** TypeScript types generated through `z.infer` cleanly compile.

### T3: Task State Machine Implementation

**Do:** Author a pure TypeScript utility taking a `currentStatus` and a `targetStatus` (along with any domain validations) and resolving valid/invalid actions. Specifically prevent nonsensical actions like resolving a `CANCELLED` task directly into `DONE`.

**Files:** `src/lib/state-machine.ts`

**Verify:** "Manual: Read utility rules and inspect the transition maps."

### T4: Write State Machine Tests

**Do:** Setup Vitest (or Jest if strictly preferred), and compose an array of test cases measuring both happy path state migrations and rejecting invalid state transitions to guarantee isolation of logic bugs.

**Files:** `src/lib/state-machine.test.ts`

**Verify:** `npm run test` executes successfully and all cases pass.

## Done

- [x] `npx prisma format` runs properly.
- [x] No regression bugs regarding mismatched properties between Zod and Prisma.
- [x] 100% boundary testing for pure State Machine logics with correct rejections.
- [x] No UI dependencies were introduced.
