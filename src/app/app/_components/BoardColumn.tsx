import { ReactNode } from "react";

type BoardColumnProps = {
  title: string;
  itemCount: number;
  children: ReactNode;
};

export function BoardColumn({ title, itemCount, children }: BoardColumnProps) {
  return (
    <section className="border border-stone-300/70 bg-stone-50/90 p-4 shadow-sm backdrop-blur-sm dark:border-stone-700/80 dark:bg-stone-900/70">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
        <span className="rounded-full border border-stone-400/80 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:border-stone-500 dark:text-stone-300">
          {itemCount}
        </span>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
