# Task Status Change

## Why

Users can capture tasks via brain dump but cannot correct or progress them after creation. A status control on each task card lets users mark work done, cancel, migrate, or reopen items without leaving the board.

## What

- Replace the read-only status badge on each task card with a **native `<select>`** dropdown bound to the task’s current status.
- Dropdown options are limited to **valid target statuses** per `src/lib/state-machine.ts` (current status plus allowed transitions; invalid targets are not offered).
- Persist status changes via a new **server action** that validates auth, ownership, and transitions before updating Prisma.
- In the **Tasks** column, split the list:
  - **Active area:** tasks with status `TODO` or `MIGRATED` (newest first, matching current `orderBy`).
  - **Collapsible section** (between active tasks and the column footer): tasks with status `DONE` or `CANCELLED`, collapsed by default, with a header showing count (e.g. “Completed & cancelled (3)”).
- After a successful change, refresh the board (`router.refresh()`), consistent with `BrainDumpForm`.

## Constraints

### Must
- Enforce transitions with `canTransitionTask` / `transitionTask` from `src/lib/state-machine.ts` on the server; never persist a status the state machine rejects.
- Derive client dropdown options from the same rules (e.g. helper that returns allowed targets for a given `TaskStatus`, or reuse `canTransitionTask` in a small shared util).
- Use `TaskStatus` / `TaskStatusSchema` from `src/contracts.ts`.
- Use Next.js App Router + `"use server"` action pattern (same as `processBrainDump`).
- Scope UI changes to `src/app/app/_components/` and new action under `src/app/actions/`.
- Tailwind utility classes only; include light/dark variants; no global CSS edits.
- Native `<select>` only (no new UI libraries).

### Must Not
- Do not add npm dependencies for this feature.
- Do not weaken or bypass `ALLOWED_TRANSITIONS` in the state machine.
- Do not allow updating tasks belonging to another user.
- Do not implement drag-and-drop, bulk status change, or task delete.
- Do not modify unrelated routes or the brain-dump LLM flow except where revalidation/refresh is needed.

### Out of Scope
- Editing task title or deleting tasks.
- Sorting/filtering beyond active vs collapsed grouping.
- API route (`/api/...`) — server action only.
- Changing status rules in `state-machine.ts` (use as-is unless a bug is found).

## Current State

- Dashboard at `src/app/app/page.tsx` loads all tasks for the signed-in user (`orderBy: { createdAt: "desc" }`) and passes them to `Board`.
- `Board` renders every task in the Tasks column via `TaskCard` (`src/app/app/_components/Board.tsx`, `TaskCard.tsx`).
- `TaskCard` shows a static status badge (`statusStyles` map); no mutation.
- Status transition rules are defined and tested:
  - `src/lib/state-machine.ts` — `canTransitionTask`, `transitionTask`
  - `src/lib/state-machine.test.ts`
- Prisma `TaskStatus` enum: `TODO`, `DONE`, `MIGRATED`, `CANCELLED` (`prisma/schema.prisma`).
- No existing `updateTaskStatus` action or task update API.

**Valid transitions (reference):**

| From       | Allowed targets      |
|-----------|----------------------|
| `TODO`    | `DONE`, `MIGRATED`, `CANCELLED` |
| `DONE`    | `TODO`               |
| `MIGRATED`| _(none — terminal)_  |
| `CANCELLED` | `TODO` only        |

## Tasks

### T1: Server action — update task status
**What:** Add `updateTaskStatus(taskId: string, targetStatus: TaskStatus)` in `src/app/actions/updateTaskStatus.ts`. Require session; load task by `id` + `user_id`; validate `targetStatus` with Zod; call `transitionTask(current, target)`; `prisma.task.update`; return `{ success: true }` or `{ success: false, error: string }`. On success, call `revalidatePath("/app")` (or path used by dashboard).
**Files:** `src/app/actions/updateTaskStatus.ts`
**Verify:** `pnpm test` (existing suite still passes). Manual: invalid transition (e.g. `CANCELLED` → `DONE`) returns error and DB unchanged.

### T2: Allowed-status helper for UI
**What:** Add a small function (e.g. `getAllowedTaskStatuses(current: TaskStatus): TaskStatus[]`) that returns `[current, ...ALLOWED_TRANSITIONS[current]]` or equivalent using `canTransitionTask`, so the dropdown only lists selectable values. Place in `src/lib/state-machine.ts` or `src/lib/task-status-options.ts` (prefer extending state-machine if it stays one file).
**Files:** `src/lib/state-machine.ts` (or new lib file), optional unit tests in `src/lib/state-machine.test.ts`
**Verify:** `pnpm test` — add cases for TODO, DONE, MIGRATED, CANCELLED option lists.

### T3: Task status dropdown on card
**What:** Convert `TaskCard` to a client component (or extract `TaskStatusSelect` client child). Replace badge with `<select>` styled with existing `statusStyles` (border/background on the control). On change, `useTransition` + `updateTaskStatus` + `router.refresh()`; disable select while pending; show inline error on failure. Options from T2 helper.
**Files:** `src/app/app/_components/TaskCard.tsx` (and optional `TaskStatusSelect.tsx`)
**Verify:** Manual — change `TODO` → `DONE` persists after refresh; `MIGRATED` task shows select with only current value (no illegal options).

### T4: Split Tasks column — active vs collapsible
**What:** In `Board`, partition `tasks` into `active` (`TODO`, `MIGRATED`) and `closed` (`DONE`, `CANCELLED`). Render active list first, then a `<details>` (or button + conditional) collapsible block for closed tasks, default `open={false}`. Update Tasks column `itemCount` to total tasks or document choice (recommend total count unchanged). Empty states: keep single “No tasks yet” when `tasks.length === 0`; if only closed tasks exist, active area can be empty without duplicate empty copy.
**Files:** `src/app/app/_components/Board.tsx`, optional `CompletedTasksSection.tsx`
**Verify:** Manual — `DONE`/`CANCELLED` cards appear only inside collapsed section; expanding shows them with working dropdowns.

### T5: Types and page props
**What:** Type `TaskItem.status` as `TaskStatus` (import from contracts) in `Board` / `TaskCard` instead of `string`. Ensure `page.tsx` serialized task props remain compatible (Prisma enum strings match schema).
**Files:** `src/app/app/_components/Board.tsx`, `TaskCard.tsx`, `src/app/app/page.tsx` (only if typing/mapping needed)
**Verify:** `pnpm lint` and `pnpm build` succeed.

## Validation

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Manual check on `/app` (signed in):
  - Active tasks (`TODO`, `MIGRATED`) render above the collapsible section.
  - `DONE` and `CANCELLED` tasks render inside the collapsed section; section expands/collapses.
  - Status dropdown replaces badge; only valid targets appear.
  - `TODO` → `DONE` moves card into collapsed section after refresh.
  - `DONE` → `TODO` moves card back to active area.
  - `CANCELLED` → `DONE` is not offered and server rejects if forced.
  - `MIGRATED` task cannot change status (dropdown shows current only or is disabled).
  - Light/dark styles remain acceptable on select and collapsible header.
