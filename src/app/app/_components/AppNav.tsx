"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/events", label: "Events" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex h-8 w-fit items-center justify-center rounded-lg bg-stone-100 p-[3px] text-stone-500 dark:bg-stone-800 dark:text-stone-400">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-3 py-0.5 text-sm font-medium transition-all focus-visible:border-stone-400 focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-stone-400/50",
              isActive
                ? "bg-white text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-700/30 dark:text-stone-100"
                : "text-stone-900/60 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
