type EventItem = {
  id: string;
  title: string;
  dateISO: string;
};

function formatDate(dateISO: string): string {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) {
    return dateISO;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function EventCard({ event }: { event: EventItem }) {
  return (
    <article className="rounded-xl border border-stone-300 bg-white/90 p-3 dark:border-stone-700 dark:bg-stone-950/85">
      <p className="text-sm font-medium leading-relaxed text-stone-900 dark:text-stone-100">{event.title}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-stone-600 dark:text-stone-400">
        {formatDate(event.dateISO)}
      </p>
    </article>
  );
}
