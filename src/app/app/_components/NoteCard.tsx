type NoteItem = {
  id: string;
  content: string;
};

export function NoteCard({ note }: { note: NoteItem }) {
  return (
    <article className="rounded-xl border border-stone-300 bg-white/90 p-3 dark:border-stone-700 dark:bg-stone-950/85">
      <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">{note.content}</p>
    </article>
  );
}
