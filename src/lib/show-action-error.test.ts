// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import { showActionError } from "@/lib/show-action-error";

describe("showActionError", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows a plain error toast for an ordinary failure", () => {
    showActionError({ success: false, error: "Could not create the item" });

    expect(mocks.toastError).toHaveBeenCalledWith("Could not create the item");
  });

  it("adds a longer-lived Upgrade button to the free plan limit message", () => {
    showActionError({
      success: false,
      error: "Free plan limit",
      code: "free_limit",
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Free plan limit", {
      duration: 10_000,
      action: { label: "Upgrade", onClick: expect.any(Function) },
    });
  });

  it("opens the plan card in a new tab so the open form keeps its content", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    showActionError({
      success: false,
      error: "Free plan limit",
      code: "free_limit",
    });

    mocks.toastError.mock.calls[0][1].action.onClick();

    expect(open).toHaveBeenCalledWith("/profile#plan", "_blank", "noopener");
  });
});
