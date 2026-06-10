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

## Known Bugs (post-implementation)

### B1: Strict schema at the LLM boundary crashes suggest — **FIXED** (T7–T9)

The strict `AgentPlanSchema` (with `.min(1)`, `z.iso.datetime()`, `.strict()`) is passed directly to `Output.object` in `suggestBrainDumpActions`. When the LLM fills optional fields with empty strings instead of omitting them — e.g.:

```json
{"actions":[{"action":"UPDATE","entityType":"task","id":"<uuid>","title":"…","content":"","dateISO":"","status":"DONE"}]}
```

…the AI SDK throws (`TypeValidationError` / `NoObjectGeneratedError`) **before** `validateAgentActions` runs. The `rejected[]` mechanism never sees the plan, and the raw Zod issue dump is rendered in the UI. One malformed field kills the entire plan (all-or-nothing instead of per-item rejection).

Secondary symptom from the same trace: for "ya compré los zapatos…" the model chose `UPDATE` + `status: "DONE"` with junk empty fields instead of `CHANGE_STATUS` — the prompt never tells it to omit unused fields or to prefer `CHANGE_STATUS` for completion intents.

**Fix strategy (tasks T7–T9):** validate leniently at the LLM boundary, normalize, then run the existing strict per-item validation server-side; route per-item failures into `rejected[]`; show only friendly errors in the UI.

## Constraints

### Must
- Require auth for suggest and apply (same as `processBrainDump`).
- Scope all reads/writes to `user_id` from session.
- Use Vercel AI SDK `generateText` + `Output.object` with a **lenient** `AgentPlanLLMSchema` (see T7); the strict `AgentActionSchema` (discriminated union on `action`) is applied **per item, server-side, after normalization** — never as the LLM parse contract.
- **LLM boundary resilience:**
  - Normalize raw LLM actions before strict validation: trim strings; treat empty/whitespace-only optional fields (`title`, `content`, `dateISO`, `status`) as omitted; accept date-only `YYYY-MM-DD` for `dateISO` by coercing to `T00:00:00Z`.
  - Canonicalize a task `UPDATE` whose only effective mutable field is `status` into `CHANGE_STATUS`.
  - Strict-parse each normalized action individually (`safeParse`); failures land in `rejected[]` with a readable reason — a single bad item must never discard the whole plan or surface an exception.
  - Suggest must not propagate raw Zod/SDK error payloads to the client; log details server-side, return a short human-readable `error`.
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

> **Status:** T1–T6 are implemented and shipped. The list below describes the implemented state; tasks T7–T9 fix bug B1.

- **Agent core:** `src/lib/brain-dump-agent.ts` — strict `AgentActionSchema` / `AgentPlanSchema`, `buildUserContextSnapshot`, `validateAgentActions` (→ `{ validActions, rejected }`), `groupActionsForPreview`, `getActionLabel`.
- **Prompt:** `src/lib/brain-dump-agent-prompt.ts` — `buildBrainDumpAgentPrompt({ text, currentDateISO, snapshotJson })`. Does **not** instruct the model to omit unused fields, has no few-shot examples, and does not map completion intents ("done", "bought", "finished") to `CHANGE_STATUS`.
- **Suggest:** `src/app/actions/suggestBrainDumpActions.ts` — passes strict `AgentPlanSchema` to `Output.object` (cause of B1); catches SDK errors and returns the raw message as `error`.
- **Apply:** `src/app/actions/applyBrainDumpActions.ts` — re-validates, transactional apply, `revalidatePath("/app")`.
- **UI:** `src/app/app/_components/BrainDumpChat.tsx` + `ActionPreview.tsx` — chat thread, voice input, accept-per-message; renders `result.error` verbatim in the error banner (surfaces raw Zod dumps).
- **Contracts:** `src/contracts.ts` — `TaskSchema`, `NoteSchema`, `EventSchema`, `TaskStatusSchema`.
- **State machine:** `TODO` ↔ `IN_PROGRESS` / `DONE` / `CANCELLED` per `src/lib/state-machine.ts`.
- **Prisma:** `Task`, `Note`, `Event` all have `deleted_at`; all scoped by `user_id`.

**Relevant files:**
- `src/lib/brain-dump-agent.ts`
- `src/lib/brain-dump-agent-prompt.ts`
- `src/app/actions/suggestBrainDumpActions.ts`
- `src/app/actions/applyBrainDumpActions.ts`
- `src/app/app/_components/BrainDumpChat.tsx`
- `src/app/app/_components/ActionPreview.tsx`
- `src/contracts.ts`
- `src/lib/state-machine.ts`
- `src/lib/ai-provider.ts`

## Tasks

> T1–T9 are **done**. T7–T9 fixed bug B1. T7 additionally canonicalizes inside `validateAgentActions`: a task `UPDATE` carrying `status` whose `title` is absent or echoes the snapshot title unchanged becomes `CHANGE_STATUS`.

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

