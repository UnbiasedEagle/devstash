import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createDownloadUrl: vi.fn() }));

vi.mock("@/lib/storage", () => ({
  createDownloadUrl: mocks.createDownloadUrl,
}));

import { getImagePreviewUrl } from "@/lib/file-previews";

const image = {
  contentType: "FILE",
  fileKey: "files/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
  fileName: "shot.png",
  fileMimeType: "image/png",
  itemType: { name: "Image" },
};

describe("getImagePreviewUrl", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createDownloadUrl.mockResolvedValue("https://r2.test/preview");
  });

  it("makes an inline link for a complete image item", async () => {
    const url = await getImagePreviewUrl(image);

    expect(url).toBe("https://r2.test/preview");
    expect(mocks.createDownloadUrl).toHaveBeenCalledWith({
      key: image.fileKey,
      kind: "image",
      fileName: "shot.png",
      mimeType: "image/png",
    });
  });

  it.each([
    ["a File item", { ...image, itemType: { name: "File" } }],
    [
      "a Snippet",
      { ...image, itemType: { name: "Snippet" }, contentType: "TEXT" },
    ],
    ["an image with no stored file", { ...image, fileKey: null }],
    ["an image with no name", { ...image, fileName: null }],
    ["an image with no type", { ...image, fileMimeType: null }],
    ["an image whose content isn't a file", { ...image, contentType: "URL" }],
  ])("makes no link for %s", async (_label, item) => {
    expect(await getImagePreviewUrl(item)).toBeNull();
    expect(mocks.createDownloadUrl).not.toHaveBeenCalled();
  });

  it("makes no link, and doesn't throw, when the stored type isn't allowed, so one bad row can't break a list", async () => {
    mocks.createDownloadUrl.mockImplementation(() => {
      throw new Error("The stored type isn't allowed for this kind of upload");
    });

    await expect(getImagePreviewUrl(image)).resolves.toBeNull();
  });

  it("logs the key when it can't make a link", async () => {
    mocks.createDownloadUrl.mockRejectedValue(new Error("boom"));

    await getImagePreviewUrl(image);

    expect(console.error).toHaveBeenCalledWith(
      "Could not create an image preview link",
      expect.objectContaining({ key: image.fileKey }),
    );
  });
});
