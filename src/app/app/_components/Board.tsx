import { BoardColumn } from "./BoardColumn";
import { NoteCard } from "./NoteCard";

type NoteItem = {
  id: string;
  content: string;
};

type BoardProps = {
  notes: NoteItem[];
};

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-400/70 bg-stone-100/80 px-3 py-4 text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-400">
      {label}
    </p>
  );
}

export function Board({ notes }: BoardProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-stone-200/85 p-4 bg-[radial-gradient(circle_at_1px_1px,rgba(68,64,60,0.26)_1px,transparent_0)] bg-size-[18px_18px] dark:border-stone-700 dark:bg-stone-900/80 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(231,229,228,0.18)_1px,transparent_0)]">
      <BoardColumn title="Notes" itemCount={notes.length}>
        {notes.length > 0 ? notes.map((note) => <NoteCard key={note.id} note={note} />) : <EmptyState label="No notes yet." />}
      </BoardColumn>
    </div>
  );
}
