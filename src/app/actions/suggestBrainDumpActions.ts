"use server";

import { auth } from "@/auth";
import { buildBrainDumpAgentPrompt } from "@/lib/brain-dump-agent-prompt";
import { AgentPlanSchema, type AgentAction, validateAgentActions } from "@/lib/brain-dump-agent";
import { openai } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";
import { generateText, Output } from "ai";
import { z } from "zod";

type Rejected = {
  action: AgentAction;
  reason: string;
};

export type SuggestBrainDumpActionsResult =
  | { success: true; actions: AgentAction[]; rejected: Rejected[] }
  | { success: false; error: string; errorType: "validation" | "parsing" | "unknown" };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error while generating suggestions.";
}

export async function suggestBrainDumpActions(text: string): Promise<SuggestBrainDumpActionsResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Please sign in before processing your brain dump.", errorType: "validation" };
    }

    const normalizedText = text.trim();
    if (!normalizedText) {
      return { success: false, error: "Please enter a brain dump before submitting.", errorType: "validation" };
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

    const currentDateISO = new Date().toISOString();
    const { system, prompt } = buildBrainDumpAgentPrompt({
      text: normalizedText,
      currentDateISO,
      snapshotJson: JSON.stringify({ tasks, notes, events }),
    });

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: AgentPlanSchema }),
      providerOptions: {
        openai: {
          strictJsonSchema: false,
        },
      },
      system,
      prompt,
    });

    const { validActions, rejected } = validateAgentActions(output.actions, { tasks, notes, events });

    const tasksById = new Map(tasks.map(t => [t.id, t.title]));
    const notesById = new Map(notes.map(n => [n.id, n.content]));
    const eventsById = new Map(events.map(e => [e.id, e.title]));

    const enrichedActions = validActions.map(action => {
      if (action.action === "CREATE") return action;
      let label: string;
      if (action.entityType === "task") label = tasksById.get(action.id) ?? action.id;
      else if (action.entityType === "note") label = notesById.get(action.id) ?? action.id;
      else label = eventsById.get(action.id) ?? action.id;
      return { ...action, label } as unknown as AgentAction;
    });

    return { success: true, actions: enrichedActions, rejected };
  } catch (error: unknown) {
    console.error("Error during suggestBrainDumpActions:", error);
    if ((error instanceof Error && error.name === "TypeValidationError") || error instanceof z.ZodError) {
      return { success: false, error: `Model output schema mismatch: ${getErrorMessage(error)}`, errorType: "validation" };
    }
    if (error instanceof Error && (error.name === "JSONParseError" || error.name === "NoObjectGeneratedError")) {
      return { success: false, error: `Model failed to output valid JSON: ${getErrorMessage(error)}`, errorType: "parsing" };
    }
    return { success: false, error: getErrorMessage(error), errorType: "unknown" };
  }
}
