"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DeleteNoteInputSchema = z.object({
  noteId: z.uuid(),
});

export type DeleteNoteResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteNote(noteId: string): Promise<DeleteNoteResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Please sign in to delete notes." };
    }

    const parsed = DeleteNoteInputSchema.safeParse({ noteId });
    if (!parsed.success) {
      return { success: false, error: "Invalid note." };
    }

    const note = await prisma.note.findFirst({
      where: {
        id: parsed.data.noteId,
        user_id: userId,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!note) {
      return { success: false, error: "Note not found." };
    }

    await prisma.note.update({
      where: { id: note.id },
      data: { deleted_at: new Date() },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error during deleteNote:", error);
    return { success: false, error: "Could not delete note." };
  }
}