### T7: Lenient LLM boundary schema + normalization (fixes B1)
**What:** In `src/lib/brain-dump-agent.ts`:
- Add `AgentPlanLLMSchema` — a permissive shape for `Output.object`: `{ actions: z.array(z.looseObject({ action/entityType/id/title/content/dateISO/status: z.string().optional() })) }`. No `.min(1)`, no datetime format, no `.strict()` — its only job is "an array of action-like objects".
- Add `normalizeAgentActions(raw)`:
  - Trim all string fields; drop optional fields that are empty/whitespace-only (`""` ⇒ omitted).
  - Coerce date-only `dateISO` (`YYYY-MM-DD`) to `YYYY-MM-DDT00:00:00Z`; pass through full ISO unchanged.
  - Rewrite a task `UPDATE` whose only remaining mutable field is `status` into `CHANGE_STATUS` (canonical form; keeps the state-machine path uniform). With this rule, the B1 example normalizes to `{ "action": "CHANGE_STATUS", "entityType": "task", "id": "<uuid>", "status": "DONE" }` and parses cleanly.
- Add `parseAgentActions(raw)` → `{ parsed: AgentAction[], rejected: RejectedAction[] }`: run `AgentActionSchema.safeParse` on each normalized item; failures go to `rejected[]` with a short readable reason (e.g. `"Invalid action shape: dateISO must be ISO-8601"`), never thrown.
- In `suggestBrainDumpActions.ts`: use `AgentPlanLLMSchema` in `Output.object`, then `normalize → parse → validateAgentActions`; merge parse-rejected with semantic-rejected in the returned `rejected[]`.
**Files:** `src/lib/brain-dump-agent.ts`, `src/app/actions/suggestBrainDumpActions.ts`, `src/lib/brain-dump-agent.test.ts`
**Verify:** Unit test feeding the exact B1 payload returns one valid `CHANGE_STATUS` action and no throw; items with truly unusable shapes land in `rejected`.

### T8: Prompt hardening against malformed output
**What:** In `src/lib/brain-dump-agent-prompt.ts`:
- Add rules: "Omit any field you are not setting. Never output empty strings, null, or placeholder values."; "`dateISO` must be full ISO-8601 like `2026-06-10T19:00:00Z` — never an empty string."
- Map completion intents: "If the user says they did/finished/bought/completed something matching an existing task → `CHANGE_STATUS` with `status: \"DONE\"`" (mirror of the existing cancel rule).
- Add 2–3 few-shot examples including a status-change case, e.g. dump "ya compré los zapatos" + snapshot task "Comprar zapatos…" → `{"actions":[{"action":"CHANGE_STATUS","entityType":"task","id":"<uuid>","status":"DONE"}]}`.
**Files:** `src/lib/brain-dump-agent-prompt.ts`
**Verify:** Manual: the B1 user prompt produces a `CHANGE_STATUS` suggestion with no empty fields.

### T9: Friendly error surface
**What:**
- `suggestBrainDumpActions.ts`: in the catch block, `console.error` the full error but return a short fixed message (e.g. "I couldn't turn that into a valid plan. Try rephrasing."); never include Zod issue JSON in `error`. Optionally one automatic retry of `generateText` on parse failure before giving up (no new deps).
- `BrainDumpChat.tsx`: no structural change needed once `error` is short; keep the existing banner.
- `ActionPreview.tsx`: ensure `rejected[]` reasons render as the readable strings from T7.
**Files:** `src/app/actions/suggestBrainDumpActions.ts`, `src/app/app/_components/BrainDumpChat.tsx`, `src/app/app/_components/ActionPreview.tsx`
**Verify:** Manual: force a malformed model output (or mock) → UI shows the friendly message or a preview with `rejected` items; raw Zod JSON appears only in server logs.

## Validation

- `pnpm lint`
- `pnpm test` (validation + grouping helpers)
- `pnpm build`
- `pnpm prisma migrate dev` (to add `deleted_at` to `Task` and `Event`, if not present yet)
- Manual on `/app` (signed in):
  - [ ] "ya compré los zapatos de Gerald Alberto" (with matching task on board) → preview shows one **Change status → DONE** item; no error banner.
  - [ ] LLM output with empty-string fields never throws — bad items appear under `rejected`, valid ones remain applyable.
  - [ ] Error banner never shows raw Zod/JSON payloads.
  - [ ] Submit brain dump → assistant preview shows **grouped** sections (Create / Update / Change status / Delete); no DB change until Accept.
  - [ ] Accept → board updates; Accept button disabled or removed for that message.
  - [ ] `CHANGE_STATUS` on note/event never appears in applyable list (only in rejected if model emits it).
  - [ ] Task status changes respect state machine.
  - [ ] Note/task/event delete soft-deletes and each item disappears from board queries.
  - [ ] Voice input still works.
  - [ ] Light/dark styles acceptable.

## Approval

**Do not implement until this spec is explicitly approved.**
