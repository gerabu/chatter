# Note Soft Delete

## Why

Users need to remove notes they no longer want to see on their board. Soft delete keeps historical data in the database while hiding deleted notes from the UI immediately.

## What

Add a delete button (Lucide trash icon) on each note card that lets authenticated users soft-delete only their own notes by setting `deleted_at`. Notes where `deleted_at` is not null must be excluded from the notes column.

## Constraints

### Must
- Add a Lucide trash icon button to the right side of each note card.
- Enforce note ownership in delete logic (`user_id` + note `id`).
- Implement soft delete with a nullable `deleted_at` column on `Note`.
- Exclude soft-deleted notes from dashboard note queries.
- Follow existing Next.js App Router and Prisma patterns in this repository.

### Must Not
- Do not hard delete note records.
- Do not add new dependencies.
- Do not modify unrelated areas of the app.

### Out of Scope
- Undo/restore deleted notes.
- Bulk delete actions.
- Admin or cross-user note management.

## Current State

Notes are displayed in the board using `NoteCard` with only `id` and `content`. Dashboard notes are queried by `user_id` only, and the Prisma `Note` model currently does not include a soft-delete field.

- Relevant files: `prisma/schema.prisma`
- Relevant files: `src/app/app/page.tsx`
- Relevant files: `src/app/app/_components/Board.tsx`
- Relevant files: `src/app/app/_components/NoteCard.tsx`
- Relevant files: `src/app/actions/processBrainDump.ts`
- Existing patterns to follow: Server-side auth with `auth()`, Prisma access through `prisma`, App Router component composition in dashboard.

## Tasks

### T1: Add Note Soft-Delete Schema
**What:** Add nullable `deleted_at` (`DateTime?`) to `Note` in Prisma schema and create migration.
**Files:** `prisma/schema.prisma`, `prisma/migrations/*`
**Verify:** `pnpm prisma migrate dev`

### T2: Create Secure Delete Note Action
**What:** Implement a server action that validates the session user and soft-deletes a note by setting `deleted_at` only when `note.id` belongs to the current `user_id`.
**Files:** `src/app/actions/deleteNote.ts`
**Verify:** Manual test deleting own note succeeds; deleting another user note is rejected/no-op.

### T3: Add Note Delete UI Control
**What:** Update `NoteCard` to include a right-aligned delete button with Lucide trash icon and wire it to the delete server action.
**Files:** `src/app/app/_components/NoteCard.tsx`, `src/app/app/_components/Board.tsx` (if prop/action wiring is needed)
**Verify:** Delete button appears per note and removes the note from the board after action.

### T4: Filter Deleted Notes in Dashboard Query
**What:** Update notes query to only fetch notes with `deleted_at: null`.
**Files:** `src/app/app/page.tsx`
**Verify:** Soft-deleted notes do not render in the notes column.

## Validation

- `pnpm prisma migrate dev`
- `pnpm lint`
- Manual check: create note, delete it, confirm it disappears from notes column.
- Manual check: confirm deleted row remains in DB with `deleted_at` populated.
