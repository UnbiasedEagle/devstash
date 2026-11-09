// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { ExportCard } from "@/components/profile/ExportCard";

describe("ExportCard", () => {
  afterEach(cleanup);

  it("gives a Pro user both download buttons", () => {
    render(<ExportCard isPro />);

    expect(screen.getByRole("button", { name: "Download JSON" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Download with files (ZIP)" }),
    ).toBeEnabled();
    expect(screen.queryByText("Export is a Pro feature.")).toBeNull();
  });

  it("tells a free user it is a Pro feature and points to the plan, with no download", () => {
    render(<ExportCard isPro={false} />);

    expect(screen.getByText("Export is a Pro feature.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute(
      "href",
      "#plan",
    );
    expect(screen.queryByRole("button", { name: /Download/ })).toBeNull();
  });
});
