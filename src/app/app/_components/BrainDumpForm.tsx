"use client";

import { processBrainDump } from "@/app/actions/processBrainDump";
import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Send, Square } from "lucide-react";

function getSpeechRecognitionConstructor(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    window.SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

function transcriptFromResults(results: SpeechRecognitionResultList): string {
  let text = "";
  for (let i = 0; i < results.length; i++) {
    text += results[i]![0]!.transcript;
  }
  return text;
}

export function BrainDumpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dictationPrefixRef = useRef("");

  function stopRecognition() {
    const r = recognitionRef.current;
    if (!r) {
      setIsRecording(false);
      return;
    }
    try {
      r.stop();
    } catch {
      try {
        r.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }

  function startRecognition() {
    setError(null);
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    dictationPrefixRef.current = value;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const dictation = transcriptFromResults(event.results);
      setValue(dictationPrefixRef.current + dictation);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsRecording(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      recognitionRef.current = null;
      setError("Could not start microphone. Check permissions.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRecording || isPending) {
      return;
    }

    const text = value.trim();

    if (!text) {
      setError("Please add a few details before processing.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await processBrainDump(text);
      if (!result.success) {
        setError(result.error ?? "We could not process this brain dump.");
        return;
      }

      setValue("");
      router.refresh();
    });
  }

  const trimmed = value.trim();
  const showSubmit = !isRecording && trimmed.length > 0;

  const actionButtonClass =
    "absolute bottom-3 right-3 z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-stone-500/50";

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label
        className="block text-xs font-medium tracking-[0.14em] text-stone-500 dark:text-stone-400"
        htmlFor="brain-dump"
      >
        Drop your thoughts, fragments, and reminders. We will shape them into a
        clean board.
      </label>
      <div className="relative">
        <textarea
          id="brain-dump"
          name="brainDump"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Example: Follow up with Ana about invoices, plan birthday dinner next Friday, and note that onboarding docs need review."
          className="max-h-56 min-h-28 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 pr-14 pb-14 text-sm leading-relaxed text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-400/50 dark:border-stone-600 dark:bg-stone-950/80 dark:text-stone-100 dark:focus:border-stone-400"
        />

        {isRecording ? (
          <button
            type="button"
            className={`${actionButtonClass} animate-pulse bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600`}
            onClick={stopRecognition}
            aria-label="Stop recording"
          >
            <Square className="size-4 fill-current" aria-hidden />
          </button>
        ) : null}

        {!isRecording && !showSubmit ? (
          <button
            type="button"
            className={`${actionButtonClass} bg-stone-900 text-stone-50 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300`}
            onClick={startRecognition}
            aria-label="Start voice input"
          >
            <Mic className="size-5" aria-hidden />
          </button>
        ) : null}

        {!isRecording && showSubmit ? (
          <button
            type="submit"
            disabled={isPending}
            className={`${actionButtonClass} bg-stone-900 text-stone-50 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300`}
            aria-label={isPending ? "Processing brain dump" : "Submit brain dump"}
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Send className="size-5" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}
