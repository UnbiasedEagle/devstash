// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDownloadLink: vi.fn(),
  toastError: vi.fn(),
  assign: vi.fn(),
}));

vi.mock("@/actions/downloads", () => ({
  getDownloadLink: mocks.getDownloadLink,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import DownloadButton from "@/components/items/DownloadButton";

describe("DownloadButton", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("location", { assign: mocks.assign });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("asks for a link only when it is pressed", () => {
    render(<DownloadButton itemId="item-1" />);

    expect(mocks.getDownloadLink).not.toHaveBeenCalled();
  });

  it("asks for a fresh link for its item and sends the browser to it", async () => {
    mocks.getDownloadLink.mockResolvedValue({
      success: true,
      data: { url: "https://r2.test/download" },
    });
    render(<DownloadButton itemId="item-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() =>
      expect(mocks.assign).toHaveBeenCalledWith("https://r2.test/download"),
    );
    expect(mocks.getDownloadLink).toHaveBeenCalledWith("item-1");
  });

  it("asks again for a new link on every press, so an old link is never reused", async () => {
    mocks.getDownloadLink.mockResolvedValue({
      success: true,
      data: { url: "https://r2.test/download" },
    });
    render(<DownloadButton itemId="item-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => expect(mocks.assign).toHaveBeenCalledTimes(2));
    expect(mocks.getDownloadLink).toHaveBeenCalledTimes(2);
  });

  it("is disabled and says so while the link is being made", async () => {
    let finish: (value: unknown) => void = () => {};
    mocks.getDownloadLink.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<DownloadButton itemId="item-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(
      await screen.findByRole("button", { name: "Preparing..." }),
    ).toBeDisabled();
    finish({ success: true, data: { url: "https://r2.test/download" } });
    expect(
      await screen.findByRole("button", { name: "Download" }),
    ).toBeEnabled();
  });

  it("shows the reason and goes nowhere when a link can't be made", async () => {
    mocks.getDownloadLink.mockResolvedValue({
      success: false,
      error: "Too many downloads, try again in a minute",
    });
    render(<DownloadButton itemId="item-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Too many downloads, try again in a minute",
      ),
    );
    expect(mocks.assign).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  });

  it("shows a generic message when the request itself fails", async () => {
    mocks.getDownloadLink.mockRejectedValue(new Error("network"));
    render(<DownloadButton itemId="item-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Something went wrong. Try again.",
      ),
    );
    expect(mocks.assign).not.toHaveBeenCalled();
  });
});
