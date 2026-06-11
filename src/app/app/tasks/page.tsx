import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TasksBoard } from "../_components/TasksBoard";

export default async function TasksPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const tasks = await prisma.task.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { createdAt: "desc" },
  });

  return <TasksBoard tasks={tasks} />;
}
