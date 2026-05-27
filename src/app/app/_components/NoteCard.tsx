import { deleteNote } from "@/app/actions/deleteNote";
import { Trash2 } from "lucide-react";

type NoteItem = {
  id: string;
  content: string;
};

export function NoteCard({ note }: { note: NoteItem }) {
  async function deleteAction() {
    "use server";
    await deleteNote(note.id);
  }

  return (
    <article className="rounded-xl border border-stone-300 bg-white/90 p-3 dark:border-stone-700 dark:bg-stone-950/85">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">{note.content}</p>
        <form action={deleteAction}>
          <button
            type="submit"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-rose-400 dark:focus-visible:ring-stone-500/50"
            aria-label="Delete note"
            title="Delete note"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </article>
  );
}
