import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppNav } from "./_components/AppNav";
import { BrainDumpChat } from "./_components/BrainDumpChat";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <main className="h-screen overflow-hidden bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <section className="grid h-full grid-cols-1 gap-0 lg:grid-cols-12">
        <aside className="flex min-h-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:col-span-3">
          <div className="min-h-0 flex-1" aria-hidden="true" />

          <div className="border-t border-stone-200 bg-stone-50 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/80 overflow-y-auto">
            <BrainDumpChat />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-stone-100 dark:bg-stone-950 lg:col-span-9">
          <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
            <AppNav />
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </section>
      </section>
    </main>
  );
}
