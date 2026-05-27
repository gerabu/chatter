import { BrainDumpForm } from "./_components/BrainDumpForm";
import { Board } from "./_components/Board";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const [tasks, notes, events] = await Promise.all([
    prisma.task.findMany({ where: { user_id: userId }, orderBy: { createdAt: "desc" } }),
    prisma.note.findMany({ where: { user_id: userId, deleted_at: null }, orderBy: { createdAt: "desc" } }),
    prisma.event.findMany({ where: { user_id: userId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <main className="h-screen overflow-hidden bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <section className="grid h-full grid-cols-1 gap-0 lg:grid-cols-12">
        <aside className="flex min-h-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:col-span-3">
          <div className="min-h-0 flex-1" aria-hidden="true" />

          <div className="border-t border-stone-200 bg-stone-50 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/80">
            <BrainDumpForm />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-stone-100 dark:bg-stone-950 lg:col-span-9">
          <div className="min-h-0 flex-1">
            <Board tasks={tasks} notes={notes} events={events} />
          </div>
        </section>
      </section>
    </main>
  );
}
