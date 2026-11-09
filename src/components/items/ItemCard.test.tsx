// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getImagePreviewUrl: vi.fn() }));

vi.mock("@/actions/items", () => ({
  setItemFavorite: vi.fn(),
  setItemPinned: vi.fn(),
}));
vi.mock("@/lib/file-previews", () => ({
  getImagePreviewUrl: mocks.getImagePreviewUrl,
}));

import ItemCard from "@/components/items/ItemCard";
import type { ListItem } from "@/types/items";

const baseItem: ListItem = {
  id: "item-1",
  title: "Screenshot",
  description: null,
  isPinned: false,
  isFavorite: false,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  itemType: {
    id: "type-image",
    name: "Image",
    icon: "Image",
    color: "#ec4899",
  },
  tags: [],
  contentType: "FILE",
  url: null,
  fileKey: "files/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
  fileName: "shot.png",
  fileSize: 2048,
  fileMimeType: "image/png",
  contentPreview: null,
};

async function renderCard(item: ListItem) {
  render(
    await ItemCard({
      item,
      now: new Date("2026-01-02T00:00:00Z").getTime(),
      href: "/items/image?item=item-1",
    }),
  );
}

describe("ItemCard files and images", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getImagePreviewUrl.mockResolvedValue(null);
  });

  afterEach(cleanup);

  it("shows a thumbnail for an image item, with the title as its alt text and loading lazily", async () => {
    mocks.getImagePreviewUrl.mockResolvedValue("https://r2.test/preview");

    await renderCard(baseItem);

    const image = screen.getByRole("img", { name: "Screenshot" });
    expect(image).toHaveAttribute("src", "https://r2.test/preview");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("asks for the preview link of the item it is showing", async () => {
    mocks.getImagePreviewUrl.mockResolvedValue("https://r2.test/preview");

    await renderCard(baseItem);

    expect(mocks.getImagePreviewUrl).toHaveBeenCalledWith(baseItem);
  });

  it("falls back to the file name and size for an image that has no link", async () => {
    await renderCard(baseItem);

    expect(screen.queryByRole("img", { name: "Screenshot" })).toBeNull();
    expect(screen.getByText("shot.png")).toBeVisible();
    expect(screen.getByText("2.0 KB")).toBeVisible();
  });

  it("shows a file item's name and size and no thumbnail", async () => {
    await renderCard({
      ...baseItem,
      title: "Report",
      itemType: {
        id: "type-file",
        name: "File",
        icon: "File",
        color: "#64748b",
      },
      fileName: "report.pdf",
      fileSize: 1024 * 1024 * 3,
      fileMimeType: "application/pdf",
    });

    expect(screen.getByText("report.pdf")).toBeVisible();
    expect(screen.getByText("3.0 MB")).toBeVisible();
    expect(screen.queryByRole("img", { name: "Report" })).toBeNull();
  });

  it("shows a file name without a size when none was saved", async () => {
    await renderCard({
      ...baseItem,
      itemType: {
        id: "type-file",
        name: "File",
        icon: "File",
        color: "#64748b",
      },
      fileName: "old-upload.pdf",
      fileSize: null,
    });

    expect(screen.getByText("old-upload.pdf")).toBeVisible();
    expect(screen.queryByText(/\bB$|KB|MB/)).toBeNull();
  });

  it("swaps a thumbnail whose link has expired for a placeholder instead of a broken image", async () => {
    mocks.getImagePreviewUrl.mockResolvedValue("https://r2.test/expired");
    await renderCard(baseItem);

    fireEvent.error(screen.getByRole("img", { name: "Screenshot" }));

    const placeholder = screen.getByRole("img", { name: "Screenshot" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder.querySelector("img")).toBeNull();
  });

  it("still shows code in a snippet card", async () => {
    await renderCard({
      ...baseItem,
      itemType: {
        id: "type-snippet",
        name: "Snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      contentType: "TEXT",
      fileKey: null,
      fileName: null,
      fileSize: null,
      fileMimeType: null,
      contentPreview: "const a = 1;",
    });

    expect(screen.getByText("const a = 1;")).toBeVisible();
    expect(screen.queryByRole("img", { name: "Screenshot" })).toBeNull();
  });
});
