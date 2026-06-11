import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Board } from "./_components/Board";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const [notes, events] = await Promise.all([
    prisma.note.findMany({ where: { user_id: userId, deleted_at: null }, orderBy: { createdAt: "desc" } }),
    prisma.event.findMany({ where: { user_id: userId, deleted_at: null }, orderBy: { createdAt: "asc" } }),
  ]);

  return <Board notes={notes} events={events} />;
}
