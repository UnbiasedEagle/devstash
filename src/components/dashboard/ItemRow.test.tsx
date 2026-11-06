// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ItemRow from "@/components/dashboard/ItemRow";
import type { DashboardItem } from "@/types/dashboard";

vi.mock("@/actions/items", () => ({
  setItemFavorite: vi.fn(),
  setItemPinned: vi.fn(),
}));

afterEach(cleanup);

const item: DashboardItem = {
  id: "item-1",
  title: "Debounce hook",
  description: null,
  isPinned: false,
  isFavorite: false,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  itemType: { id: "type-1", name: "Snippet", icon: "Code", color: "#3b82f6" },
  tags: ["react", "hooks"],
};

describe("ItemRow", () => {
  it("shows tags as plain chips because the whole row opens the drawer", () => {
    render(
      <ul>
        <ItemRow item={item} linkId="item-pinned-item-1" />
      </ul>,
    );

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Tag:/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
