import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentAction } from "@/lib/brain-dump-agent";

const mocks = vi.hoisted(() => {
  const tx = {
    task: { createMany: vi.fn(), updateMany: vi.fn() },
    note: { createMany: vi.fn(), updateMany: vi.fn() },
    event: { createMany: vi.fn(), updateMany: vi.fn() },
  };
  type TransactionMocks = typeof tx;

  return {
    auth: vi.fn(),
    generateText: vi.fn(),
    openai: vi.fn(() => "test-model"),
    outputObject: vi.fn(() => "test-output-schema"),
    revalidatePath: vi.fn(),
    tx,
    prisma: {
      task: { findMany: vi.fn() },
      note: { findMany: vi.fn() },
      event: { findMany: vi.fn() },
      $transaction: vi.fn(async (callback: (transaction: TransactionMocks) => Promise<void>) => callback(tx)),
    },
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/ai-provider", () => ({ openai: mocks.openai }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("ai", () => ({
  generateText: mocks.generateText,
  Output: { object: mocks.outputObject },
}));

import { applyBrainDumpActions } from "./applyBrainDumpActions";
import { suggestBrainDumpActions } from "./suggestBrainDumpActions";

const userId = "user-1";
const taskId = "11111111-1111-4111-8111-111111111111";
const existingTasks = [{ id: taskId, title: "Buy milk", status: "TODO" as const, deleted_at: null }];

function setEmptySnapshot() {
  mocks.prisma.task.findMany.mockResolvedValue([]);
  mocks.prisma.note.findMany.mockResolvedValue([]);
  mocks.prisma.event.findMany.mockResolvedValue([]);
}

describe("brain dump server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: userId } });
    setEmptySnapshot();
    mocks.prisma.$transaction.mockImplementation(async (callback) => callback(mocks.tx));
  });

  it("suggests actions, then applies the reviewed plan and reports its effects", async () => {
    mocks.prisma.task.findMany.mockResolvedValue(existingTasks);
    mocks.generateText.mockResolvedValue({
      output: {
        actions: [
          { action: "CREATE", entityType: "task", title: "Book dentist" },
          { action: "CHANGE_STATUS", entityType: "task", id: taskId, status: "DONE" },
        ],
      },
    });

    const suggestion = await suggestBrainDumpActions("  Book an appointment and finish milk  ");

    expect(suggestion).toEqual({
      success: true,
      actions: [
        { action: "CREATE", entityType: "task", title: "Book dentist", status: "TODO" },
        { action: "CHANGE_STATUS", entityType: "task", id: taskId, status: "DONE", label: "Buy milk" },
      ],
      rejected: [],
    });

    // Mirror the UI's approval boundary: the displayed plan is reviewed, then
    // presentation-only labels are stripped before the user-approved payload
    // is submitted to the application action.
    const reviewedPlan: AgentAction[] = suggestion.success
      ? suggestion.actions.map((action) => {
          const payload = { ...action } as AgentAction & { label?: string };
          delete payload.label;
          return payload as AgentAction;
        })
      : [];
    const application = await applyBrainDumpActions(reviewedPlan);

    expect(application).toEqual({
      success: true,
      appliedCounts: { create: 1, update: 0, changeStatus: 1, delete: 0 },
    });
    expect(mocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.task.createMany).toHaveBeenCalledWith({
      data: [{ title: "Book dentist", status: "TODO", user_id: userId }],
    });
    expect(mocks.tx.task.updateMany).toHaveBeenCalledWith({
      where: { id: taskId, user_id: userId, deleted_at: null },
      data: { status: "DONE" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/tasks");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/app/events");
  });

  it("rejects suggestions for signed-out users without reading user data", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(suggestBrainDumpActions("make a task")).resolves.toMatchObject({
      success: false,
      errorType: "validation",
    });
    expect(mocks.prisma.task.findMany).not.toHaveBeenCalled();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it("rejects an empty brain dump before reading data or calling the model", async () => {
    await expect(suggestBrainDumpActions("  \n ")).resolves.toMatchObject({
      success: false,
      errorType: "validation",
    });
    expect(mocks.prisma.task.findMany).not.toHaveBeenCalled();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it("rejects application for signed-out users without opening a transaction", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(applyBrainDumpActions([])).resolves.toMatchObject({
      success: false,
      error: "Please sign in before applying actions.",
    });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects malformed action payloads before reading data or opening a transaction", async () => {
    const malformed = [{ action: "NOT_AN_ACTION" }] as unknown as AgentAction[];

    await expect(applyBrainDumpActions(malformed)).resolves.toEqual({
      success: false,
      error: "Invalid action payload.",
    });
    expect(mocks.prisma.task.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not apply a plan that no longer validates against the current snapshot", async () => {
    mocks.prisma.task.findMany.mockResolvedValue([
      { ...existingTasks[0], status: "CANCELLED" as const },
    ]);
    const reviewedPlan: AgentAction[] = [
      { action: "CHANGE_STATUS", entityType: "task", id: taskId, status: "IN_PROGRESS" },
    ];
    // The current transition table rejects CANCELLED -> IN_PROGRESS.

    await expect(applyBrainDumpActions(reviewedPlan)).resolves.toEqual({
      success: false,
      error: "Plan contains invalid actions. Please regenerate suggestions.",
    });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
