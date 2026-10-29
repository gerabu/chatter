// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AgentAction } from "@/lib/brain-dump-agent";

const mocks = vi.hoisted(() => ({
  applyBrainDumpActions: vi.fn(),
  refresh: vi.fn(),
  suggestBrainDumpActions: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/app/actions/applyBrainDumpActions", () => ({
  applyBrainDumpActions: mocks.applyBrainDumpActions,
}));
vi.mock("@/app/actions/suggestBrainDumpActions", () => ({
  suggestBrainDumpActions: mocks.suggestBrainDumpActions,
}));

import { BrainDumpChat } from "./BrainDumpChat";

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

describe("BrainDumpChat", () => {
  it("lets the user review a suggestion and accept it", async () => {
    const suggestions: AgentAction[] = [
      { action: "CREATE", entityType: "task", title: "Book dentist", status: "TODO" },
      {
        action: "UPDATE",
        entityType: "note",
        id: "22222222-2222-4222-8222-222222222222",
        content: "Call clinic",
        label: "Old note",
      } as AgentAction,
    ];
    mocks.suggestBrainDumpActions.mockResolvedValue({
      success: true,
      actions: suggestions,
      rejected: [],
    });
    mocks.applyBrainDumpActions.mockResolvedValue({
      success: true,
      appliedCounts: { create: 1, update: 1, changeStatus: 0, delete: 0 },
    });

    render(<BrainDumpChat />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  Book a dentist appointment  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate suggestions" }));

    expect(mocks.suggestBrainDumpActions).toHaveBeenCalledWith("Book a dentist appointment");
    expect(await screen.findByText("Suggested actions")).toBeTruthy();
    expect(screen.getByText("Book dentist")).toBeTruthy();
    expect(screen.getByText("Old note")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept changes" })).toBeTruthy();
    expect(screen.queryByText("Changes applied")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept changes" }));

    await waitFor(() => {
      expect(mocks.applyBrainDumpActions).toHaveBeenCalledWith([
        { action: "CREATE", entityType: "task", title: "Book dentist", status: "TODO" },
        {
          action: "UPDATE",
          entityType: "note",
          id: "22222222-2222-4222-8222-222222222222",
          content: "Call clinic",
        },
      ]);
      expect(screen.getByText("Changes applied")).toBeTruthy();
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });
  });

  it("shows an application error and leaves the reviewed suggestion retryable", async () => {
    mocks.suggestBrainDumpActions.mockResolvedValue({
      success: true,
      actions: [{ action: "CREATE", entityType: "note", content: "Call the clinic" }],
      rejected: [],
    });
    mocks.applyBrainDumpActions
      .mockResolvedValueOnce({ success: false, error: "Could not apply suggested actions." })
      .mockResolvedValueOnce({
        success: true,
        appliedCounts: { create: 1, update: 0, changeStatus: 0, delete: 0 },
      });

    render(<BrainDumpChat />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Remember to call the clinic" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate suggestions" }));

    const acceptButton = await screen.findByRole("button", { name: "Accept changes" });
    fireEvent.click(acceptButton);

    expect(await screen.findByText("Could not apply suggested actions.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept changes" }));

    expect(await screen.findByText("Changes applied")).toBeTruthy();
    expect(mocks.applyBrainDumpActions).toHaveBeenCalledTimes(2);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
