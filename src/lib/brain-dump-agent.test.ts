import { describe, expect, it } from "vitest";
import {
  groupActionsForPreview,
  normalizeAgentActions,
  parseAgentActions,
  validateAgentActions,
  type AgentAction,
} from "./brain-dump-agent";

const snapshot = {
  tasks: [
    { id: "11111111-1111-4111-8111-111111111111", title: "Buy milk", status: "TODO" as const, deleted_at: null },
  ],
  notes: [
    { id: "22222222-2222-4222-8222-222222222222", content: "Remember this", deleted_at: null },
  ],
  events: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      title: "Dinner",
      dateISO: "2026-06-01T00:00:00Z",
      deleted_at: null,
    },
  ],
};

describe("validateAgentActions", () => {
  it("rejects change status on non-task entities", () => {
    const actions = [
      {
        action: "CHANGE_STATUS",
        entityType: "event",
        id: "33333333-3333-4333-8333-333333333333",
        status: "DONE",
      },
    ] as unknown as AgentAction[];

    const result = validateAgentActions(actions, snapshot);
    expect(result.validActions).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
  });

  it("rejects invalid task status transitions", () => {
    const actions = [
      {
        action: "CHANGE_STATUS",
        entityType: "task",
        id: "11111111-1111-4111-8111-111111111111",
        status: "IN_PROGRESS",
      },
    ] as AgentAction[];

    const valid = validateAgentActions(actions, {
      ...snapshot,
      tasks: [{ ...snapshot.tasks[0], status: "CANCELLED" as const }],
    });
    expect(valid.validActions).toHaveLength(0);
    expect(valid.rejected[0]?.reason).toContain("Invalid task transition");
  });

  it("rejects foreign IDs", () => {
    const actions = [
      {
        action: "DELETE",
        entityType: "note",
        id: "44444444-4444-4444-8444-444444444444",
      },
    ] as AgentAction[];

    const result = validateAgentActions(actions, snapshot);
    expect(result.validActions).toHaveLength(0);
    expect(result.rejected[0]?.reason).toContain("not found");
  });
});

describe("normalizeAgentActions", () => {
  it("drops empty-string fields and canonicalizes status-only task UPDATE into CHANGE_STATUS (B1 payload)", () => {
    const raw = [
      {
        action: "UPDATE",
        entityType: "task",
        id: "11111111-1111-4111-8111-111111111111",
        title: "",
        content: "",
        dateISO: "",
        status: "DONE",
      },
    ];

    const [normalized] = normalizeAgentActions(raw);
    expect(normalized).toEqual({
      action: "CHANGE_STATUS",
      entityType: "task",
      id: "11111111-1111-4111-8111-111111111111",
      status: "DONE",
    });
  });

  it("keeps a task UPDATE that also changes the title", () => {
    const [normalized] = normalizeAgentActions([
      {
        action: "UPDATE",
        entityType: "task",
        id: "11111111-1111-4111-8111-111111111111",
        title: "Buy oat milk",
        status: "DONE",
      },
    ]);
    expect(normalized?.action).toBe("UPDATE");
  });

  it("coerces date-only and offset dateISO values to full UTC ISO-8601", () => {
    const [dateOnly, withOffset] = normalizeAgentActions([
      { action: "CREATE", entityType: "event", title: "Dinner", dateISO: "2026-06-15" },
      { action: "CREATE", entityType: "event", title: "Lunch", dateISO: "2026-06-15T19:00:00+02:00" },
    ]);
    expect(dateOnly?.dateISO).toBe("2026-06-15T00:00:00Z");
    expect(withOffset?.dateISO).toBe("2026-06-15T17:00:00.000Z");
  });
});

describe("parseAgentActions", () => {
  it("turns the B1 payload into a valid CHANGE_STATUS action without throwing", () => {
    // Exact shape from the bug report: empty strings for unused fields and an
    // echoed unchanged title alongside a status change.
    const parseResult = parseAgentActions([
      {
        action: "UPDATE",
        entityType: "task",
        id: "11111111-1111-4111-8111-111111111111",
        title: "Buy milk",
        content: "",
        dateISO: "",
        status: "DONE",
      },
    ]);

    expect(parseResult.rejected).toHaveLength(0);
    expect(parseResult.parsed).toHaveLength(1);

    const validateResult = validateAgentActions(parseResult.parsed, snapshot);
    expect(validateResult.rejected).toHaveLength(0);
    expect(validateResult.validActions).toEqual([
      {
        action: "CHANGE_STATUS",
        entityType: "task",
        id: "11111111-1111-4111-8111-111111111111",
        status: "DONE",
      },
    ]);
  });

  it("rejects unusable items individually and keeps the rest of the plan", () => {
    const result = parseAgentActions([
      { action: "CREATE", entityType: "note", content: "" },
      { action: "FROBNICATE", entityType: "task" },
      { action: "UPDATE", entityType: "note", id: "not-a-uuid", content: "hi" },
      { action: "CREATE", entityType: "task", title: "  Plan trip  " },
    ]);

    expect(result.parsed).toEqual([{ action: "CREATE", entityType: "task", title: "Plan trip" }]);
    expect(result.rejected).toHaveLength(3);
    for (const item of result.rejected) {
      expect(item.reason).toMatch(/Skipped/);
    }
  });
});

describe("groupActionsForPreview", () => {
  it("groups actions by action type", () => {
    const actions = [
      { action: "DELETE", entityType: "note", id: "22222222-2222-4222-8222-222222222222" },
      { action: "CREATE", entityType: "task", title: "Plan trip", status: "TODO" },
      { action: "CHANGE_STATUS", entityType: "task", id: "11111111-1111-4111-8111-111111111111", status: "DONE" },
      { action: "UPDATE", entityType: "event", id: "33333333-3333-4333-8333-333333333333", title: "Team Dinner" },
    ] as AgentAction[];

    const grouped = groupActionsForPreview(actions);
    expect(grouped.create).toHaveLength(1);
    expect(grouped.update).toHaveLength(1);
    expect(grouped.changeStatus).toHaveLength(1);
    expect(grouped.delete).toHaveLength(1);
  });
});
