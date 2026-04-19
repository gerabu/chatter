# Brain dump: voice input (Web Speech API)

## Why

Typing a long brain dump adds friction. Letting users dictate into the same textarea—seeing text update as they speak—matches mental flow and keeps the existing `processBrainDump` pipeline unchanged.

## What

Update the dashboard `BrainDumpForm` so users can optionally dictate with the browser’s [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) API: speech is transcribed into the controlled textarea in real time (including interim results where supported). The form’s bottom-right area (inside the form, anchored to the textarea) shows **exactly one** control at a time: toggle between **Mic** (start dictation), **Stop** (while `isRecording`), and **Submit** (Send icon when trimmed text is non-empty and not recording). **Submit** shows a **spinner** (loading icon) instead of Send while `isPending` (brain dump processing). While recording, the **Stop** button uses the **`animate-pulse`** utility from [tailwind-animations](https://tailwind-animations.com/) (project already imports `tailwind-animations` in `globals.css`) so the control visibly pulses for the duration of dictation. Layout uses only Tailwind utilities in the component; no new global CSS; no `useEffect`.

## Constraints

### Must
- Use the native Web Speech API only (`SpeechRecognition` / `webkitSpeechRecognition`); no new npm dependencies.
- Keep `src/app/actions/processBrainDump.ts` unchanged.
- Do not change app layout files (e.g. root `layout.tsx`); only the form component (and types if needed locally).
- Style with Tailwind classes; no edits to global stylesheets.
- Avoid unnecessary abstractions (inline recognition setup and handlers in the form component is acceptable).
- Real-time feedback: `interimResults` (and `continuous` as needed) so the textarea updates while speaking.
- While `isRecording`, the Stop button includes **`animate-pulse`** from the [tailwind-animations](https://tailwind-animations.com/) preset (opacity pulse, infinite), already available via `@import "tailwind-animations"` in `src/app/globals.css`.
- Handle unsupported browsers gracefully (e.g. hide mic or show a short inline message).

### Must Not
- Add third-party speech libraries.
- Use `useEffect` for recognition lifecycle (start/stop from explicit user actions / callbacks; use `useRef` to hold the recognition instance if needed).

### Out of Scope
- Offline / local-only recognition guarantees (`processLocally` is experimental and not required).
- Changing server action contracts, validation messages in the action, or LLM behavior.
- Mobile native speech APIs outside the browser.

## Current State

- **Form:** `src/app/app/_components/BrainDumpForm.tsx` — client component; controlled textarea; Web Speech API dictation; **one** bottom-right icon button (Mic ↔ Stop + `animate-pulse` while recording ↔ Send/loader); `useTransition` + `processBrainDump(text)` on submit.
- **Types:** `src/types/speech-recognition.d.ts` — minimal `SpeechRecognition` / `SpeechRecognitionEvent` globals for TypeScript.
- **Action:** `src/app/actions/processBrainDump.ts` — unchanged; expects a string (trimmed client-side before call).
- **Icons:** `lucide-react` already in the project (e.g. `Mic`, `Send`; use `Square` or `MicOff` for stop if desired).

**Patterns to follow:** Keep existing error handling and `router.refresh()` on success; preserve `name="brainDump"` and accessibility (`htmlFor` / `id`).

## Tasks

### T1: Speech recognition wiring (no `useEffect`)
**What:** In `BrainDumpForm`, obtain a `SpeechRecognition` constructor (`window.SpeechRecognition || window.webkitSpeechRecognition`). Store the instance in a `useRef` so start/stop handlers reuse it. On mic click: configure `lang` (e.g. `en-US` or `navigator.language`), set `interimResults: true`, optionally `continuous: true`, assign `onresult` to merge final + interim transcripts into `setValue` (standard pattern: rebuild full string from `event.results`). On stop: `recognition.stop()` or `abort()` and clear `isRecording`. Attach `onerror` / `onend` to reset `isRecording` when the service stops or errors. All of this is triggered from click handlers or recognition callbacks—not `useEffect`.

**Files:** `src/app/app/_components/BrainDumpForm.tsx`  
**Verify:** Manual: Chrome (or another supporting browser)—click mic, speak, see textarea update live; stop; submit still works.

### T2: Bottom-right single control + `isRecording` / write-vs-speak toggle
**What:** Wrap the textarea in a `relative` container. Place **one** `absolute bottom-… right-…` icon button (same footprint for every state—no second button beside it).

| State | Visible control |
|-------|-----------------|
| `isRecording` | **Stop** (`type="button"`) — ends recognition; **`animate-pulse`** ([tailwind-animations](https://tailwind-animations.com/) pulse) |
| `!isRecording` && trimmed empty | **Mic** (`type="button"`) — starts recognition (if API available; otherwise hide or disable with a11y label) |
| `!isRecording` && trimmed non-empty | **Submit** (`type="submit"`) — **Send** icon when not `isPending`; **Loader2** (spinning) when `isPending`; disabled while pending |

**Files:** `src/app/app/_components/BrainDumpForm.tsx`  
**Verify:** Only one button visible; empty → Mic; type → Send; pending → spinner; recording → Stop; clear text → Mic again.

### T3: Types and unsupported browser
**What:** If TypeScript complains about `SpeechRecognition`, add a minimal local type augmentation (e.g. `declare global` in the same file or a small `speech-recognition.d.ts` next to the component only if required) or cast the constructor—avoid a large abstraction layer.

**Files:** `src/types/speech-recognition.d.ts`, `src/app/app/_components/BrainDumpForm.tsx`  
**Verify:** `pnpm exec tsc --noEmit` or project build passes.

## Validation

- `pnpm lint` (or `pnpm build` in CI) succeeds.
- Manual: dictation fills textarea with live updates; submit processes via existing action; no changes to `processBrainDump.ts`.
- Manual: only one of Mic / Stop / Submit is visible; submit shows Send then a spinning loader while pending; Stop pulses while recording (`animate-pulse`).
- Manual: Safari/Firefox without API—Mic click shows inline error; typed flow still works once text exists (Send appears).
