# Dashboard Brain Dump Workspace

## Why

Users need a single focused workspace where they can quickly paste unstructured thoughts and instantly see organized Tasks, Notes, and Events side-by-side. This closes the loop between capture and clarity without forcing context switching.

## What

- Build `/dashboard` as a two-panel page:
  - Left panel (1/3 width): Brain dump textarea + submit button wired to the existing server action.
  - Right panel (2/3 width): Three-column board for Tasks, Notes, and Events.
- Use server actions and progressive enhancement to show a submit loading state (`Loading...`) while processing.
- Persist and render categorized results from the existing database records.
- Apply a modern, sleek visual treatment with Tailwind utility classes only (including light/dark variants), with a pegboard-like dotted board background.
- Use local dashboard-scoped component organization under `_components`.

## Constraints

### Must
- Use Next.js App Router patterns compatible with server actions.
- Reuse existing action `processBrainDump` (modify it only if required for form compatibility or robust validation).
- Use Zod contracts already defined in `src/contracts.ts`.
- Implement dashboard components inside `src/app/dashboard/_components/`.
- No `useEffect` usage for loading or fetch orchestration.
- No global CSS additions or edits for this feature.
- Include Tailwind dark/light classes in all new UI components, while defaulting to current light appearance.
- Tasks column must render status badges for each task item.

### Must Not
- Do not create a new server action.
- Do not add sorting/filtering behaviors.
- Do not implement status mutation controls.
- Do not implement delete controls for tasks, notes, or events.
- Do not modify unrelated routes/styles outside feature scope.

### Out of Scope
- Sorting and filtering.
- Changing task status.
- Deleting tasks, notes, and events.

## Current State

- Existing action parses and persists brain dump output:
  - `src/app/actions/processBrainDump.ts`
- Existing contracts and status enum:
  - `src/contracts.ts`
- Dashboard route file do not exists:
  - `src/app/dashboard/page.tsx`
- No existing dashboard component structure yet:
  - `src/app/dashboard/_components/` (to be created)

## Tasks

### T1: Define Dashboard Route Composition
**What:** Implement `src/app/dashboard/page.tsx` as a server-first route that lays out two adjacent panels (`grid`/`flex`) with 1/3 and 2/3 distribution, and loads initial board data from Prisma on render.
**Files:** `src/app/dashboard/page.tsx`
**Verify:** Manual UI check confirms left/right panel ratio and initial Tasks/Notes/Events content render on first load.

### T2: Build Brain Dump Input Panel Components
**What:** Create `_components` for a brain dump form with textarea and submit button, using the existing `processBrainDump` action. Use form submission with pending state (`Loading...`) via server action-friendly APIs (no `useEffect`).
**Files:** `src/app/dashboard/_components/BrainDumpForm.tsx`, `src/app/dashboard/_components/PanelShell.tsx` (optional shared shell), `src/app/actions/processBrainDump.ts` (only if small compatibility update is needed)
**Verify:** Submitting non-empty textarea triggers action, button displays loading text during request, and successful submit updates visible board content after refresh/revalidation strategy.

### T3: Build Three-Column Board Components
**What:** Implement board and column/item UI components for Tasks, Notes, and Events with clear section titles, empty states, and task status badges. Render events with readable date formatting while preserving stored ISO source data.
**Files:** `src/app/dashboard/_components/Board.tsx`, `src/app/dashboard/_components/BoardColumn.tsx`, `src/app/dashboard/_components/TaskCard.tsx`, `src/app/dashboard/_components/NoteCard.tsx`, `src/app/dashboard/_components/EventCard.tsx`
**Verify:** Manual check confirms exactly three columns and that each record type appears in its correct column.

### T4: Add Pegboard Visual Styling with Theme Variants
**What:** Style the right panel board with a plain base color and subtle dotted pegboard effect using Tailwind utilities (arbitrary values where needed), ensuring both light and dark class variants are present.
**Files:** `src/app/dashboard/page.tsx`, `src/app/dashboard/_components/Board.tsx`
**Verify:** Manual check confirms dotted background appearance in light theme and class coverage for dark mode.

### T5: Add Input Validation and UX Guardrails
**What:** Ensure empty/whitespace-only brain dumps are rejected before processing (client and/or server action boundary), and surface concise inline feedback without global toast infrastructure.
**Files:** `src/app/dashboard/_components/BrainDumpForm.tsx`, `src/app/actions/processBrainDump.ts` (if needed)
**Verify:** Submitting blank input prevents processing and shows validation guidance.

## Validation

- `pnpm lint`
- `pnpm test`
- Manual check in browser:
  - Open `/dashboard` and confirm modern two-panel layout.
  - Left panel contains textarea and submit button.
  - Submit button shows `Loading...` while processing.
  - Right panel shows Tasks/Notes/Events columns with task statuses.
  - Pegboard dotted background is visible in board area.
  - Light and dark Tailwind variants exist on new components.
