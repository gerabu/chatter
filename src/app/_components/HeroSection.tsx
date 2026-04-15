import Link from "next/link";
import { ArrowRight, AppWindow, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-x border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(28,25,23,0.16)_1px,transparent_0)] bg-size-[18px_18px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(245,245,244,0.12)_1px,transparent_0)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/70 to-transparent dark:from-stone-950 dark:via-stone-950/70"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center sm:px-10 sm:py-28">
        <div className="inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 shadow-sm animate-fade-in dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Built with Spec-Driven Development</span>
        </div>

        <div className="mt-8 max-w-4xl space-y-6 animate-fade-in">
          <h1 className="text-5xl font-semibold tracking-[-0.08em] text-stone-950 dark:text-stone-50 sm:text-7xl lg:text-[5.5rem] lg:leading-[0.95]">
            <span className="bg-gradient-to-r from-stone-950 via-stone-700 to-stone-500 bg-clip-text text-transparent dark:from-stone-50 dark:via-stone-200 dark:to-stone-500">
              From Chaos to Clarity
            </span>
            <br />
            <span className="text-stone-950 dark:text-stone-50">in One Click.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-8 text-stone-600 dark:text-stone-400 sm:text-lg">
            Capture the mess exactly as it arrives. Chatter turns loose thoughts
            into a clean operating system for tasks, notes, and events without
            making you organize first.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row animate-fade-in">
          <Link
            href="/app"
            className="inline-flex h-12 items-center justify-center gap-2 border border-stone-950 bg-stone-950 px-6 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-300"
          >
            Open App
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#workflow"
            className="inline-flex h-12 items-center justify-center gap-2 border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
          >
            <AppWindow className="h-4 w-4" />
            See the workflow
          </Link>
        </div>
      </div>
    </section>
  );
}
