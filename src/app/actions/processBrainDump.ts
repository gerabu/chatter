"use server";

import { auth } from "@/auth";
import { EventSchema, NoteSchema, TaskSchema } from "@/contracts";
import { openai } from "@/lib/ai-provider";
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred while communicating with the LLM.";
}

export async function processBrainDump(text: string): Promise<BrainDumpResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return {
        success: false,
        error: "Please sign in before processing your board items.",
        errorType: "validation",
      };
    }

    const normalizedText = text.trim();
    if (!normalizedText) {
      return {
        success: false,
        error: "Please enter a brain dump before submitting.",
        errorType: "validation",
      };
    }

    const currentYear = new Date().getFullYear();
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: BrainDumpExtractionSchema }),
      prompt: `Extract tasks, notes, and events from the following text.\n\nText:\n"${normalizedText}"\n\nIf you don't find any items for a category, return an empty array for it.`,
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
          user_id: userId,
        })),
      });
    }

    if (output.notes && output.notes.length > 0) {
      await prisma.note.createMany({
        data: output.notes.map((n) => ({
          content: n.content,
          user_id: userId,
        })),
      });
    }

    if (output.events && output.events.length > 0) {
      await prisma.event.createMany({
        data: output.events.map((e) => ({
          title: e.title,
          dateISO: e.dateISO,
          user_id: userId,
        })),
      });
    }

    return { success: true, data: output };
  } catch (error: unknown) {
    console.error("Error during processBrainDump:", error);

    // AI SDK errors or Zod validation errors
    if ((error instanceof Error && error.name === "TypeValidationError") || error instanceof z.ZodError) {
      return {
        success: false,
        error: `LLM schema mismatch or hallucination: ${getErrorMessage(error)}`,
        errorType: "validation",
      };
    }

    if (error instanceof Error && (error.name === "JSONParseError" || error.name === "NoObjectGeneratedError")) {
      return {
        success: false,
        error: `LLM failed to output valid JSON: ${getErrorMessage(error)}`,
        errorType: "parsing",
      };
    }

    // Fallback for general errors (e.g. connection refused to Ollama)
    return {
      success: false,
      error: getErrorMessage(error),
      errorType: "unknown",
    };
  }
}
