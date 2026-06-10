import { EventSchema, NoteSchema, TaskSchema, TaskStatusSchema, type TaskStatus } from "../contracts";
import { canTransitionTask } from "./state-machine";
import { z } from "zod";

const EntityTypeSchema = z.enum(["task", "note", "event"]);

const UuidSchema = z.uuid();

const CreateActionSchema = z.object({
  action: z.literal("CREATE"),
  entityType: EntityTypeSchema,
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  dateISO: z.iso.datetime().optional(),
  status: TaskStatusSchema.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.entityType === "task") {
    if (!value.title) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CREATE task requires title." });
    }
    if (value.content || value.dateISO) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CREATE task only accepts title/status." });
    }
  }
  if (value.entityType === "note") {
    if (!value.content) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CREATE note requires content." });
    }
    if (value.title || value.dateISO || value.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CREATE note only accepts content." });
    }
  }
  if (value.entityType === "event") {
    if (!value.title || !value.dateISO) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CREATE event requires title/dateISO." });
    }
    if (value.content || value.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CREATE event only accepts title/dateISO." });
    }
  }
});

const UpdateActionSchema = z.object({
  action: z.literal("UPDATE"),
  entityType: EntityTypeSchema,
  id: UuidSchema,
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  dateISO: z.iso.datetime().optional(),
  status: TaskStatusSchema.optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.title && !value.content && !value.dateISO && !value.status) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UPDATE requires at least one mutable field." });
  }
  if (value.entityType === "task") {
    if (value.content || value.dateISO) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UPDATE task only accepts title/status." });
    }
  }
  if (value.entityType === "note") {
    if (value.title || value.dateISO || value.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UPDATE note only accepts content." });
    }
  }
  if (value.entityType === "event") {
    if (value.content || value.status) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UPDATE event only accepts title/dateISO." });
    }
  }
});

const DeleteActionSchema = z.object({
  action: z.literal("DELETE"),
  entityType: EntityTypeSchema,
  id: UuidSchema,
}).strict();

const ChangeStatusActionSchema = z.object({
  action: z.literal("CHANGE_STATUS"),
  entityType: z.literal("task"),
  id: UuidSchema,
  status: TaskStatusSchema,
}).strict();

export const AgentActionSchema = z.union([
  CreateActionSchema,
  UpdateActionSchema,
  DeleteActionSchema,
  ChangeStatusActionSchema,
]);

export const AgentPlanSchema = z.object({
  actions: z.array(AgentActionSchema),
}).strict();

export type AgentAction = z.infer<typeof AgentActionSchema>;
export type AgentPlan = z.infer<typeof AgentPlanSchema>;

// Lenient shape for the LLM boundary (Output.object). Models often emit empty
// strings for fields they are not setting; the strict AgentActionSchema is
// applied per item after normalization so one bad item never kills the plan.
const RawAgentActionSchema = z.looseObject({
  action: z.string().optional(),
  entityType: z.string().optional(),
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  dateISO: z.string().optional(),
  status: z.string().optional(),
});

export const AgentPlanLLMSchema = z.looseObject({
  actions: z.array(RawAgentActionSchema).default([]),
});

export type RawAgentAction = z.infer<typeof RawAgentActionSchema>;

const ACTION_SCHEMAS_BY_TYPE: Record<string, z.ZodType<AgentAction>> = {
  CREATE: CreateActionSchema,
  UPDATE: UpdateActionSchema,
  DELETE: DeleteActionSchema,
  CHANGE_STATUS: ChangeStatusActionSchema,
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateISO(value: string): string {
  if (DATE_ONLY_PATTERN.test(value)) {
    return `${value}T00:00:00Z`;
  }
  if (z.iso.datetime().safeParse(value).success) {
    return value;
  }
  const ms = Date.parse(value);
  if (!Number.isNaN(ms)) {
    return new Date(ms).toISOString();
  }
  return value;
}

export function normalizeAgentActions(rawActions: RawAgentAction[]): Record<string, unknown>[] {
  return rawActions.map((raw) => {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value === null || value === undefined) continue;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) continue;
        next[key] = trimmed;
        continue;
      }
      next[key] = value;
    }

    if (typeof next.dateISO === "string") {
      next.dateISO = normalizeDateISO(next.dateISO);
    }

    // Canonical form: a task UPDATE whose only effective change is status is a
    // CHANGE_STATUS, keeping the state-machine path uniform.
    if (
      next.action === "UPDATE" &&
      next.entityType === "task" &&
      typeof next.status === "string" &&
      next.title === undefined &&
      next.content === undefined &&
      next.dateISO === undefined
    ) {
      return { action: "CHANGE_STATUS", entityType: "task", id: next.id, status: next.status };
    }

    return next;
  });
}

