"use client";

import { processBrainDump } from "@/app/actions/processBrainDump";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function BrainDumpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label
        className="block text-xs font-medium tracking-[0.14em] text-stone-500 dark:text-stone-400"
        htmlFor="brain-dump"
      >
        Drop your thoughts, fragments, and reminders. We will shape them into a
        clean board.
      </label>
      <textarea
        id="brain-dump"
        name="brainDump"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Example: Follow up with Ana about invoices, plan birthday dinner next Friday, and note that onboarding docs need review."
        className="max-h-56 min-h-28 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-relaxed text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-400/50 dark:border-stone-600 dark:bg-stone-950/80 dark:text-stone-100 dark:focus:border-stone-400"
      />
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        {isPending ? "Loading..." : "Process Brain Dump"}
      </button>
    </form>
  );
}
