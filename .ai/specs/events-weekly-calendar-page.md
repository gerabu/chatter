# Events Weekly Calendar Page

## Why

Events currently share the dashboard with notes as a flat, create-order list, which makes it hard to see *when* things happen. Moving events to a dedicated `/app/events` page with a weekly calendar lets the user see their week at a glance, with events placed under the day they occur and ordered by time.

## What

A new authenticated page at **`/app/events`** that renders a **weekly calendar**:

- Shows **one week at a time**, starting on **Monday** (Mon–Sun), defaulting to the **current week** on load.
- **Navigation controls** to jump to the previous week, the next week, and back to today, plus a label showing the visible week's date range.
- **Seven day columns**. Each column lists that day's events stacked vertically, **sorted by time ascending** (earliest at top), each showing the event's **time + title**. Today's column is visually highlighted.
- The **`BrainDumpChat`** stays available on this page because it lives in the shared `/app` layout sidebar (no change needed to keep it — verify it renders).
- Events are **removed from the dashboard** (`/app`): the dashboard becomes notes-only.

## Constraints

### Must
- Route at `src/app/app/events/page.tsx`, an async **Server Component** following the exact pattern of `src/app/app/tasks/page.tsx`: `auth()` → redirect to `/auth/signin` if no `userId` → fetch via `prisma` → render a presentational component.
- Fetch only the signed-in user's non-deleted events: `prisma.event.findMany({ where: { user_id: userId, deleted_at: null } })`.
- Week navigation and day grouping happen in a **Client Component** (week state lives in the browser; navigation must be instant with no server round-trip). Pass all fetched events as props from the server page.
- Week starts **Monday**. Compute the Monday anchor with local-time date math (e.g. offset `= (date.getDay() + 6) % 7`).
- Parse `dateISO` with `new Date(dateISO)` and group/sort/display using **local time**, consistent with the existing `formatDate` in `EventCard.tsx`. Events with an unparseable `dateISO` (`Number.isNaN(date.getTime())`) are skipped from the grid (not shown).
- Reuse existing visual language: stone color palette, rounded cards, dotted-grid background container, and `BoardColumn`-style headers where it fits. Use Tailwind classes already present in the repo; use `lucide-react` icons for nav controls (e.g. `ChevronLeft` / `ChevronRight`).
- Add an **"Events"** link to `src/app/app/_components/AppNav.tsx`.
- Add `revalidatePath("/app/events")` to `src/app/actions/applyBrainDumpActions.ts` so brain-dump event create/update/delete refreshes the calendar.
- Must `pnpm run lint` clean and `next build` type-check successfully (the app uses Next.js 16 typed routes — adding the new route makes the `/app/events` href valid).

### Must Not
- No new dependencies. No `date-fns`/`dayjs`/calendar libraries — use native `Date` + `Intl.DateTimeFormat`.
- No changes to the Prisma schema or the `Event` data model.
- Do not modify `BrainDumpChat.tsx`, the `/app` layout structure, or unrelated actions/components beyond what's listed.
- **Out of scope (do not build):** drag-and-drop reordering, moving events between days, canceling/creating/editing events from the calendar UI, time-grid with hour gridlines (use a simple per-day sorted list), recurring events, all-day vs timed distinction.

## Current State

