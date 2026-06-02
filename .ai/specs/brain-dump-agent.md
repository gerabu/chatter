# Brain Dump Agent (Suggest → Review → Apply)

## Why

Today, brain dump only **creates** new tasks, notes, and events and writes them immediately. Users cannot express updates, deletions, cancellations, or status changes in natural language. Turning the aside into a **chat-style agent** that reads the user’s existing board, proposes a structured plan, and applies changes only after explicit approval makes brain dump a full board operator while keeping humans in control and avoiding invalid mutations (e.g. status on a note).

## What

- **Two-phase server flow:**
  1. **Suggest** — User submits brain-dump text; server loads the signed-in user’s tasks/notes/events, calls the LLM with that context, and returns a **validated flat list of actions** (no database writes).
  2. **Apply** — User approves a specific plan; server re-validates and executes mutations, then revalidates `/app`.

- **Action plan shape** — a flat array of discriminated action objects (easier for the LLM and apply loop). Each item includes `entityType` (`task` | `note` | `event`) where relevant:

```json
{
  "actions": [
    { "action": "CREATE", "entityType": "task", "title": "Buy flowers", "status": "TODO" },
    { "action": "CREATE", "entityType": "note", "content": "I like sunflowers" },
    { "action": "CREATE", "entityType": "event", "title": "Dinner", "dateISO": "2026-05-30T19:00:00Z" },
    { "action": "UPDATE", "entityType": "event", "id": "<uuid>", "title": "My birthday" },
    { "action": "CHANGE_STATUS", "entityType": "task", "id": "<uuid>", "status": "DONE" },
    { "action": "DELETE", "entityType": "note", "id": "<uuid>" }
  ]
}
```

**Action variants (Zod discriminated union on `action`):**

| `action` | `entityType` | Required fields | Optional fields |
|----------|--------------|-----------------|-----------------|
| `CREATE` | `task` \| `note` \| `event` | See entity below | — |
| `UPDATE` | `task` \| `note` \| `event` | `id` + ≥1 mutable field | `title`, `content`, `dateISO`, `status` (task only, rare) |
| `DELETE` | `task` \| `note` \| `event` | `id` | — |
| `CHANGE_STATUS` | **`task` only** | `id`, `status` | — |

**CREATE payloads by entity:**
- `task`: `title`; `status` optional (default `TODO`)
- `note`: `content`
- `event`: `title`, `dateISO` (ISO-8601)

**Invalid examples (must be rejected, never shown as applyable):**
```json
{ "action": "CHANGE_STATUS", "entityType": "event", "id": "<uuid>", "status": "CANCELLED" }
{ "action": "CHANGE_STATUS", "entityType": "note", "id": "<uuid>", "status": "DONE" }
```

- **Chat UI** in the dashboard aside: message history (user dumps + assistant previews). Each preview **groups** the flat `actions` array by `action` type for display (see UI grouping below). Per-preview **Accept** disappears or is disabled after successful apply.
- **Server-side validation** strips invalid items into `rejected[]`; only `validActions` are previewed and applyable.

### UI grouping (display only)

The LLM returns a **flat** `actions` array. The preview component **groups for readability** — order of groups fixed:

1. **Create** — all `CREATE`
2. **Update** — all `UPDATE`
3. **Change status** — all `CHANGE_STATUS`
4. **Delete** — all `DELETE`

Within each group, sort by `entityType` (`task` → `note` → `event`), then by a human label (title/content from snapshot or payload). Empty groups are hidden.

Helper: `groupActionsForPreview(actions)` in `src/lib/brain-dump-agent.ts` returns `{ create, update, changeStatus, delete }` arrays for `ActionPreview`.

## Constraints

### Must
- Require auth for suggest and apply (same as `processBrainDump`).
- Scope all reads/writes to `user_id` from session.
- Use Vercel AI SDK `generateText` + `Output.object` with `AgentPlanSchema = z.object({ actions: z.array(AgentActionSchema) })` (discriminated union on `action`).
- Enforce entity rules:
  - **CHANGE_STATUS** — `entityType: "task"` only; `status` must be `TaskStatusSchema`; transitions must pass `transitionTask` / `canTransitionTask` from `src/lib/state-machine.ts`.
  - **Notes** — no `status` on any action; **DELETE** uses soft-delete (`deleted_at`).
  - **Tasks and Events** — **DELETE** must also use soft-delete (`deleted_at`), never hard delete.
  - **CREATE task** — `title` required; `status` optional, default `TODO`.
  - **CREATE event** — `title` + `dateISO`; year defaulting rules match current brain-dump prompt.
  - **UPDATE** — at least one mutable field besides `id`; IDs must belong to the user; no `status` on `note` or `event`.
  - **DELETE** — `id` must exist and belong to the user; notes must have `deleted_at: null`.
