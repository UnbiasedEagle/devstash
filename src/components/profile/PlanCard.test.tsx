// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/actions/billing", () => ({
  createCheckoutSession: mocks.createCheckoutSession,
  createPortalSession: mocks.createPortalSession,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import { PlanCard } from "@/components/profile/PlanCard";

afterEach(cleanup);

describe("PlanCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("offers both upgrade plans to a free user and no billing portal", () => {
    render(<PlanCard isPro={false} />);

    expect(
      screen.getByRole("button", { name: "Upgrade, $8 per month" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade, $72 per year" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage billing" }),
    ).not.toBeInTheDocument();
  });

  it("offers only Manage billing to a Pro user", () => {
    render(<PlanCard isPro />);

    expect(
      screen.getByRole("button", { name: "Manage billing" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upgrade/ })).toBeNull();
  });

  it("starts checkout for the plan that was clicked", async () => {
    mocks.createCheckoutSession.mockResolvedValue({
      success: false,
      error: "Could not start checkout. Try again.",
    });
    render(<PlanCard isPro={false} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Upgrade, $72 per year" }),
    );

    expect(mocks.createCheckoutSession).toHaveBeenCalledWith("yearly");
  });

  it("shows the error and re-enables the buttons when checkout can't start", async () => {
    mocks.createCheckoutSession.mockResolvedValue({
      success: false,
      error: "Could not start checkout. Try again.",
    });
    render(<PlanCard isPro={false} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Upgrade, $8 per month" }),
    );

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Could not start checkout. Try again.",
    );
    expect(
      screen.getByRole("button", { name: "Upgrade, $8 per month" }),
    ).toBeEnabled();
  });

  it("shows the error when the billing portal can't open", async () => {
    mocks.createPortalSession.mockResolvedValue({
      success: false,
      error: "Could not open billing. Try again.",
    });
    render(<PlanCard isPro />);

    await userEvent.click(
      screen.getByRole("button", { name: "Manage billing" }),
    );

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Could not open billing. Try again.",
    );
    expect(
      screen.getByRole("button", { name: "Manage billing" }),
    ).toBeEnabled();
  });
});
