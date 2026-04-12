import { z } from 'zod';

export const TaskStatusSchema = z.enum(["TODO", "DONE", "MIGRATED", "CANCELLED"]);

export const TaskSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, "Title is required"),
  status: TaskStatusSchema,
  createdAt: z.date(),
});

export const NoteSchema = z.object({
  id: z.uuid(),
  content: z.string().min(1, "Content cannot be empty"),
  createdAt: z.date(),
});

export const EventSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, "Title is required"),
  dateISO: z.iso.datetime(),
  createdAt: z.date(),
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Event = z.infer<typeof EventSchema>;