function describeParseFailure(candidate: Record<string, unknown>, error: z.ZodError): string {
  const subject = [candidate.action, candidate.entityType]
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase() || "suggestion";
  const issue = error.issues[0];
  if (!issue) return `Skipped ${subject}: invalid shape.`;
  const field = issue.path.length > 0 ? issue.path.join(".") : "action";
  return `Skipped ${subject}: ${field} — ${issue.message}`;
}

export function parseAgentActions(rawActions: RawAgentAction[]): {
  parsed: AgentAction[];
  rejected: RejectedAction[];
} {
  const parsed: AgentAction[] = [];
  const rejected: RejectedAction[] = [];

  for (const candidate of normalizeAgentActions(rawActions)) {
    const actionType = typeof candidate.action === "string" ? candidate.action : "";
    const schema = ACTION_SCHEMAS_BY_TYPE[actionType];
    if (!schema) {
      rejected.push({ action: candidate, reason: `Skipped suggestion: unknown action "${actionType || "(missing)"}".` });
      continue;
    }
    const result = schema.safeParse(candidate);
    if (result.success) {
      parsed.push(result.data);
      continue;
    }
    rejected.push({ action: candidate, reason: describeParseFailure(candidate, result.error) });
  }

  return { parsed, rejected };
}

type SnapshotTask = Pick<z.infer<typeof TaskSchema>, "id" | "title" | "status">;
type SnapshotNote = Pick<z.infer<typeof NoteSchema>, "id" | "content">;
type SnapshotEvent = Pick<z.infer<typeof EventSchema>, "id" | "title" | "dateISO">;

type UserSnapshotInput = {
  tasks: Array<SnapshotTask & { deleted_at?: Date | null }>;
  notes: Array<SnapshotNote & { deleted_at?: Date | null }>;
  events: Array<SnapshotEvent & { deleted_at?: Date | null }>;
};

export type RejectedAction = {
  action: AgentAction | Record<string, unknown>;
  reason: string;
};

export type ValidateAgentActionsResult = {
  validActions: AgentAction[];
  rejected: RejectedAction[];
};

export function buildUserContextSnapshot({ tasks, notes, events }: UserSnapshotInput) {
  return {
    tasks: tasks.filter((task) => !task.deleted_at).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
    })),
    notes: notes.filter((note) => !note.deleted_at).map((note) => ({
      id: note.id,
      content: note.content,
    })),
    events: events.filter((event) => !event.deleted_at).map((event) => ({
      id: event.id,
      title: event.title,
      dateISO: event.dateISO,
    })),
  };
}

function actionEntityKey(action: AgentAction): string | null {
  if ("id" in action) {
    return `${action.action}:${action.entityType}:${action.id}`;
  }
  return null;
}

