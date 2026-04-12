# LLM Brain Dump Processor

## Why

We want users to be able to brain dump a string of raw text and have the LLM automatically interpret, categorize, and validate it as explicit Tasks, Notes, and Events. Hooking this directly up to our SQLite database closes the loop on ingesting unstructured data safely.

## What

- A Next.js Server Action (`processBrainDump`) which accepts a raw text string from the user.
- An LLM integration (using Ollama locally for now) passing the raw string and enforcing output into our Zod Contracts (Structured Outputs).
- Direct persistence of those objects into the SQLite database via Prisma once validated.
- Elegant fallback error handling if LLM responses hallucinate or fail Zod schema requirements.
- A temporary test CLI script capable of invoking and validating the Server Action outside of a UI environment.

## Context

**Relevant files:**
- `src/contracts.ts` — Contains Zod schemas enforced on the LLM output.
- `prisma/schema.prisma` — Determines the database ingestion types.
- `src/app/actions/processBrainDump.ts` (New) — Houses the new Next.js Server Action logic.
- `scripts/test-braindump.ts` (New) — A headless invocation script for testing.

**Key decisions already made:**
- Next.js App Router context (Server Actions).
- Provider: Local Ollama (configurable to swap to OpenAI later).
- AI SDK or native structured outputs used to bridge the LLM with `zod`.

## Constraints

**Must:**
- Integrate the explicitly generated Zod schemas (`TaskSchema`, `NoteSchema`, `EventSchema`) from the foundation phase into the LLM structured output.
- Save confirmed valid structures into Prisma properly.
- Include `try/catch` wrappers specifically identifying Zod validation or JSON parsing errors.

**Must not:**
- Build any frontend React UI or web pages.
- Modify existing contracts or Prisma models.

## Tasks

### T1: Setup the AI Adapter & Types

**Do:** Install necessary AI provider SDKs (e.g., `ai`, `@ai-sdk/openai`, or `ollama-ai-provider-v2`). Set up a utility function or configuration file that establishes the local Ollama connection.

**Files:** `package.json`, `src/lib/ai-provider.ts`

**Verify:** Import the AI provider without runtime errors.

### T2: Build the Server Action (`processBrainDump`)

**Do:** Create the server action. Configure the prompt and use the AI SDK structured output handlers (e.g., `generateObject`) to ask the LLM to extract lists of `tasks`, `notes`, and `events` mapped to the shared Zod Schemas. Implement error catching for hallucinations.

**Files:** `src/app/actions/processBrainDump.ts`

**Verify:** Manual: Assure that the `catch` blocks accurately intercept failing Zod parsing.

### T3: Integrate Prisma Persistence

**Do:** Update `processBrainDump` so that upon successful LLM translation/parsing, it initializes the `prisma` client, loops through the categorized datasets, and executes inserts (`prisma.task.createMany`, etc.) mapping properties flawlessly.

**Files:** `src/app/actions/processBrainDump.ts`

**Verify:** Manual: Check the source to guarantee `prisma.XYZ.create` aligns with the Zod schema array maps.

### T4: Headless Invocation Script

**Do:** Create a simple script (capable of using `tsx` or standard `ts-node`) that imports the server action, supplies a hardcoded sample string ("I need to walk the dog, cancel my doctor appointment, and remember that Bob's number is 555-1234"), and resolves it.

**Files:** `scripts/test-braindump.ts`

**Verify:** Running `npx tsx scripts/test-braindump.ts` hits the LLM and ultimately logs the database insertion result smoothly to console.

## Done

- [ ] LLM provider properly answers using structured formats.
- [ ] Next.js Server Action securely validates inputs through `src/contracts.ts`.
- [ ] Records reflect successfully in SQLite.
- [ ] No frontend artifacts were unintentionally implemented.
