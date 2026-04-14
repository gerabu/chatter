import {
  Bot,
  Clock3,
  DatabaseZap,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { LandingSectionHeading } from "./LandingSectionHeading";

const stats: Array<{
  value: string;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "1", label: "Core Developer", icon: UserRound },
  { value: "~10 hours", label: "of prompting & reviewing", icon: Clock3 },
  { value: "1", label: "AI Model Used", icon: Bot },
  { value: "0", label: "Database Hallucinations", icon: DatabaseZap },
];

export function ByTheNumbersSection() {
  return (
    <section className="space-y-10 border-x border-b border-stone-200 bg-white px-6 py-16 dark:border-stone-800 dark:bg-stone-950 sm:px-10">
      <LandingSectionHeading
        eyebrow="By The Numbers"
        title="A small stack with a disciplined loop."
        description="This product was shaped with a tight implementation cycle: spec first, code second, validation always."
      />

      <div className="grid gap-px border border-stone-200 bg-stone-200 shadow-sm dark:border-stone-800 dark:bg-stone-800 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ value, label, icon: Icon }) => (
          <article
            key={label}
            className="bg-stone-50 p-5 transition hover:bg-white dark:bg-stone-900 dark:hover:bg-stone-900/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-50">
                  {value}
                </p>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                  {label}
                </p>
              </div>
              <div className="border border-stone-200 bg-white p-3 text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
