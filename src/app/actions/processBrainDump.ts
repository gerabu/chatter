"use server";

import { EventSchema, NoteSchema, TaskSchema } from "@/contracts";
import { suggestBrainDumpActions } from "@/app/actions/suggestBrainDumpActions";
import { z } from "zod";

const BrainDumpExtractionSchema = z.object({
  tasks: z.array(TaskSchema.omit({ id: true, createdAt: true })),
  notes: z.array(NoteSchema.omit({ id: true, createdAt: true })),
  events: z.array(EventSchema.omit({ id: true, createdAt: true })),
});

export type BrainDumpResult = {
  success: boolean;
  data?: z.infer<typeof BrainDumpExtractionSchema>;
  error?: string;
  errorType?: "parsing" | "validation" | "unknown";
};

export async function processBrainDump(text: string): Promise<BrainDumpResult> {
  try {
    const result = await suggestBrainDumpActions(text);
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        errorType: result.errorType,
      };
    }

    // Legacy compatibility: return only CREATE items without persisting.
    const tasks: Array<{ title: string; status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" }> = [];
    const notes: Array<{ content: string }> = [];
    const events: Array<{ title: string; dateISO: string }> = [];

    for (const action of result.actions) {
      if (action.action !== "CREATE") continue;
      if (action.entityType === "task" && action.title) {
        tasks.push({ title: action.title, status: action.status ?? "TODO" });
      }
      if (action.entityType === "note" && action.content) {
        notes.push({ content: action.content });
      }
      if (action.entityType === "event" && action.title && action.dateISO) {
        events.push({ title: action.title, dateISO: action.dateISO });
      }
    }

    const output = {
      tasks,
      notes,
      events,
    };

    const parsed = BrainDumpExtractionSchema.safeParse(output);
    if (!parsed.success) {
      return {
        success: false,
        error: "Suggested actions could not be converted to legacy format.",
        errorType: "validation",
      };
    }

    return { success: true, data: parsed.data };
  } catch (error: unknown) {
    console.error("Error during processBrainDump:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message, errorType: "validation" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error while processing brain dump.",
      errorType: "unknown",
    };
  }
}
