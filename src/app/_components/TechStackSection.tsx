import {
  Bot,
  Database,
  Layers,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { LandingSectionHeading } from "./LandingSectionHeading";

const stackCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    title: "Next.js",
    description:
      "App Router composition keeps the UI server-first, fast, and easy to extend.",
    icon: Layers,
    accent:
      "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-950",
  },
  {
    title: "SQLite",
    description:
      "A local-first data layer keeps the app grounded, inspectable, and reliable.",
    icon: Database,
    accent:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  {
    title: "LLM + Structured Outputs",
    description:
      "The model does the interpretation while contracts keep the output constrained.",
    icon: Bot,
    accent: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  {
    title: "Zod",
    description:
      "Schemas enforce the shape, reduce ambiguity, and protect the database boundary.",
    icon: ShieldCheck,
    accent:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
];

export function TechStackSection() {
  return (
    <section className="space-y-10 border-x border-b border-stone-200 bg-white px-6 py-16 dark:border-stone-800 dark:bg-stone-950 sm:px-10">
      <LandingSectionHeading
        eyebrow="Architecture"
        title="A narrow stack with deliberate boundaries."
        description="Every layer exists to remove friction: render fast, validate aggressively, and let the AI help without letting it drift."
      />

      <div className="grid gap-px border border-stone-200 bg-stone-200 shadow-sm dark:border-stone-800 dark:bg-stone-800 md:grid-cols-2 xl:grid-cols-4">
        {stackCards.map(({ title, description, icon: Icon, accent }) => (
          <article
            key={title}
            className="group bg-stone-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-md dark:bg-stone-900 dark:hover:bg-stone-900/90"
          >
            <div className="flex h-full flex-col gap-6">
              <div className={`inline-flex w-fit border border-transparent p-4 ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-stone-950 dark:text-stone-50">
                  {title}
                </h3>
                <p className="max-w-[22ch] text-sm leading-6 text-stone-600 dark:text-stone-400">
                  {description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
