import { TaskStatus } from "../contracts";

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["DONE", "MIGRATED", "CANCELLED"],
  DONE: ["TODO"],
  MIGRATED: [], // Migrated is a terminal state
  CANCELLED: ["TODO"], // You must un-cancel first before finishing
};

export function canTransitionTask(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): boolean {
  // No-op is inherently "valid" (changing nothing)
  if (currentStatus === targetStatus) return true;

  const validNextStates = ALLOWED_TRANSITIONS[currentStatus];
  return validNextStates.includes(targetStatus);
}

export function transitionTask(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): TaskStatus {
  if (!canTransitionTask(currentStatus, targetStatus)) {
    throw new Error(`Invalid state transition from ${currentStatus} to ${targetStatus}`);
  }
  return targetStatus;
}

/** Status values shown in a status dropdown for the given current status. */
export function getAllowedTaskStatuses(currentStatus: TaskStatus): TaskStatus[] {
  const targets = ALLOWED_TRANSITIONS[currentStatus];
  const options = [currentStatus, ...targets.filter((s) => s !== currentStatus)];
  return options;
}
