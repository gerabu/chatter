<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:odd-workflow -->
# Organic Driven Development (ODD) for Chatter

The Chatter repository uses a **project‑specific ODD** workflow.  An agent skill
(`.agents/skills/odd/SKILL.md`) implements the core steps: human‑at‑the‑loop approval, strict TDD, ADR recording, and project‑local task documents.  Before any development task, the agent must load this skill.  It also ensures that all changes are verified by a human at phase boundaries and that no automated Git commits, pushes, or destructive operations occur.

## How to use

* When the user asks for a new feature or change, the agent automatically loads `odd`.
* The skill drives the workflow described in `SKILL.md`: investigation, specification, test design, implementation, verification, commit, and merge.
* All important architectural or product decisions are recorded in `docs/adr/`.

> **Note:**  The workflow is an adaptation of the Gentle‑AI ODD protocol and is not the full official implementation.

<!-- END:odd-workflow -->
