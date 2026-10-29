---
name: odd
description: | 
  Adapted Organic Driven Development workflow for the Chatter repository.
  The skill enforces human‑at‑the‑loop approval, strict TDD, pair‑programming, ADR recording, and a project‑local task document system.
---

# Odd Workflow Overview

This skill implements a lightweight, project‑specific variant of the OpenAI‑Gently‑AI
Organic Driven Development (ODD) process, tailored to the Chatter codebase. The
focus is on rapid delivery, clear human governance, and minimal tooling
overhead.

## Core Principles

1. **Human approval at phase boundaries.** Only approved specifications, test suites, or architectural decisions are merged.
2. **Strict Test‑First (TDD):** RED → GREEN → REFACTOR is mandatory for each new feature.
3. **Pair‑programming style interaction.** The agent explains its changes and asks the human for feedback.
4. **ADR (Architectural Decision Record) per significant decision.** Records are placed under `docs/adr/`.
5. **Project‑local task documents.** Substantial work creates `odd/tasks/<feature-name>.md` with Specs, Tasks, and a Log.
6. **No destructive Git actions.** All commits, pushes, and merges must be performed manually by the human.

## Workflow Steps

1. **Investigation** – Agent lists relevant files (read‑only) via `opencode` queries.
2. **Planning** – Human defines a high‑level goal.
3. **Specification** – Agent produces a spec (or extends an existing one) stored in `odd/tasks/<name>.md`.
4. **Test Design** – Human writes a characterization test; the agent proposes a failing test case.
5. **Implementation** – Agent drafts code; the human reviews and approves.
6. **Verification** – Run `pnpm test`, lint, type‑check, and UI snapshot checks.
7. **ADR** – For any non‑trivial decision, create `docs/adr/2026-10-28-<name>.md`.
8. **Commit** – Human writes the commit with a Conventional‑Commit message.
9. **Merge** – Human merges the PR after final checks.

## Testing Convention: Arrange‑Act‑Assert (AAA)

Every automated test must follow Arrange‑Act‑Assert (AAA):

1. **Arrange** – Prepare the initial state, fixtures, dependencies, and mocks needed by the test.
2. **Act** – Perform the behavior being tested, preferably through one principal action.
3. **Assert** – Check observable behavior, outputs, state changes, or side effects.

Tests should describe one meaningful behavior, while allowing multiple related assertions that establish that behavior. Prefer behavioral assertions over implementation details, and avoid excessive snapshots. Use `// Arrange`, `// Act`, and `// Assert` comments to make non-trivial tests clear; comments are optional for short, obvious tests. Avoid assertions that only verify mocked behavior or trivial JavaScript operations.

Apply AAA within strict RED‑GREEN‑REFACTOR cycles for new behavior. When refactoring existing behavior, write passing AAA characterization tests before changing production code. During code review, check AAA clarity, meaningful assertions, determinism, and test isolation.

For E2E tests, follow equivalent AAA semantics: arrange through setup, act through user actions, and assert observable outcomes.

---
