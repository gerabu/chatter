import { describe, it, expect } from "vitest";
import { canTransitionTask, getAllowedTaskStatuses, transitionTask } from "./state-machine";

describe("State Machine - Task Transitions", () => {
  describe("canTransitionTask", () => {
    it("allows valid forward transitions from TODO", () => {
      expect(canTransitionTask("TODO", "IN_PROGRESS")).toBe(true);
      expect(canTransitionTask("TODO", "DONE")).toBe(true);
      expect(canTransitionTask("TODO", "CANCELLED")).toBe(true);
    });

    it("allows TODO and IN_PROGRESS to toggle", () => {
      expect(canTransitionTask("IN_PROGRESS", "TODO")).toBe(true);
    });

    it("allows reverting from DONE backwards to TODO", () => {
      expect(canTransitionTask("DONE", "TODO")).toBe(true);
    });

    it("allows un-cancelling a CANCELLED task", () => {
      expect(canTransitionTask("CANCELLED", "TODO")).toBe(true);
    });

    it("blocks illegal transitions (e.g. CANCELLED -> DONE)", () => {
      expect(canTransitionTask("CANCELLED", "DONE")).toBe(false);
      expect(canTransitionTask("CANCELLED", "IN_PROGRESS")).toBe(false);
    });

    it("blocks IN_PROGRESS from finishing or cancelling directly", () => {
      expect(canTransitionTask("IN_PROGRESS", "DONE")).toBe(false);
      expect(canTransitionTask("IN_PROGRESS", "CANCELLED")).toBe(false);
    });

    it("allows no-op transitions (current === target)", () => {
      expect(canTransitionTask("TODO", "TODO")).toBe(true);
      expect(canTransitionTask("IN_PROGRESS", "IN_PROGRESS")).toBe(true);
      expect(canTransitionTask("DONE", "DONE")).toBe(true);
    });
  });

  describe("getAllowedTaskStatuses", () => {
    it("returns current status and all valid targets for TODO", () => {
      expect(getAllowedTaskStatuses("TODO")).toEqual(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
    });

    it("returns current status and TODO for IN_PROGRESS", () => {
      expect(getAllowedTaskStatuses("IN_PROGRESS")).toEqual(["IN_PROGRESS", "TODO"]);
    });

    it("returns current status and TODO for DONE", () => {
      expect(getAllowedTaskStatuses("DONE")).toEqual(["DONE", "TODO"]);
    });

    it("returns current status and TODO for CANCELLED", () => {
      expect(getAllowedTaskStatuses("CANCELLED")).toEqual(["CANCELLED", "TODO"]);
    });
  });

  describe("transitionTask", () => {
    it("returns the target state if transition is valid", () => {
      expect(transitionTask("TODO", "IN_PROGRESS")).toBe("IN_PROGRESS");
    });

    it("throws an error if transition is invalid", () => {
      expect(() => transitionTask("IN_PROGRESS", "DONE")).toThrowError(
        "Invalid state transition from IN_PROGRESS to DONE"
      );
    });
  });
});
