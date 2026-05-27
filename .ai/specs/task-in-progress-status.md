# Task In Progress Status

## Why

Users can mark tasks done or cancelled but cannot indicate work has started without finishing. An **In Progress** status supports a lightweight workflow (start work, pause back to todo) on the board using the status dropdown already on each task card.

## What

- Replace **`MIGRATED`** with **`IN_PROGRESS`** everywhere task status is defined (Zod, Prisma, UI styles, brain-dump prompt).
- Update **`src/lib/state-machine.ts`** and **`src/lib/state-machine.test.ts`** for the new status set and transitions.
- Users can set a task to **In Progress** via the **existing native `<select>`** on `TaskCard` (no new UI control).
- **`IN_PROGRESS`** tasks appear in the **active** Tasks column area (same as `TODO`), not in the collapsed completed section.

## Constraints

### Must
- Status enum values: **`TODO`**, **`IN_PROGRESS`**, **`DONE`**, **`CANCELLED`** (no `MIGRATED`).
- State machine transitions:
  - `TODO` → `IN_PROGRESS`, `DONE`, `CANCELLED`
  - `IN_PROGRESS` → `TODO` only
  - `DONE` → `TODO`
  - `CANCELLED` → `TODO`
- Enforce transitions on the server via `transitionTask` / `canTransitionTask` (existing `updateTaskStatus` action).
- Dropdown options continue to come from `getAllowedTaskStatuses` in `src/lib/state-machine.ts`.
- Use `TaskStatus` / `TaskStatusSchema` from `src/contracts.ts`.
- Migrate existing DB rows with `status = 'MIGRATED'` before removing the enum value (map to `TODO`).
- Tailwind-only styling; add `IN_PROGRESS` entry to `statusStyles` in `TaskCard.tsx` (reuse or adapt the former `MIGRATED` blue palette).

### Must Not
- Do not add npm dependencies.
- Do not replace the native `<select>` or add a new status picker component.
- Do not implement drag-and-drop, bulk status change, or task delete.
- Do not allow `IN_PROGRESS` → `DONE` / `CANCELLED` directly (must return to `TODO` first).

### Out of Scope
- Sub-columns or swimlanes for in-progress vs todo.
- Editing task title or deleting tasks.
- Changing collapsed-section behavior beyond swapping `MIGRATED` for `IN_PROGRESS` in active grouping.
- API routes — keep server action only.

## Current State

- Task status dropdown and `updateTaskStatus` are implemented (`src/app/app/_components/TaskCard.tsx`, `src/app/actions/updateTaskStatus.ts`).
- Board splits tasks: active = `TODO` | `MIGRATED`; closed = `DONE` | `CANCELLED` (`src/app/app/_components/Board.tsx`).
- State machine (`src/lib/state-machine.ts`):
  - `TODO` → `DONE`, `MIGRATED`, `CANCELLED`
  - `MIGRATED` terminal
- Prisma enum (`prisma/schema.prisma`): `TODO`, `DONE`, `MIGRATED`, `CANCELLED`.
- Contracts (`src/contracts.ts`): `TaskStatusSchema` matches Prisma today.
- Brain dump uses `TaskSchema` and system prompt listing `MIGRATED` (`src/app/actions/processBrainDump.ts`).

**Target transitions (reference):**

| From            | Allowed targets              |
|-----------------|------------------------------|
| `TODO`          | `IN_PROGRESS`, `DONE`, `CANCELLED` |
| `IN_PROGRESS`   | `TODO`                       |
| `DONE`          | `TODO`                       |
| `CANCELLED`     | `TODO`                       |

## Tasks

### T1: Contracts and Prisma schema
**What:** Update `TaskStatusSchema` in `src/contracts.ts` to `["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]`. Update `enum TaskStatus` in `prisma/schema.prisma` accordingly. Create and apply a migration that: (1) adds `IN_PROGRESS` to the Postgres enum, (2) `UPDATE` tasks with `MIGRATED` → `TODO`, (3) removes `MIGRATED` from the enum. Regenerate Prisma client.
**Files:** `src/contracts.ts`, `prisma/schema.prisma`, new file under `prisma/migrations/`
**Verify:** `pnpm prisma migrate dev` (or project migrate command) succeeds; `pnpm build` compiles with new generated types.

### T2: State machine and tests
**What:** Replace `MIGRATED` with `IN_PROGRESS` in `ALLOWED_TRANSITIONS`. Set `TODO: ["IN_PROGRESS", "DONE", "CANCELLED"]` and `IN_PROGRESS: ["TODO"]`. Update `src/lib/state-machine.test.ts`: remove MIGRATED cases; add tests for `TODO` ↔ `IN_PROGRESS`, `getAllowedTaskStatuses("IN_PROGRESS")` → `["IN_PROGRESS", "TODO"]`, and blocked `IN_PROGRESS` → `DONE`.
**Files:** `src/lib/state-machine.ts`, `src/lib/state-machine.test.ts`
**Verify:** `pnpm test`

### T3: UI — dropdown styles and board grouping
**What:** In `TaskCard.tsx`, remove `MIGRATED` from `statusStyles`; add `IN_PROGRESS` styles (suggest reusing the blue MIGRATED palette). In `Board.tsx`, set `ACTIVE_STATUSES` to `["TODO", "IN_PROGRESS"]`. No structural change to the dropdown — options flow from updated `getAllowedTaskStatuses`.
**Files:** `src/app/app/_components/TaskCard.tsx`, `src/app/app/_components/Board.tsx`
**Verify:** Manual — `TODO` dropdown offers `IN_PROGRESS`; `IN_PROGRESS` dropdown offers only `TODO` (plus current).

### T4: Brain dump prompt
**What:** Update the system prompt status list in `processBrainDump.ts` from `MIGRATED` to `IN_PROGRESS` (and list all four valid statuses). `BrainDumpExtractionSchema` already uses `TaskSchema`, so it picks up contract changes automatically.
**Files:** `src/app/actions/processBrainDump.ts`
**Verify:** `pnpm build`; optional manual brain dump still creates valid tasks.

### T5: Repo-wide cleanup
**What:** Grep for `MIGRATED` under `src/` and fix any remaining references (tests, comments, types). Leave historical migration SQL files unchanged.
**Files:** Any stragglers found by grep
**Verify:** `pnpm lint`, `pnpm test`, `pnpm build`

## Validation

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Manual check on `/app` (signed in):
  - `TODO` → `IN_PROGRESS` persists after refresh; card stays in the active area.
  - `IN_PROGRESS` → `TODO` persists; card stays in the active area.
  - `TODO` → `DONE` still works; card moves to collapsed section.
  - `IN_PROGRESS` dropdown does not offer `DONE` or `CANCELLED`.
  - No task or UI references `MIGRATED`.
  - Existing DB tasks formerly `MIGRATED` show as `TODO` after migration.
