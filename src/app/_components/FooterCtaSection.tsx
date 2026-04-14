import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FooterCtaSection() {
  return (
    <section className="border-x border-b border-stone-200 bg-white px-6 py-16 dark:border-stone-800 dark:bg-stone-950 sm:px-10">
      <div className="border border-stone-200 bg-stone-100 shadow-inner dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-12 text-center sm:px-10">
          <div className="space-y-4">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
              Ready To Use
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-50 sm:text-4xl">
              Skip the taxonomy. Start with the raw thought.
            </h2>
            <p className="text-base leading-7 text-stone-600 dark:text-stone-400">
              The dashboard is where the system earns the promise. Paste the mess,
              let the model sort it, and keep moving.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 border border-stone-950 bg-stone-950 px-6 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-300"
          >
            Open Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-stone-600 dark:text-stone-400">
            <a
              href="https://github.com/gerabu/chatter"
              target="_blank"
              rel="noreferrer"
              className="border-b border-transparent pb-0.5 transition hover:border-current hover:text-stone-950 dark:hover:text-stone-50"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/gerald-aburto-urroz/"
              target="_blank"
              rel="noreferrer"
              className="border-b border-transparent pb-0.5 transition hover:border-current hover:text-stone-950 dark:hover:text-stone-50"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
