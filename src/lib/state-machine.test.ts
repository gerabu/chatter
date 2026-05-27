import { describe, it, expect } from "vitest";
import { canTransitionTask, getAllowedTaskStatuses, transitionTask } from "./state-machine";

describe("State Machine - Task Transitions", () => {
  describe("canTransitionTask", () => {
    it("allows valid forward transitions from TODO", () => {
      expect(canTransitionTask("TODO", "DONE")).toBe(true);
      expect(canTransitionTask("TODO", "MIGRATED")).toBe(true);
      expect(canTransitionTask("TODO", "CANCELLED")).toBe(true);
    });

    it("allows reverting from DONE backwards to TODO", () => {
      expect(canTransitionTask("DONE", "TODO")).toBe(true);
    });

    it("allows un-cancelling a CANCELLED task", () => {
      expect(canTransitionTask("CANCELLED", "TODO")).toBe(true);
    });

    it("blocks illegal transitions (e.g. CANCELLED -> DONE)", () => {
      expect(canTransitionTask("CANCELLED", "DONE")).toBe(false);
      expect(canTransitionTask("CANCELLED", "MIGRATED")).toBe(false);
    });

    it("treats MIGRATED as a terminal state", () => {
      expect(canTransitionTask("MIGRATED", "TODO")).toBe(false);
      expect(canTransitionTask("MIGRATED", "DONE")).toBe(false);
      expect(canTransitionTask("MIGRATED", "CANCELLED")).toBe(false);
    });

    it("allows no-op transitions (current === target)", () => {
      expect(canTransitionTask("TODO", "TODO")).toBe(true);
      expect(canTransitionTask("DONE", "DONE")).toBe(true);
    });
  });

  describe("getAllowedTaskStatuses", () => {
    it("returns current status and all valid targets for TODO", () => {
      expect(getAllowedTaskStatuses("TODO")).toEqual(["TODO", "DONE", "MIGRATED", "CANCELLED"]);
    });

    it("returns current status and TODO for DONE", () => {
      expect(getAllowedTaskStatuses("DONE")).toEqual(["DONE", "TODO"]);
    });

    it("returns only current status for terminal MIGRATED", () => {
      expect(getAllowedTaskStatuses("MIGRATED")).toEqual(["MIGRATED"]);
    });

    it("returns current status and TODO for CANCELLED", () => {
      expect(getAllowedTaskStatuses("CANCELLED")).toEqual(["CANCELLED", "TODO"]);
    });
  });

  describe("transitionTask", () => {
    it("returns the target state if transition is valid", () => {
      expect(transitionTask("TODO", "DONE")).toBe("DONE");
    });

    it("throws an error if transition is invalid", () => {
      expect(() => transitionTask("CANCELLED", "DONE")).toThrowError(
        "Invalid state transition from CANCELLED to DONE"
      );
    });
  });
});