export function validateAgentActions(actions: AgentAction[], input: UserSnapshotInput): ValidateAgentActionsResult {
  const snapshot = buildUserContextSnapshot(input);
  const tasksById = new Map(snapshot.tasks.map((task) => [task.id, task]));
  const notesById = new Map(snapshot.notes.map((note) => [note.id, note]));
  const eventsById = new Map(snapshot.events.map((event) => [event.id, event]));
  const seenEntityOps = new Set<string>();

  const validActions: AgentAction[] = [];
  const rejected: RejectedAction[] = [];

  for (const action of actions) {
    const opKey = actionEntityKey(action);
    if (opKey && seenEntityOps.has(opKey)) {
      rejected.push({ action, reason: "Duplicate action for the same entity and operation." });
      continue;
    }
    if (opKey) {
      seenEntityOps.add(opKey);
    }

    if (action.action === "CREATE") {
      if (action.entityType === "task") {
        validActions.push({
          ...action,
          status: action.status ?? "TODO",
        });
        continue;
      }
      validActions.push(action);
      continue;
    }

    if (action.action === "CHANGE_STATUS") {
      const task = tasksById.get(action.id);
      if (!task) {
        rejected.push({ action, reason: "Task not found or already deleted." });
        continue;
      }
      if (!canTransitionTask(task.status as TaskStatus, action.status)) {
        rejected.push({ action, reason: `Invalid task transition from ${task.status} to ${action.status}.` });
        continue;
      }
      validActions.push(action);
      continue;
    }

    if (action.entityType === "task") {
      const task = tasksById.get(action.id);
      if (!task) {
        rejected.push({ action, reason: "Task not found or already deleted." });
        continue;
      }
      if (action.action === "UPDATE" && action.status && !canTransitionTask(task.status as TaskStatus, action.status)) {
        rejected.push({ action, reason: `Invalid task transition from ${task.status} to ${action.status}.` });
        continue;
      }
      // Models often echo the unchanged title alongside a status change; when
      // status is the only real change, canonicalize to CHANGE_STATUS.
      if (action.action === "UPDATE" && action.status && (!action.title || action.title === task.title)) {
        validActions.push({ action: "CHANGE_STATUS", entityType: "task", id: action.id, status: action.status });
        continue;
      }
      validActions.push(action);
      continue;
    }

    if (action.entityType === "note") {
      const note = notesById.get(action.id);
      if (!note) {
        rejected.push({ action, reason: "Note not found or already deleted." });
        continue;
      }
      validActions.push(action);
      continue;
    }

    const event = eventsById.get(action.id);
    if (!event) {
      rejected.push({ action, reason: "Event not found or already deleted." });
      continue;
    }
    validActions.push(action);
  }

  return { validActions, rejected };
}

export function groupActionsForPreview(actions: AgentAction[]) {
  const groups = {
    create: [] as AgentAction[],
    update: [] as AgentAction[],
    changeStatus: [] as AgentAction[],
    delete: [] as AgentAction[],
  };

  for (const action of actions) {
    if (action.action === "CREATE") groups.create.push(action);
    if (action.action === "UPDATE") groups.update.push(action);
    if (action.action === "CHANGE_STATUS") groups.changeStatus.push(action);
    if (action.action === "DELETE") groups.delete.push(action);
  }

  const entityOrder: Record<"task" | "note" | "event", number> = {
    task: 0,
    note: 1,
    event: 2,
  };

  const sortByEntity = (a: AgentAction, b: AgentAction) => {
    const entityDiff = entityOrder[a.entityType] - entityOrder[b.entityType];
    if (entityDiff !== 0) return entityDiff;
    const labelA = getActionLabel(a).toLowerCase();
    const labelB = getActionLabel(b).toLowerCase();
    return labelA.localeCompare(labelB);
  };

  groups.create.sort(sortByEntity);
  groups.update.sort(sortByEntity);
  groups.changeStatus.sort(sortByEntity);
  groups.delete.sort(sortByEntity);

  return groups;
}

export function getActionLabel(action: AgentAction): string {
  const label = (action as { label?: string }).label;
  if (label) return label;
  if (action.action === "CREATE") {
    if (action.entityType === "task") return action.title ?? "Untitled task";
    if (action.entityType === "note") return action.content ?? "Untitled note";
    return action.title ?? "Untitled event";
  }
  if (action.action === "UPDATE") {
    if (action.entityType === "task") return action.title ?? action.id;
    if (action.entityType === "note") return action.content ?? action.id;
    return action.title ?? action.id;
  }
  if (action.action === "CHANGE_STATUS") {
    return `${action.id} -> ${action.status}`;
  }
  return action.id;
}