- Pass a **compact snapshot** of user data into the LLM system prompt (`id`, title/content, task status, event `dateISO`) so mutations reference real rows.
- Map natural language **“cancel”** for an existing **task** → `CHANGE_STATUS` with `status: "CANCELLED"`; for an **event** → `DELETE` (events have no status).
- Reuse patterns from `updateTaskStatus.ts` and `deleteNote.ts` inside apply logic (or call shared helpers).
- Tailwind-only styling in components; Lucide icons; no global CSS edits.
- After successful apply: `revalidatePath("/app")` and `router.refresh()` from the chat component.

### Must Not
- Do not persist anything on the suggest step.
- Do not add npm dependencies.
- Do not allow `CHANGE_STATUS` when `entityType` is `note` or `event`.
- Do not allow `status` on note/event `CREATE` or `UPDATE`.
- Do not bypass the state machine for task status changes.
- Do not apply actions that failed validation (return errors to the UI).
- Do not use prefixed fake ids (e.g. `task_456`) — always real UUIDs from the user snapshot.
- Do not hard delete any record (task, note, or event).

### Out of Scope
- Undo/revert applied plans.
- Editing or deleting the chat history server-side (client-held thread is enough for MVP).
- Streaming LLM tokens in the UI.
- Bulk approve across multiple pending previews (each message approves independently).
- New API routes (`/api/...`) — server actions only.
- Changing Prisma models beyond adding/using `deleted_at` for soft delete.

## Current State

- **Brain dump (create-only):** `src/app/actions/processBrainDump.ts` — OpenAI structured output → immediate `createMany` for tasks/notes/events.
- **UI:** `src/app/app/_components/BrainDumpForm.tsx` — single textarea, voice input, submit → `processBrainDump` → clear input + refresh. Rendered in aside on `src/app/app/page.tsx`.
- **Contracts:** `src/contracts.ts` — `TaskSchema`, `NoteSchema`, `EventSchema`, `TaskStatusSchema`.
- **Existing mutations:**
  - `src/app/actions/updateTaskStatus.ts` — single task status with state machine.
  - `src/app/actions/deleteNote.ts` — note soft-delete.
- **No** server actions yet for task/event update, task/event soft delete.
- **Prisma:** `Task` (status enum), `Note` (`deleted_at`), `Event` (title, `dateISO`); all scoped by `user_id`. Currently only `Note` has `deleted_at`.
- **State machine:** `TODO` ↔ `IN_PROGRESS` / `DONE` / `CANCELLED` per `src/lib/state-machine.ts`.

**Relevant files:**
- `src/app/actions/processBrainDump.ts`
- `src/app/app/_components/BrainDumpForm.tsx`
- `src/app/app/page.tsx`
- `src/contracts.ts`
- `src/lib/state-machine.ts`
- `src/lib/ai-provider.ts`

## Tasks

### T1: Agent action schema, grouping, and validation
**What:** Add `src/lib/brain-dump-agent.ts` with:
- `AgentActionSchema` — Zod `discriminatedUnion("action", [...])` for `CREATE` | `UPDATE` | `DELETE` | `CHANGE_STATUS`.
- `AgentPlanSchema` — `z.object({ actions: z.array(AgentActionSchema) })`.
- `buildUserContextSnapshot(tasks, notes, events)` for the LLM.
- `validateAgentActions(actions, userItems)` → `{ validActions, rejected }`:
  - Unknown UUIDs, empty UPDATE payloads, illegal task transitions
  - `CHANGE_STATUS` when `entityType !== "task"`
  - `status` on note/event actions
- `groupActionsForPreview(validActions)` → `{ create, update, changeStatus, delete }` for UI (fixed group order; hide empty groups).
**Files:** `src/lib/brain-dump-agent.ts`, optional `src/lib/brain-dump-agent.test.ts`
**Verify:** `pnpm test` — invalid event/note status actions land in `rejected`; grouping preserves all items.

