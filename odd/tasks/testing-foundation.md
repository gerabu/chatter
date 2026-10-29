# Testing Foundation

## Approved plan

| ID | Scope | Acceptance criteria | Depends on | Status |
|---|---|---|---|---|
| **T1** | Establish Vitest and React Testing Library infrastructure. | Vitest supports Node logic tests and jsdom component tests; a minimal RTL test passes; required dependencies are declared. | — | Complete |
| **T2** | Characterize existing business logic. | Add passing tests for documented/current pure business-logic behavior without changing production behavior; all tests pass. | T1 | Complete |
| **T3** | Test suggestion → review → approval → application pipeline. | Cover success and failure boundaries, auth/validation, and application effects using isolated action tests. | T1, T2 | Not started |
| **T4** | Add behavioral component tests. | RTL tests verify meaningful user interactions and visible outcomes using accessible queries, not snapshots as the primary assertion. | T1, T3 | Not started |
| **T5** | Add Playwright E2E tests. | Critical user flow runs end-to-end and verifies persisted/resulting state. | T3, T4 | Not started |

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

## Deferred scope

T3–T5 are approved in the overall plan but have not been started as part of this execution.
