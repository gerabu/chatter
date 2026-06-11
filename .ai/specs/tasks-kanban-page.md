# Tasks Kanban Page

## Why

Tasks share a single column with notes and events on the dashboard, which limits how much task state is visible at a glance. Moving tasks to a dedicated kanban page gives each status its own column and frees the dashboard for notes and events.

## What

A new page at `/app/tasks` that renders the user's tasks as a kanban board with four fixed columns in this order: **To do → In Progress → Done → Cancelled** (one column per `TaskStatus`). The `BrainDumpChat` sidebar becomes part of a shared layout so it is available on both `/app` and `/app/tasks`. The dashboard (`/app`) keeps only Notes and Events. Simple nav links allow switching between the two pages.

## Constraints

### Must
- Read the relevant guides in `node_modules/next/dist/docs/01-app/` (layouts-and-pages, linking-and-navigating, fetching-data) before writing code — this Next.js version (16.x) may differ from training data.
- Reuse existing components where possible: `BoardColumn` for kanban columns, `TaskCard` for cards, `EmptyState` pattern from `Board.tsx`.
- Keep status changes going through the existing `updateTaskStatus` server action and the state machine in `src/lib/state-machine.ts` (status dropdown on `TaskCard` stays as-is).
- Column order is fixed and derived from the `TaskStatus` enum order: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
- Each page keeps its own `auth()` check + redirect to `/auth/signin` (the layout must not be the only auth gate).
- Match the existing visual language: stone palette, dotted board background, existing status badge colors (amber/blue/emerald/rose), Tailwind v4 utility classes.

### Must Not
- No new dependencies.
- No changes to the Prisma schema, `contracts.ts`, or the state machine.
- Don't modify unrelated code (auth routes, landing page, brain dump agent logic).

### Out of Scope
- Drag-and-drop of task cards between columns.
- Reordering or collapsing columns — order is always fixed, To do through Cancelled.
- Manual ordering of cards within a column (keep `createdAt desc`).
- Creating/editing tasks from the kanban page (creation stays via brain dump).
- Mobile-specific kanban interactions beyond basic responsive stacking.

## Current State

- `src/app/app/page.tsx` — server page; does auth, fetches tasks/notes/events in parallel, and renders the whole shell inline: a 12-col grid with an `<aside>` (empty `flex-1` spacer + `BrainDumpChat` at the bottom, `lg:col-span-3`) and the `Board` (`lg:col-span-9`). There is **no** `src/app/app/layout.tsx`.
- `src/app/app/_components/Board.tsx` — 3-column grid (Tasks / Notes / Events) using `BoardColumn`. The `TasksColumn` helper splits tasks into active (`TODO`, `IN_PROGRESS`) and a collapsible "Completed & cancelled" `<details>` section. This component owns the dotted-background scroll container.
- `src/app/app/_components/BoardColumn.tsx` — generic column with title + item-count badge; reusable as a kanban column.
- `src/app/app/_components/TaskCard.tsx` — exports `TaskCard` and `TaskItem` (`{ id, title, status }`); has the status dropdown wired to `updateTaskStatus`.
- `src/app/app/_components/BrainDumpChat.tsx` — client component; calls `router.refresh()` after applying actions, so it works on whichever route it's rendered in.
- `src/app/actions/updateTaskStatus.ts:55` and `src/app/actions/applyBrainDumpActions.ts:143` — both call `revalidatePath("/app")` only.
- Statuses: `TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"])` in `src/contracts.ts`; display labels live in `TaskCard.tsx`.
- No navigation component exists anywhere in the app shell.

## Tasks

