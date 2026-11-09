// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
  click: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import { ExportButtons } from "@/components/profile/ExportButtons";

function jsonResponse(body: unknown, status: number, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe("ExportButtons", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createObjectURL.mockReturnValue("blob:export");
    vi.stubGlobal("URL", {
      createObjectURL: mocks.createObjectURL,
      revokeObjectURL: mocks.revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      mocks.click(this.download, this.href);
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("saves the export under the name the server gave it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ version: 1 }, 200, {
          "Content-Disposition":
            'attachment; filename="devstash-export-2026-11-09.json"',
        }),
      ),
    );
    render(<ExportButtons />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download JSON" }),
    );

    await waitFor(() => expect(mocks.click).toHaveBeenCalled());
    expect(mocks.click).toHaveBeenCalledWith(
      "devstash-export-2026-11-09.json",
      "blob:export",
    );
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it.each([
    ["json", "Download JSON"],
    ["zip", "Download with files (ZIP)"],
  ] as const)(
    "asks the route for the %s format under its own label",
    async (format, label) => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 200));
      vi.stubGlobal("fetch", fetchMock);
      render(<ExportButtons />);

      await userEvent.click(screen.getByRole("button", { name: label }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(`/api/export?format=${format}`),
      );
    },
  );

  it.each([
    [429, "Too many exports, try again in a minute"],
    [403, "Export is a Pro feature"],
  ])(
    "shows the reason for a %s in a toast and saves nothing",
    async (status, message) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse({ error: message }, status)),
      );
      render(<ExportButtons />);

      await userEvent.click(
        screen.getByRole("button", { name: "Download JSON" }),
      );

      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith(message),
      );
      expect(mocks.click).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Download JSON" }),
      ).toBeEnabled();
    },
  );

  it("shows a generic message when the answer isn't the expected JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>", { status: 502 })),
    );
    render(<ExportButtons />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download JSON" }),
    );

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Something went wrong. Try again.",
      ),
    );
    expect(mocks.click).not.toHaveBeenCalled();
  });

  it("shows a generic message when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<ExportButtons />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download JSON" }),
    );

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Something went wrong. Try again.",
      ),
    );
  });

  it("disables both buttons while one export is being prepared, so the two can't run at once", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<ExportButtons />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download with files (ZIP)" }),
    );

    expect(
      await screen.findByRole("button", { name: "Preparing..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Download JSON" }),
    ).toBeDisabled();
  });

  it("is disabled while the export is being prepared, so a double click asks once", async () => {
    let finish: (value: Response) => void = () => {};
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<ExportButtons />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download JSON" }),
    );

    expect(
      await screen.findByRole("button", { name: "Preparing..." }),
    ).toBeDisabled();
    finish(jsonResponse({}, 200));
    expect(
      await screen.findByRole("button", { name: "Download JSON" }),
    ).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
