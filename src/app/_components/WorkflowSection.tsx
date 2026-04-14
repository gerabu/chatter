import { LandingSectionHeading } from "./LandingSectionHeading";

const steps = [
  {
    title: "Plan",
    description: "Define the shape of the work before touching code.",
  },
  {
    title: "Generate Spec",
    description: "Turn the feature request into concrete, testable tasks.",
  },
  {
    title: "Review",
    description: "Inspect constraints, edge cases, and the actual scope.",
  },
  {
    title: "Implement",
    description: "Build the feature in small, readable, composable pieces.",
  },
  {
    title: "Validate",
    description: "Run lint, tests, and manual UI checks against the spec.",
  },
  {
    title: "Commit",
    description: "Ship only when the feature is coherent and defensible.",
  },
];

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="space-y-10 border-x border-b border-stone-200 bg-stone-50 px-6 py-16 dark:border-stone-800 dark:bg-stone-950 sm:px-10"
    >
      <LandingSectionHeading
        eyebrow="Spec-Driven Workflow"
        title="Build discipline directly into the delivery loop."
        description="The process is intentionally visible: every feature moves through a fixed pipeline so implementation quality does not depend on improvisation."
      />

      <div className="relative border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute left-11 top-8 bottom-8 w-px bg-stone-200 dark:bg-stone-700 lg:left-8 lg:right-8 lg:top-11 lg:bottom-auto lg:h-px lg:w-auto"
        />

        <div className="relative grid gap-8 lg:grid-cols-6 lg:gap-6">
          {steps.map((step, index) => (
            <article key={step.title} className="relative flex gap-4 lg:flex-col lg:gap-5">
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-stone-300 bg-stone-950 text-xs font-semibold text-stone-50 dark:border-stone-700 dark:bg-stone-100 dark:text-stone-950">
                {index + 1}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold tracking-[-0.03em] text-stone-950 dark:text-stone-50">
                  {step.title}
                </h3>
                <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