### T1: Shared layout with BrainDumpChat sidebar and nav
**What:** Create `src/app/app/layout.tsx` holding the shell currently inlined in `page.tsx`: the `h-screen` 12-col grid, the `<aside>` with `BrainDumpChat` (`lg:col-span-3`), and the main content area (`lg:col-span-9`). The nav lives at the top of the **main content area** (a bordered header bar above `{children}`), not in the sidebar — the aside keeps its `flex-1` spacer + `BrainDumpChat` pinned at the bottom. Build the nav as a shadcn-tabs-style segmented control (per https://ui.shadcn.com/docs/components/radix/tabs): a `next/link` client component (`AppNav.tsx`, uses `usePathname` for the active state) styled to mirror shadcn's `TabsList`/`TabsTrigger` — a muted rounded-lg pill container (`bg-stone-100 dark:bg-stone-800`, `p-[3px]`) with triggers that, when active, get `bg-white dark:bg-stone-950` + `shadow-sm` and rounded-md. No radix/shadcn dependency — replicate the look with the stone palette. Links: **Dashboard** (`/app`) and **Tasks** (`/app/tasks`). Slim `src/app/app/page.tsx` down to: auth check, fetch notes + events (drop the tasks query), render `Board`.
**Files:** `src/app/app/layout.tsx` (new), `src/app/app/_components/AppNav.tsx` (new), `src/app/app/page.tsx`
**Verify:** `pnpm dev` → `/app` renders identically except the tasks column; BrainDumpChat in the sidebar, tabs-style nav at the top of the main content area with the current route highlighted.

### T2: Remove tasks from the dashboard Board
**What:** In `Board.tsx`, remove the `TasksColumn` helper, `ACTIVE_STATUSES`/`CLOSED_STATUSES`, the tasks `BoardColumn`, and the `tasks` prop; switch the grid to 2 columns (`xl:grid-cols-2`). Keep the dotted-background container, since `/app` still uses it.
**Files:** `src/app/app/_components/Board.tsx`
**Verify:** `/app` shows only Notes and Events; no TypeScript errors (`pnpm tsc --noEmit` or `pnpm build`).

### T3: Tasks kanban page
**What:** Create `src/app/app/tasks/page.tsx` (server page): auth check + redirect, fetch tasks (`deleted_at: null`, `orderBy createdAt desc`), render a new `TasksBoard` component. Create `src/app/app/_components/TasksBoard.tsx`: same dotted-background scroll container as `Board`, with a 4-column grid (stacks to 1 col on small screens, e.g. `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`). One `BoardColumn` per status in fixed order To do / In Progress / Done / Cancelled, each filtering its tasks and rendering `TaskCard`s, with an empty state per column ("No tasks here."). Reuse the status labels — export `statusLabels` from `TaskCard.tsx` (or a small shared module) instead of duplicating them.
**Files:** `src/app/app/tasks/page.tsx` (new), `src/app/app/_components/TasksBoard.tsx` (new), `src/app/app/_components/TaskCard.tsx` (export labels)
**Verify:** `/app/tasks` shows 4 columns in order with correct counts; changing a task's status via the dropdown moves it to the matching column after refresh.

### T4: Revalidate both routes in server actions
**What:** Add `revalidatePath("/app/tasks")` next to the existing `revalidatePath("/app")` in `updateTaskStatus.ts` and `applyBrainDumpActions.ts` so task mutations refresh both pages regardless of where they were triggered.
**Files:** `src/app/actions/updateTaskStatus.ts`, `src/app/actions/applyBrainDumpActions.ts`
**Verify:** Apply a brain-dump action that creates a task while on `/app/tasks` → new card appears without a manual reload.

## Validation

- `pnpm build` (catches type errors and validates both routes compile).
- `pnpm lint` if configured.
- Manual check:
  - `/app`: sidebar has nav + BrainDumpChat; board shows Notes and Events only.
  - `/app/tasks`: sidebar identical (shared layout, chat state survives navigation between pages since the layout doesn't remount); board shows To do / In Progress / Done / Cancelled columns in that fixed order.
  - Change a task from To do → In Progress on `/app/tasks`: card moves columns; invalid transitions still blocked by the dropdown.
  - From `/app/tasks`, use BrainDumpChat to create a task → it appears in To do after applying.
  - Unauthenticated visit to `/app/tasks` redirects to `/auth/signin`.