- **Shared layout** `src/app/app/layout.tsx` — auth gate + 12-col grid; left `aside` (col-span-3) holds `BrainDumpChat`, right `section` (col-span-9) renders `AppNav` + `{children}`. The new page inherits this automatically, so `BrainDumpChat` is already present.
- **Reference page** `src/app/app/tasks/page.tsx` — the exact server-page pattern to mirror (auth → redirect → prisma fetch → render board).
- **Reference board** `src/app/app/_components/TasksBoard.tsx` — column grid + `BoardColumn` + `EmptyState` styling to reuse.
- **Dashboard** `src/app/app/page.tsx` fetches `notes` and `events` in parallel and renders `Board`. `src/app/app/_components/Board.tsx` shows a 2-column grid (Notes | Events) using `EventCard.tsx`. Events must be removed from here.
- **Event shape** (from `prisma.event` / `EventCard`): `{ id: string; title: string; dateISO: string; createdAt: Date; deleted_at: Date | null; user_id: string }`. The calendar only needs `id`, `title`, `dateISO`.
- **Nav** `src/app/app/_components/AppNav.tsx` — `links` array drives the tab bar; currently `Dashboard` (`/app`) and `Tasks` (`/app/tasks`).
- **Brain-dump action** `src/app/actions/applyBrainDumpActions.ts` — creates/updates/soft-deletes events and currently calls `revalidatePath("/app")` and `revalidatePath("/app/tasks")`.
- `EventCard.tsx` becomes orphaned once removed from `Board.tsx` (it shows a medium date + short time, which is not the calendar's time-only format).

## Tasks

### T1: Events page route (server component)
**What:** Create `/app/events` server page mirroring `tasks/page.tsx`: `auth()`, redirect to `/auth/signin` when no `userId`, fetch the user's non-deleted events, render `<WeeklyCalendar events={events} />`.
**Files:** `src/app/app/events/page.tsx`
**Verify:** Visiting `/app/events` while signed in renders the calendar (signed-out redirects to sign-in).

### T2: WeeklyCalendar client component
**What:** Build a `"use client"` component holding the current-week anchor in state (default = today).
- Controls: previous week, today, next week (icons + accessible labels) and a label with the visible Mon–Sun range (`Intl.DateTimeFormat`).
- Compute the Monday-start week (local time) and the 7 days Mon→Sun.
- Group `events` into their day by comparing local Y/M/D; skip events whose `dateISO` is unparseable; within each day sort ascending by time.
- Render 7 day columns: header = weekday + date; today's column highlighted; each event shown as **time + title** (compact card). Days with no events show a subtle empty placeholder.
- Responsive: 7-column grid on `lg+`; on narrow screens a horizontally scrollable row of fixed-width day columns (`overflow-x-auto`), so it stays a week view. Top-level container should be scrollable like `TasksBoard` (`h-full min-h-0 overflow-y-auto`, dotted-grid background).
**Files:** `src/app/app/_components/WeeklyCalendar.tsx`
**Verify:** Manual — events land under the correct day, earliest-first; prev/next/today navigation works and updates the range label; current week shows by default with today highlighted.

### T3: Remove events from the dashboard
**What:** Make the dashboard notes-only: drop the `events` fetch from `DashboardPage`, update `Board` to render only the Notes column (full width), and remove the now-unused `EventCard` import/usage. Delete `EventCard.tsx` if it has no remaining references.
**Files:** `src/app/app/page.tsx`, `src/app/app/_components/Board.tsx`, `src/app/app/_components/EventCard.tsx` (delete if orphaned)
**Verify:** `/app` shows only Notes; `grep -rn "EventCard" src/` returns nothing if deleted; no dead imports.

### T4: Add Events to nav
**What:** Add `{ href: "/app/events", label: "Events" }` to the `links` array in `AppNav.tsx`.
**Files:** `src/app/app/_components/AppNav.tsx`
**Verify:** Nav shows Dashboard / Tasks / Events; active state correct on `/app/events`.

### T5: Revalidate calendar on brain-dump mutations
**What:** Add `revalidatePath("/app/events")` alongside the existing revalidate calls in `applyBrainDumpActions.ts`.
**Files:** `src/app/actions/applyBrainDumpActions.ts`
**Verify:** Using BrainDumpChat to add/update/delete an event refreshes the calendar without a manual reload.

## Validation

- `pnpm run lint` — clean.
- `pnpm exec tsc --noEmit` (or `next build`) — type-checks, including typed-route hrefs.
- Manual end-to-end:
  - `/app/events` renders the current week (Mon–Sun) with `BrainDumpChat` in the sidebar.
  - Events appear under the right day, sorted earliest→latest; today's column is highlighted.
  - Prev/Next/Today controls navigate weeks and update the range label.
  - Adding an event via BrainDumpChat (e.g. "schedule demo Thursday 3pm") appears on the calendar after the action applies.
  - Dashboard `/app` no longer shows events; Tasks page unaffected.
