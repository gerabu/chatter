# Migrate LLM Provider from Ollama to OpenAI

## Why

The application currently connects to a local Ollama instance for processing brain dumps. For production deployment on Vercel, we need to switch to OpenAI's gpt-4o-mini model to ensure reliable cloud-based inference without requiring local infrastructure.

## What

Replace the Ollama LLM provider with OpenAI (gpt-4o-mini) using the Vercel AI SDK in the processBrainDump Server Action. The implementation must use structured output via the generateText function's output option, passing the Zod schema from contracts.ts to enforce type-safe responses.

## Constraints

### Must
- Use official Vercel AI SDK (`ai` package) and `@ai-sdk/openai` provider
- Use gpt-4o-mini model explicitly
- Use generateText with output option passing Zod schema (existing pattern)
- Maintain type inference from contracts.ts Zod schemas
- Add OPENAI_API_KEY to both .env and .env.example
- Isolate changes to processBrainDump Server Action only

### Must Not
- Install ollama-ai-provider-v2 (remove existing dependency)
- Modify UI components or database logic
- Change the BrainDumpExtractionSchema or contracts.ts

### Out of Scope
- UI changes for brain dump input
- Alternative LLM providers
- Modifying other Server Actions

## Current State

- Relevant files: `src/lib/ai-provider.ts`, `src/app/actions/processBrainDump.ts`, `src/contracts.ts`
- Uses ollama-ai-provider-v2 with local Ollama at http://localhost:11434
- Already uses generateText with Output.object() pattern
- BrainDumpExtractionSchema defined in processBrainDump.ts
- TaskSchema, NoteSchema, EventSchema exported from contracts.ts
- No OpenAI SDK currently installed

## Tasks

### T1: Install OpenAI SDK packages
**What:** Install the Vercel AI SDK and OpenAI provider package. Remove unused Ollama provider.
**Files:** `package.json`, `pnpm-lock.yaml`
**Verify:** `pnpm install` completes successfully and packages appear in package.json

### T2: Create OpenAI provider configuration
**What:** Replace the ai-provider.ts file to export OpenAI provider using createOpenAI with gpt-4o-mini model.
**Files:** `src/lib/ai-provider.ts`
**Verify:** File exports openai provider instance that can be used with generateText

### T3: Update processBrainDump Server Action
**What:** Update the Server Action to import openai instead of ollama, use gpt-4o-mini model, and maintain the existing generateText pattern with output schema.
**Files:** `src/app/actions/processBrainDump.ts`
**Verify:** TypeScript compiles without errors, output option correctly passes Zod schema

### T4: Add environment variables
**What:** Add OPENAI_API_KEY to .env and .env.example files.
**Files:** `.env`, `.env.example`
**Verify:** Variables present in both files (placeholder value in example)

### T5: Create OpenAI configuration documentation
**What:** Generate a markdown file under src/docs with step-by-step instructions to configure OpenAI and obtain the API key.
**Files:** `src/docs/openai-setup.md`
**Verify:** File exists at src/docs/openai-setup.md with clear setup instructions

## Validation

After all tasks complete:
- Run `pnpm tsc` to verify TypeScript compilation
- Verify OPENAI_API_KEY is set in environment (check .env was created)
- Test the brain dump flow with a sample input if API key available

## Done

- [x] T1: Install ai and @ai-sdk/openai packages, remove ollama-ai-provider-v2
- [x] T2: Replace ai-provider.ts with OpenAI provider
- [x] T3: Update processBrainDump.ts to use openai with gpt-4o-mini
- [x] T4: Add OPENAI_API_KEY to .env and .env.example
- [x] T5: Create src/docs/openai-setup.md with setup instructions
- [x] TypeScript compilation passes