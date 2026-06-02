"use client";

import { applyBrainDumpActions } from "@/app/actions/applyBrainDumpActions";
import { suggestBrainDumpActions } from "@/app/actions/suggestBrainDumpActions";
import { type AgentAction } from "@/lib/brain-dump-agent";
import { Loader2, Mic, Send, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { ActionPreview } from "./ActionPreview";

type RejectedAction = {
  action: AgentAction;
  reason: string;
};

type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
    }
  | {
      id: string;
      role: "assistant";
      actions: AgentAction[];
      rejected: RejectedAction[];
      isApplying: boolean;
      isApplied: boolean;
      applyError: string | null;
    };

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

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BrainDumpChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        // ignore
      }
    } finally {
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
    recognition.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isRecording) return;

    const text = value.trim();
    if (!text) {
      setError("Please add a few details before processing.");
      return;
    }

    setError(null);
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);

    startTransition(async () => {
      const result = await suggestBrainDumpActions(text);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          actions: result.actions,
          rejected: result.rejected,
          isApplying: false,
          isApplied: false,
          applyError: null,
        },
      ]);
      setValue("");
    });
  }

  async function applyMessageActions(messageId: string) {
    const message = messages.find((item) => item.id === messageId);
    if (!message || message.role !== "assistant" || message.isApplied || message.isApplying) {
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId && item.role === "assistant"
          ? { ...item, isApplying: true, applyError: null }
          : item
      )
    );

    const cleanActions = message.actions.map(
      (a) => {
        const { label, ...rest } = a as AgentAction & { label?: string };
        return rest as AgentAction;
      }
    );
    const result = await applyBrainDumpActions(cleanActions);
    if (!result.success) {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId && item.role === "assistant"
            ? { ...item, isApplying: false, applyError: result.error }
            : item
        )
      );
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId && item.role === "assistant"
          ? { ...item, isApplying: false, isApplied: true, applyError: null }
          : item
      )
    );
    router.refresh();
  }

  const showSubmit = !isRecording && value.trim().length > 0;

  const actionButtonClass = useMemo(
    () =>
      "absolute bottom-3 right-3 z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-stone-500/50",
    []
  );

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 pb-3">
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 px-3 py-4 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300">
            Describe what changed and review suggested actions before applying.
          </p>
        ) : null}

        {messages.map((message) =>
          message.role === "user" ? (
            <article
              key={message.id}
              className="ml-8 rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-950/80 dark:text-stone-100"
            >
              {message.text}
            </article>
          ) : (
            <ActionPreview
              key={message.id}
              actions={message.actions}
              rejected={message.rejected}
              isApplying={message.isApplying}
              isApplied={message.isApplied}
              applyError={message.applyError}
              onAccept={() => applyMessageActions(message.id)}
            />
          )
        )}
      </div>

      <form className="relative border-t border-stone-200 pt-3 dark:border-stone-800" onSubmit={handleSubmit}>
        <textarea
          id="brain-dump-chat-input"
          name="brainDump"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type your brain dump. Example: cancel dinner event, mark grocery task done, update note about onboarding."
          className="max-h-56 min-h-28 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 pb-14 pr-14 text-sm leading-relaxed text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-400/50 dark:border-stone-600 dark:bg-stone-950/80 dark:text-stone-100 dark:focus:border-stone-400"
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
            aria-label={isPending ? "Generating suggestions" : "Generate suggestions"}
          >
            {isPending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
          </button>
        ) : null}
      </form>

      {error ? (
        <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
