import { BrainCircuit } from "lucide-react";

export function MotivationSection() {
  return (
    <section className="border-x border-b border-stone-200 bg-stone-50 px-6 py-16 dark:border-stone-800 dark:bg-stone-950 sm:px-10">
      <div className="grid border border-stone-200 bg-stone-100/80 shadow-sm dark:border-stone-800 dark:bg-stone-900/70 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="border-b border-stone-200 p-8 dark:border-stone-800 lg:border-r lg:border-b-0 lg:p-10">
          <div className="mb-6 inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
            <BrainCircuit className="h-4 w-4" />
            The Why
          </div>
          <h2 className="max-w-md text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-50 sm:text-4xl">
            The Point of Capture is Broken.
          </h2>
        </div>

        <div className="p-8 lg:p-10">
          <p className="max-w-2xl text-base leading-8 text-stone-700 dark:text-stone-300 sm:text-lg">
            Traditional productivity apps demand that you categorize, tag, and
            schedule information at the exact moment you capture it. That creates
            cognitive friction. I wanted the freedom of a digital Bullet Journal
            with zero overhead. You just spit out your thoughts; the system
            handles the architecture.
          </p>
        </div>
      </div>
    </section>
  );
}
