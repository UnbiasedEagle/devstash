import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  consumeUploadQuota: vi.fn(),
  findUnique: vi.fn(),
  createUploadUrl: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeUploadQuota: mocks.consumeUploadQuota,
  UPLOAD_LIMIT_MESSAGE: "Too many uploads, try again in a minute",
}));
vi.mock("@/lib/storage", () => ({
  createUploadUrl: mocks.createUploadUrl,
}));

import { requestUpload } from "@/actions/uploads";

const image = {
  kind: "image",
  fileName: "photo.png",
  mimeType: "image/png",
  size: 2048,
};
const file = {
  kind: "file",
  fileName: "report.pdf",
  mimeType: "application/pdf",
  size: 4096,
};

describe("requestUpload", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeUploadQuota.mockResolvedValue(true);
    mocks.findUnique.mockResolvedValue({ isPro: true });
    mocks.createUploadUrl.mockResolvedValue("https://r2.test/upload");
  });

  it("rejects a signed-out user without touching storage", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await requestUpload(image);

    expect(result).toEqual({
      success: false,
      error: "Sign in again to upload files",
    });
    expect(mocks.createUploadUrl).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    null,
    "photo.png",
    { ...image, kind: "video" },
    { ...image, size: -1 },
    { ...image, fileName: "" },
  ])("rejects malformed input %j", async (input) => {
    const result = await requestUpload(input);

    expect(result).toEqual({
      success: false,
      error: "Check the file and try again",
    });
    expect(mocks.createUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects a file the rules don't allow, with the reason", async () => {
    const result = await requestUpload({
      ...image,
      fileName: "logo.svg",
      mimeType: "image/svg+xml",
    });

    expect(result).toEqual({
      success: false,
      error: "Choose a PNG, JPEG, GIF or WebP image",
    });
    expect(mocks.consumeUploadQuota).not.toHaveBeenCalled();
    expect(mocks.createUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects an oversize file", async () => {
    const result = await requestUpload({ ...image, size: 6 * 1024 * 1024 });

    expect(result).toEqual({
      success: false,
      error: "Images can be at most 5 MB",
    });
  });

  it("stops when the upload limit is used up", async () => {
    mocks.consumeUploadQuota.mockResolvedValue(false);

    const result = await requestUpload(image);

    expect(result).toEqual({
      success: false,
      error: "Too many uploads, try again in a minute",
    });
    expect(mocks.consumeUploadQuota).toHaveBeenCalledWith("user-1");
    expect(mocks.createUploadUrl).not.toHaveBeenCalled();
  });

  it.each([
    ["an image", image],
    ["a file", file],
  ])("asks a free user to upgrade for %s", async (_label, request) => {
    mocks.findUnique.mockResolvedValue({ isPro: false });

    const result = await requestUpload(request);

    expect(result).toEqual({
      success: false,
      error: "Uploads are part of Pro. Upgrade to upload images and files.",
      code: "pro_required",
    });
    expect(mocks.createUploadUrl).not.toHaveBeenCalled();
  });

  it("lets a Pro user upload a file", async () => {
    const result = await requestUpload(file);

    expect(result.success).toBe(true);
  });

  it("returns a link and a pending key under the user's own prefix", async () => {
    const result = await requestUpload(image);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.uploadUrl).toBe("https://r2.test/upload");
    expect(result.data.key).toMatch(/^pending\/user-1\/[0-9a-f-]{36}$/);
    expect(result.data.key).not.toContain("photo");
    expect(result.data.contentType).toBe("image/png");
  });

  it("signs the approved type and size, with the type in lower case", async () => {
    await requestUpload({ ...image, mimeType: "IMAGE/PNG" });

    expect(mocks.createUploadUrl).toHaveBeenCalledWith({
      key: expect.stringMatching(/^pending\/user-1\//),
      contentType: "image/png",
      size: 2048,
    });
  });

  describe("what real browsers send", () => {
    beforeEach(() => {
      mocks.findUnique.mockResolvedValue({ isPro: true });
    });

    it.each([
      ["readme.md", "", "text/markdown"],
      ["table.csv", "application/vnd.ms-excel", "text/csv"],
      ["bundle.zip", "application/x-zip-compressed", "application/zip"],
    ])(
      "signs and returns the canonical type for %s sent as %j",
      async (fileName, mimeType, canonical) => {
        const result = await requestUpload({
          kind: "file",
          fileName,
          mimeType,
          size: 100,
        });

        expect(mocks.createUploadUrl).toHaveBeenCalledWith(
          expect.objectContaining({ contentType: canonical }),
        );
        expect(result.success && result.data.contentType).toBe(canonical);
      },
    );

    it("still rejects a type that disagrees with the extension", async () => {
      const result = await requestUpload({
        kind: "file",
        fileName: "notes.md",
        mimeType: "text/html",
        size: 100,
      });

      expect(result.success).toBe(false);
      expect(mocks.createUploadUrl).not.toHaveBeenCalled();
    });
  });

  it("gives every upload its own key", async () => {
    const first = await requestUpload(image);
    const second = await requestUpload(image);

    expect(first.success && second.success && first.data.key).not.toBe(
      second.success && second.data.key,
    );
  });

  it("returns a friendly error and not the storage message when storage fails", async () => {
    mocks.createUploadUrl.mockRejectedValue(new Error("R2 credentials wrong"));

    const result = await requestUpload(image);

    expect(result).toEqual({
      success: false,
      error: "Could not start the upload. Try again.",
    });
  });
});
