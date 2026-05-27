"use server";

import { auth } from "@/auth";
import { TaskStatusSchema, type TaskStatus } from "@/contracts";
import { prisma } from "@/lib/prisma";
import { transitionTask } from "@/lib/state-machine";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateTaskStatusInputSchema = z.object({
  taskId: z.uuid(),
  targetStatus: TaskStatusSchema,
});

export type UpdateTaskStatusResult =
  | { success: true }
  | { success: false; error: string };

export async function updateTaskStatus(
  taskId: string,
  targetStatus: TaskStatus
): Promise<UpdateTaskStatusResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Please sign in to update tasks." };
    }

    const parsed = UpdateTaskStatusInputSchema.safeParse({ taskId, targetStatus });
    if (!parsed.success) {
      return { success: false, error: "Invalid task or status." };
    }

    const task = await prisma.task.findFirst({
      where: { id: parsed.data.taskId, user_id: userId },
      select: { id: true, status: true },
    });

    if (!task) {
      return { success: false, error: "Task not found." };
    }

    const nextStatus = transitionTask(task.status, parsed.data.targetStatus);

    if (nextStatus === task.status) {
      return { success: true };
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { status: nextStatus },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Invalid state transition")) {
      return { success: false, error: error.message };
    }
    console.error("Error during updateTaskStatus:", error);
    return { success: false, error: "Could not update task status." };
  }
}
