// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuickSearchResult } from "@/types/search";

const mocks = vi.hoisted(() => ({ quickSearch: vi.fn() }));
vi.mock("@/actions/search", () => ({ quickSearch: mocks.quickSearch }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

import SearchPanel from "@/components/search/SearchPanel";

function result(id: string, typeName = "Snippet"): QuickSearchResult {
  return {
    id,
    title: `Title ${id}`,
    snippet: null,
    tags: [],
    itemType: {
      id: `type-${typeName.replace(/\s/g, "-")}`,
      name: typeName,
      icon: "Code",
      color: "#3b82f6",
    },
  };
}

describe("SearchPanel", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mocks.quickSearch.mockReset();
  });
  afterEach(cleanup);

  it("labels a group of a custom type whose name contains a space", async () => {
    mocks.quickSearch.mockResolvedValue({
      success: true,
      data: [result("a", "My Type")],
    });
    render(<SearchPanel onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole("combobox"), "title");

    expect(
      await screen.findByRole("group", { name: "My Types" }),
    ).toBeInTheDocument();
  });

  it("ignores Enter while the next query is still loading, then opens the item", async () => {
    const onSelect = vi.fn();
    mocks.quickSearch.mockResolvedValue({
      success: true,
      data: [result("a")],
    });
    const user = userEvent.setup();
    render(<SearchPanel onSelect={onSelect} />);
    const input = screen.getByRole("combobox");

    await user.type(input, "ti");
    await screen.findByRole("option", { name: /Title a/ });
    await user.type(input, "t{Enter}");
    expect(onSelect).not.toHaveBeenCalled();

    await vi.waitFor(() =>
      expect(mocks.quickSearch).toHaveBeenLastCalledWith("tit"),
    );
    await screen.findByText("1 result");
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("/dashboard?item=a", true);
  });

  it("does not select on the Enter that confirms an IME composition", async () => {
    const onSelect = vi.fn();
    mocks.quickSearch.mockResolvedValue({
      success: true,
      data: [result("a")],
    });
    render(<SearchPanel onSelect={onSelect} />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "ti");
    await screen.findByText("1 result");
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