### T2: Suggest server action
**What:** Add `suggestBrainDumpActions(text: string)` in `src/app/actions/suggestBrainDumpActions.ts`:
- Auth + trim input (mirror `processBrainDump` guards).
- Load user’s tasks, non-deleted notes, events (same queries as `page.tsx`).
- Call `generateText` with `Output.object({ schema: AgentPlanSchema })`; system prompt describes flat `actions` array, entity rules, snapshot JSON, cancel semantics.
- Run `validateAgentActions`; return `{ success, actions: validActions, rejected?, error? }` — no DB writes.
**Files:** `src/app/actions/suggestBrainDumpActions.ts`
**Verify:** Manual/script: dump referencing an existing task returns flat items with correct `action` + `id`.

### T3: Apply server action
**What:** Add `applyBrainDumpActions(actions: AgentAction[])` in `src/app/actions/applyBrainDumpActions.ts`:
- Auth; reload user items; re-run `validateAgentActions`.
- Partition validated actions by `action` type; execute in `prisma.$transaction` in order: **DELETE** → **UPDATE** → **CHANGE_STATUS** → **CREATE**.
  - Notes DELETE → set `deleted_at` (same as `deleteNote`).
  - Tasks/events DELETE → set `deleted_at` with ownership check (soft delete only).
  - UPDATE / CHANGE_STATUS / CREATE per entity rules above.
- `revalidatePath("/app")`; return `{ success, error?, appliedCounts? }`.
**Files:** `src/app/actions/applyBrainDumpActions.ts`
**Verify:** Manual: accept a mixed plan; board updates; invalid plan leaves DB unchanged.

### T4: Deprecate auto-save in processBrainDump
**What:** Remove direct Prisma writes from `processBrainDump.ts` or replace with a thin wrapper to `suggestBrainDumpActions` only. Migrate `BrainDumpChat` and `scripts/test-braindump.ts` to the new suggest/apply flow.
**Files:** `src/app/actions/processBrainDump.ts`, `scripts/test-braindump.ts`
**Verify:** No code path writes to DB on submit without apply.

### T5: Chat UI — BrainDumpChat
**What:** Replace `BrainDumpForm` with `BrainDumpChat`:
- Aside: scrollable message list + fixed bottom input (preserve voice input from current form).
- Submit → `suggestBrainDumpActions` → append user message + assistant preview.
- `ActionPreview`: call `groupActionsForPreview(actions)`; render **four sections** (Create / Update / Change status / Delete) with line items per action (entity badge + human label); show `rejected` below preview if any.
- **Accept** → `applyBrainDumpActions(storedValidActions)`; on success hide/disable Accept, brief success copy, `router.refresh()`.
**Files:** `src/app/app/_components/BrainDumpChat.tsx`, `src/app/app/_components/ActionPreview.tsx`, `src/app/app/page.tsx`
**Verify:** Manual: grouped sections visible; accept applies all; accept control gone after success.

### T6: LLM prompt and examples
**What:** Centralize prompts in `src/lib/brain-dump-agent-prompt.ts` (or co-locate with T1):
- Output `{ "actions": [ ... ] }` only — flat list, no nested buckets.
- Examples for each `action` + `entityType` combination.
- Explicit: never `CHANGE_STATUS` on note/event; cancel event = `DELETE`; cancel task = `CHANGE_STATUS` + `CANCELLED`.
- Mutations must use `id` values from the provided snapshot.
**Files:** `src/lib/brain-dump-agent-prompt.ts`
**Verify:** Manual dumps produce valid flat arrays; invalid suggestions appear in `rejected` only.

## Validation

- `pnpm lint`
- `pnpm test` (validation + grouping helpers)
- `pnpm build`
- `pnpm prisma migrate dev` (to add `deleted_at` to `Task` and `Event`, if not present yet)
- Manual on `/app` (signed in):
  - [ ] Submit brain dump → assistant preview shows **grouped** sections (Create / Update / Change status / Delete); no DB change until Accept.
  - [ ] Accept → board updates; Accept button disabled or removed for that message.
  - [ ] `CHANGE_STATUS` on note/event never appears in applyable list (only in rejected if model emits it).
  - [ ] Task status changes respect state machine.
  - [ ] Note/task/event delete soft-deletes and each item disappears from board queries.
  - [ ] Voice input still works.
  - [ ] Light/dark styles acceptable.

## Approval

**Do not implement until this spec is explicitly approved.**
