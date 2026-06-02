"use server";

import { auth } from "@/auth";
import { type AgentAction, AgentPlanSchema, validateAgentActions } from "@/lib/brain-dump-agent";
import { prisma } from "@/lib/prisma";
import { transitionTask } from "@/lib/state-machine";
import { revalidatePath } from "next/cache";

export type ApplyBrainDumpActionsResult =
  | { success: true; appliedCounts: { create: number; update: number; changeStatus: number; delete: number } }
  | { success: false; error: string };

export async function applyBrainDumpActions(actions: AgentAction[]): Promise<ApplyBrainDumpActionsResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Please sign in before applying actions." };
    }

    const parsed = AgentPlanSchema.safeParse({ actions });
    if (!parsed.success) {
      return { success: false, error: "Invalid action payload." };
    }

    const [tasks, notes, events] = await Promise.all([
      prisma.task.findMany({
        where: { user_id: userId, deleted_at: null },
        select: { id: true, title: true, status: true, deleted_at: true },
      }),
      prisma.note.findMany({
        where: { user_id: userId, deleted_at: null },
        select: { id: true, content: true, deleted_at: true },
      }),
      prisma.event.findMany({
        where: { user_id: userId, deleted_at: null },
        select: { id: true, title: true, dateISO: true, deleted_at: true },
      }),
    ]);

    const { validActions, rejected } = validateAgentActions(parsed.data.actions, { tasks, notes, events });
    if (rejected.length > 0) {
      return { success: false, error: "Plan contains invalid actions. Please regenerate suggestions." };
    }

    const deletes = validActions.filter((action) => action.action === "DELETE");
    const updates = validActions.filter((action) => action.action === "UPDATE");
    const statusChanges = validActions.filter((action) => action.action === "CHANGE_STATUS");
    const creates = validActions.filter((action) => action.action === "CREATE");

    await prisma.$transaction(async (tx) => {
      for (const action of deletes) {
        const now = new Date();
        if (action.entityType === "task") {
          await tx.task.updateMany({
            where: { id: action.id, user_id: userId, deleted_at: null },
            data: { deleted_at: now },
          });
          continue;
        }
        if (action.entityType === "note") {
          await tx.note.updateMany({
            where: { id: action.id, user_id: userId, deleted_at: null },
            data: { deleted_at: now },
          });
          continue;
        }
        await tx.event.updateMany({
          where: { id: action.id, user_id: userId, deleted_at: null },
          data: { deleted_at: now },
        });
      }

      for (const action of updates) {
        if (action.entityType === "task") {
          await tx.task.updateMany({
            where: { id: action.id, user_id: userId, deleted_at: null },
            data: {
              ...(action.title ? { title: action.title } : {}),
              ...(action.status ? { status: transitionTask(tasks.find((task) => task.id === action.id)!.status, action.status) } : {}),
            },
          });
          continue;
        }
        if (action.entityType === "note") {
          await tx.note.updateMany({
            where: { id: action.id, user_id: userId, deleted_at: null },
            data: action.content ? { content: action.content } : {},
          });
          continue;
        }
        await tx.event.updateMany({
          where: { id: action.id, user_id: userId, deleted_at: null },
          data: {
            ...(action.title ? { title: action.title } : {}),
            ...(action.dateISO ? { dateISO: action.dateISO } : {}),
          },
        });
      }

      for (const action of statusChanges) {
        const task = tasks.find((item) => item.id === action.id);
        if (!task) continue;
        await tx.task.updateMany({
          where: { id: action.id, user_id: userId, deleted_at: null },
          data: { status: transitionTask(task.status, action.status) },
        });
      }

      const taskCreates = creates.filter((action) => action.entityType === "task");
      if (taskCreates.length > 0) {
        await tx.task.createMany({
          data: taskCreates.map((action) => ({
            title: action.title!,
            status: action.status ?? "TODO",
            user_id: userId,
          })),
        });
      }

      const noteCreates = creates.filter((action) => action.entityType === "note");
      if (noteCreates.length > 0) {
        await tx.note.createMany({
          data: noteCreates.map((action) => ({
            content: action.content!,
            user_id: userId,
          })),
        });
      }

      const eventCreates = creates.filter((action) => action.entityType === "event");
      if (eventCreates.length > 0) {
        await tx.event.createMany({
          data: eventCreates.map((action) => ({
            title: action.title!,
            dateISO: action.dateISO!,
            user_id: userId,
          })),
        });
      }
    });

    revalidatePath("/app");
    return {
      success: true,
      appliedCounts: {
        create: creates.length,
        update: updates.length,
        changeStatus: statusChanges.length,
        delete: deletes.length,
      },
    };
  } catch (error: unknown) {
    console.error("Error during applyBrainDumpActions:", error);
    return { success: false, error: "Could not apply suggested actions." };
  }
}
