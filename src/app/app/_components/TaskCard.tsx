"use client";

import { updateTaskStatus } from "@/app/actions/updateTaskStatus";
import { type TaskStatus } from "@/contracts";
import { getAllowedTaskStatuses } from "@/lib/state-machine";
import { statusLabels } from "@/lib/task-status";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState, useTransition } from "react";

export type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
};

const statusStyles: Record<TaskStatus, string> = {
  TODO: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
  DONE: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200",
  IN_PROGRESS: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/60 dark:text-blue-200",
  CANCELLED: "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/60 dark:text-rose-200",
};

export function TaskCard({ task }: { task: TaskItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const allowedStatuses = getAllowedTaskStatuses(task.status);
  const isLocked = allowedStatuses.length <= 1;

  function onStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const targetStatus = event.target.value as TaskStatus;
    if (targetStatus === task.status) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await updateTaskStatus(task.id, targetStatus);
      if (!result.success) {
        setError(result.error ?? "Could not update status.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <article className="rounded-xl border border-stone-300 bg-white/90 p-3 dark:border-stone-700 dark:bg-stone-950/85">
      <p className="text-sm font-medium leading-relaxed text-stone-900 dark:text-stone-100">{task.title}</p>
      <select
        value={task.status}
        onChange={onStatusChange}
        disabled={isPending || isLocked}
        aria-label={`Status for ${task.title}`}
        className={[
          "mt-2 block w-full cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-semibold tracking-wide outline-none transition focus:ring-2 focus:ring-stone-400/50 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-stone-500/50",
          statusStyles[task.status],
        ].join(" ")}
      >
        {allowedStatuses.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-2 text-[10px] leading-snug text-rose-700 dark:text-rose-300">{error}</p>
      ) : null}
    </article>
  );
}
