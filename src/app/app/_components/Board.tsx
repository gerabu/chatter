import { type TaskStatus } from "@/contracts";
import { BoardColumn } from "./BoardColumn";
import { EventCard } from "./EventCard";
import { NoteCard } from "./NoteCard";
import { TaskCard, type TaskItem } from "./TaskCard";

type NoteItem = {
  id: string;
  content: string;
};

type EventItem = {
  id: string;
  title: string;
  dateISO: string;
};

type BoardProps = {
  tasks: TaskItem[];
  notes: NoteItem[];
  events: EventItem[];
};

const ACTIVE_STATUSES: TaskStatus[] = ["TODO", "MIGRATED"];
const CLOSED_STATUSES: TaskStatus[] = ["DONE", "CANCELLED"];

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-400/70 bg-stone-100/80 px-3 py-4 text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-400">
      {label}
    </p>
  );
}

function TasksColumn({ tasks }: { tasks: TaskItem[] }) {
  const activeTasks = tasks.filter((task) => ACTIVE_STATUSES.includes(task.status));
  const closedTasks = tasks.filter((task) => CLOSED_STATUSES.includes(task.status));

  if (tasks.length === 0) {
    return <EmptyState label="No tasks yet." />;
  }

  return (
    <>
      {activeTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}

      {closedTasks.length > 0 ? (
        <details className="group rounded-xl border border-stone-300/80 bg-stone-50/90 dark:border-stone-600 dark:bg-stone-900/60">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-stone-700 marker:content-none dark:text-stone-300 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span>Completed &amp; cancelled ({closedTasks.length})</span>
              <span className="text-stone-500 transition group-open:rotate-180 dark:text-stone-400" aria-hidden>
                ▾
              </span>
            </span>
          </summary>
          <div className="space-y-3 border-t border-stone-300/70 px-3 py-3 dark:border-stone-600">
            {closedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

export function Board({ tasks, notes, events }: BoardProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-stone-200/85 p-4 bg-[radial-gradient(circle_at_1px_1px,rgba(68,64,60,0.26)_1px,transparent_0)] bg-size-[18px_18px] dark:border-stone-700 dark:bg-stone-900/80 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(231,229,228,0.18)_1px,transparent_0)]">
      <div className="grid gap-4 xl:grid-cols-3">
        <BoardColumn title="Tasks" itemCount={tasks.length}>
          <TasksColumn tasks={tasks} />
        </BoardColumn>

        <BoardColumn title="Notes" itemCount={notes.length}>
          {notes.length > 0 ? notes.map((note) => <NoteCard key={note.id} note={note} />) : <EmptyState label="No notes yet." />}
        </BoardColumn>

        <BoardColumn title="Events" itemCount={events.length}>
          {events.length > 0 ? events.map((event) => <EventCard key={event.id} event={event} />) : <EmptyState label="No events yet." />}
        </BoardColumn>
      </div>
    </div>
  );
}
