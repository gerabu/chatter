"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

type EventItem = {
  id: string;
  title: string;
  dateISO: string;
};

type ParsedEvent = EventItem & { date: Date };

const WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DAY_FMT = new Intl.DateTimeFormat("en-US", { day: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });
const RANGE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const RANGE_FMT_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Parse an event `dateISO` as a literal wall-clock time, ignoring any timezone
 * suffix. The brain dump stores the time the user intended (e.g. 17:00) but
 * tags it `Z`, so converting through the browser's timezone would shift it.
 * We read the calendar fields straight from the string instead.
 */
function parseWallClock(dateISO: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(dateISO);
  if (!match) {
    return new Date(dateISO); // fall back; caller filters out NaN
  }
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? "0")
  );
}

/** Midnight (local) of the Monday that starts the week containing `date`. */
function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (monday.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
  monday.setDate(monday.getDate() - offset);
  return monday;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function WeeklyCalendar({ events }: { events: EventItem[] }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const today = useMemo(() => new Date(), []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const parsed = useMemo<ParsedEvent[]>(() => {
    return events
      .map((event) => ({ ...event, date: parseWallClock(event.dateISO) }))
      .filter((event) => !Number.isNaN(event.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const eventsByDay = useMemo(
    () => days.map((day) => parsed.filter((event) => isSameDay(event.date, day))),
    [days, parsed]
  );

  const weekEnd = days[6]!;
  const rangeLabel =
    weekStart.getFullYear() === weekEnd.getFullYear()
      ? `${RANGE_FMT.format(weekStart)} – ${RANGE_FMT_YEAR.format(weekEnd)}`
      : `${RANGE_FMT_YEAR.format(weekStart)} – ${RANGE_FMT_YEAR.format(weekEnd)}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-200/85 bg-[radial-gradient(circle_at_1px_1px,rgba(68,64,60,0.26)_1px,transparent_0)] bg-size-[18px_18px] dark:bg-stone-900/80 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(231,229,228,0.18)_1px,transparent_0)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300/70 px-4 py-3 dark:border-stone-700/80">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{rangeLabel}</h2>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((current) => addDays(current, -7))}
            aria-label="Previous week"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
            aria-label="Next week"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="grid grid-flow-col auto-cols-[minmax(11rem,1fr)] gap-3 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = eventsByDay[index]!;
            const isToday = isSameDay(day, today);
            return (
              <section
                key={day.toISOString()}
                className={[
                  "flex flex-col rounded-xl border p-3 shadow-sm backdrop-blur-sm",
                  isToday
                    ? "border-stone-900/70 bg-white dark:border-stone-100/70 dark:bg-stone-900"
                    : "border-stone-300/70 bg-stone-50/90 dark:border-stone-700/80 dark:bg-stone-900/70",
                ].join(" ")}
              >
                <header className="mb-3 flex items-baseline justify-between">
                  <span
                    className={[
                      "text-xs font-semibold uppercase tracking-wide",
                      isToday ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400",
                    ].join(" ")}
                  >
                    {WEEKDAY_FMT.format(day)}
                  </span>
                  <span
                    className={[
                      "text-sm font-semibold",
                      isToday ? "text-stone-900 dark:text-stone-100" : "text-stone-700 dark:text-stone-300",
                    ].join(" ")}
                  >
                    {DAY_FMT.format(day)}
                  </span>
                </header>

                <div className="space-y-2">
                  {dayEvents.length > 0 ? (
                    dayEvents.map((event) => (
                      <article
                        key={event.id}
                        className="rounded-lg border border-stone-300 bg-white/90 p-2 dark:border-stone-700 dark:bg-stone-950/85"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-400">
                          {TIME_FMT.format(event.date)}
                        </p>
                        <p className="mt-1 text-sm leading-snug text-stone-900 dark:text-stone-100">
                          {event.title}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-stone-300/70 px-2 py-3 text-center text-xs text-stone-400 dark:border-stone-700/70 dark:text-stone-600">
                      No events
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
