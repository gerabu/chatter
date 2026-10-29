# Testing Foundation

## Approved plan

| ID | Scope | Acceptance criteria | Depends on | Status |
|---|---|---|---|---|
| **T1** | Establish Vitest and React Testing Library infrastructure. | Vitest supports Node logic tests and jsdom component tests; a minimal RTL test passes; required dependencies are declared. | — | Complete |
| **T2** | Characterize existing business logic. | Add passing tests for documented/current pure business-logic behavior without changing production behavior; all tests pass. | T1 | Complete |
| **T3** | Test suggestion → review → approval → application pipeline. | Cover success and failure boundaries, auth/validation, and application effects using isolated action tests. | T1, T2 | Complete |
| **T4** | Add behavioral component tests. | RTL tests verify meaningful user interactions and visible outcomes using accessible queries, not snapshots as the primary assertion. | T1, T3 | Complete |
| **T5** | Add Playwright E2E tests. | Critical user flow runs end-to-end and verifies persisted/resulting state. | T3, T4 | Complete |

## Progress log

### T1 — Complete
- Baseline before T1: `pnpm test` — 2 files passed, 22 tests passed.
- Added Vitest React/jsdom dependencies and `vitest.config.mts`.
- Added a minimal component test; observed it fail before making the component satisfy the assertion.
- T1 verification recorded previously: 3 files passed, 23 tests passed.

### T2 — Complete
- Characterization additions in `src/lib/brain-dump-agent.test.ts` cover task-create default status, duplicate operation rejection, and user-context projection excluding soft-deleted records.
- No production behavior was changed.
- Corrected Vitest environment scoping: Node is the default; the RTL test opts into jsdom.
- Removed unsupported `globalsImport` config discovered by type-checking; tests use explicit Vitest imports.
- Verification: `pnpm test` — 3 files passed, 26 tests passed; `pnpm exec tsc --noEmit` — passed; `pnpm lint` — 0 errors, 1 existing warning in `src/app/app/_components/BrainDumpChat.tsx:170` (`label` unused).

### T3 — Complete
- Added `src/app/actions/brain-dump-actions.test.ts` with six isolated action integration cases: suggestion → reviewed payload → application success/effects, signed-out suggestion and apply, empty input, malformed payload, and stale/invalid action rejection.
- The integration case models the existing UI approval boundary by stripping the presentation-only `label` before calling the strict application action. An initial red assertion exposed that passing the display-enriched response directly is not the real UI contract; no production change was needed.
- No application behavior or external services were changed; Prisma, auth, model generation, and cache revalidation are mocked.
- Verification: `pnpm test` — 4 files passed, 32 tests passed; `pnpm exec tsc --noEmit` — passed; `pnpm lint` — 0 errors, 1 existing warning in `src/app/app/_components/BrainDumpChat.tsx:170`; `git diff --check` — passed.

### T4 — Complete
- Added `src/app/app/_components/BrainDumpChat.test.tsx` with behavioral interaction tests for reviewing and applying suggestions, visible applied state, label cleanup at submission, refresh after success, and retry after an application error.
- Assertions use accessible roles and visible text; no snapshots or application behavior changes.
- Verification: `pnpm test` — 5 files passed, 34 tests passed; `pnpm exec tsc --noEmit` — passed; `pnpm lint` — 0 errors, 1 existing warning in `src/app/app/_components/BrainDumpChat.tsx:170`; `git diff --check` — passed.

### T5 — Complete
- Added Playwright config/script and one E2E test for suggestion → visible review → approval → persisted task visible in task board, with DB assertion.
- Added local OpenAI-compatible mock server; E2E flow makes no external model/API calls.
- Test creates a unique user in explicitly selected `E2E_DATABASE_URL`, signs a local NextAuth session, then deletes only that user's rows. Config rejects DB names without `e2e`; no shared-data wipe/reset.
- Vitest is scoped to `src/` so it does not collect Playwright specs.
- Initial validation identified missing Chromium and a protocol mismatch (`/chat/completions` vs AI SDK's `/responses`); installed Chromium and corrected mock.
- Verified: `pnpm test:e2e` — 1 passed, 0 skipped; uses configured dedicated E2E database and local OpenAI mock.
- Run prerequisites: set `E2E_DATABASE_URL` to a dedicated database whose name contains `e2e`, apply migrations with `POSTGRES_URL_NON_POOLING="$E2E_DATABASE_URL" pnpm db:deploy`, and install Chromium with `pnpm exec playwright install chromium`.

## Deferred scope

All approved testing-foundation tasks T1–T5 are complete.
