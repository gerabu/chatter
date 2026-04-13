type TaskItem = {
  id: string;
  title: string;
  status: string;
};

const statusStyles: Record<string, string> = {
  TODO: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
  DONE: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200",
  MIGRATED: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/60 dark:text-blue-200",
  CANCELLED: "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/60 dark:text-rose-200",
};

export function TaskCard({ task }: { task: TaskItem }) {
  return (
    <article className="rounded-xl border border-stone-300 bg-white/90 p-3 dark:border-stone-700 dark:bg-stone-950/85">
      <p className="text-sm font-medium leading-relaxed text-stone-900 dark:text-stone-100">{task.title}</p>
      <span
        className={[
          "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
          statusStyles[task.status] ??
            "border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300",
        ].join(" ")}
      >
        {task.status}
      </span>
    </article>
  );
}
