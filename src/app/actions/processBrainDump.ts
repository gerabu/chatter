"use server";

import { EventSchema, NoteSchema, TaskSchema } from "@/contracts";
import { ollama } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";
import { generateText, Output } from "ai";
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
    const currentYear = new Date().getFullYear();
    const { output } = await generateText({
      model: ollama("qwen3.5:9b"),
      output: Output.object({ schema: BrainDumpExtractionSchema }),
      prompt: `Extract tasks, notes, and events from the following text.\n\nText:\n"${text}"\n\nIf you don't find any items for a category, return an empty array for it.`,
      system: "You are an intelligent assistant that processes a user's unstructured 'brain dump'. " +
        "Categorize the information strictly into lists of Tasks, Notes, and Events. " +
        "- Tasks must have a title and status (TODO, DONE, MIGRATED, CANCELLED). " +
        "- Notes must be objects with a 'content' field containing the text. " +
        "Example: {\"notes\": [{\"content\": \"some text\"}]} " +
        "- Events must have a title and have a dateISO in full ISO-8601 format (e.g., YYYY-MM-DDTHH:mm:ssZ). " +
        "If no time is provided, assume midnight: YYYY-MM-DDT00:00:00Z. " +
        `If no year is provided, assume current year: ${currentYear}. ` +
        "Output everything according to the provided JSON schema. Ensure empty arrays are returned if no corresponding items are identified. DO NOT wrap your response in markdown code blocks (e.g. ```json). Output raw JSON only.",
    });

    if (output.tasks && output.tasks.length > 0) {
      await prisma.task.createMany({
        data: output.tasks.map((t) => ({
          title: t.title,
          status: t.status,
        })),
      });
    }

    if (output.notes && output.notes.length > 0) {
      await prisma.note.createMany({
        data: output.notes.map((n) => ({
          content: n.content,
        })),
      });
    }

    if (output.events && output.events.length > 0) {
      await prisma.event.createMany({
        data: output.events.map((e) => ({
          title: e.title,
          dateISO: e.dateISO,
        })),
      });
    }

    return { success: true, data: output };
  } catch (error: any) {
    console.error("Error during processBrainDump:", error);

    // AI SDK errors or Zod validation errors
    if (error.name === "TypeValidationError" || error instanceof z.ZodError) {
      return {
        success: false,
        error: `LLM schema mismatch or hallucination: ${error.message}`,
        errorType: "validation",
      };
    }

    if (error.name === "JSONParseError" || error.name === "NoObjectGeneratedError") {
      return {
        success: false,
        error: `LLM failed to output valid JSON: ${error.message}`,
        errorType: "parsing",
      };
    }

    // Fallback for general errors (e.g. connection refused to Ollama)
    return {
      success: false,
      error: error.message || "An unexpected error occurred while communicating with the LLM.",
      errorType: "unknown",
    };
  }
}
