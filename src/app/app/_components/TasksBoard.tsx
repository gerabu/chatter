import { type TaskStatus } from "@/contracts";
import { BoardColumn } from "./BoardColumn";
import { statusLabels, TaskCard, type TaskItem } from "./TaskCard";

type TasksBoardProps = {
  tasks: TaskItem[];
};

// Fixed, logical column order: To do → In Progress → Done → Cancelled.
const COLUMN_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-400/70 bg-stone-100/80 px-3 py-4 text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-400">
      {label}
    </p>
  );
}

export function TasksBoard({ tasks }: TasksBoardProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-stone-200/85 p-4 bg-[radial-gradient(circle_at_1px_1px,rgba(68,64,60,0.26)_1px,transparent_0)] bg-size-[18px_18px] dark:border-stone-700 dark:bg-stone-900/80 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(231,229,228,0.18)_1px,transparent_0)]">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {COLUMN_ORDER.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <BoardColumn key={status} title={statusLabels[status]} itemCount={columnTasks.length}>
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <EmptyState label="No tasks here." />
              )}
            </BoardColumn>
          );
        })}
      </div>
    </div>
  );
}
