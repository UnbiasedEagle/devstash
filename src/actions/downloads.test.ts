import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  consumeDownloadQuota: vi.fn(),
  findFirst: vi.fn(),
  createDownloadUrl: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst: mocks.findFirst } },
}));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeDownloadQuota: mocks.consumeDownloadQuota,
  DOWNLOAD_LIMIT_MESSAGE: "Too many downloads, try again in a minute",
}));
vi.mock("@/lib/storage", () => ({
  createDownloadUrl: mocks.createDownloadUrl,
}));

import { getDownloadLink } from "@/actions/downloads";

const storedFile = {
  contentType: "FILE",
  fileKey: "files/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
  fileName: "report.pdf",
  fileMimeType: "application/pdf",
  itemType: { name: "File" },
};

describe("getDownloadLink", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeDownloadQuota.mockResolvedValue(true);
    mocks.findFirst.mockResolvedValue(storedFile);
    mocks.createDownloadUrl.mockResolvedValue("https://r2.test/download");
  });

  it("rejects a signed-out user without touching the database or storage", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await getDownloadLink("item-1");

    expect(result).toEqual({
      success: false,
      error: "Sign in again to download files",
    });
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.createDownloadUrl).not.toHaveBeenCalled();
  });

  it.each([undefined, null, "", 5, "x".repeat(65)])(
    "rejects a bad item id %j",
    async (id) => {
      const result = await getDownloadLink(id);

      expect(result).toEqual({ success: false, error: "File not found" });
      expect(mocks.findFirst).not.toHaveBeenCalled();
    },
  );

  it("counts a bad item id against the limit, so guessing ids is limited too", async () => {
    await getDownloadLink("");

    expect(mocks.consumeDownloadQuota).toHaveBeenCalledWith("user-1");
  });

  it("stops when the download limit is used up", async () => {
    mocks.consumeDownloadQuota.mockResolvedValue(false);

    const result = await getDownloadLink("item-1");

    expect(result).toEqual({
      success: false,
      error: "Too many downloads, try again in a minute",
    });
    expect(mocks.consumeDownloadQuota).toHaveBeenCalledWith("user-1");
    expect(mocks.createDownloadUrl).not.toHaveBeenCalled();
  });

  it("only looks for the item among the signed-in user's own", async () => {
    await getDownloadLink("item-1");

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } }),
    );
  });

  it("answers the same way for another user's item as for one that doesn't exist", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await getDownloadLink("someone-elses-item");

    expect(result).toEqual({ success: false, error: "File not found" });
    expect(mocks.createDownloadUrl).not.toHaveBeenCalled();
  });

  it.each([
    ["a text item", { ...storedFile, contentType: "TEXT", fileKey: null }],
    ["a link item", { ...storedFile, contentType: "URL", fileKey: null }],
    ["a file item with no stored file", { ...storedFile, fileKey: null }],
    ["a file item with no name", { ...storedFile, fileName: null }],
    ["a file item with no type", { ...storedFile, fileMimeType: null }],
  ])("refuses %s", async (_label, item) => {
    mocks.findFirst.mockResolvedValue(item);

    const result = await getDownloadLink("item-1");

    expect(result).toEqual({ success: false, error: "File not found" });
    expect(mocks.createDownloadUrl).not.toHaveBeenCalled();
  });

  it("makes an attachment link for a file", async () => {
    const result = await getDownloadLink("item-1");

    expect(result).toEqual({
      success: true,
      data: { url: "https://r2.test/download" },
    });
    expect(mocks.createDownloadUrl).toHaveBeenCalledWith({
      key: storedFile.fileKey,
      kind: "file",
      fileName: "report.pdf",
      mimeType: "application/pdf",
      asAttachment: true,
    });
  });

  it("makes an attachment link for an image too, so the browser saves it", async () => {
    mocks.findFirst.mockResolvedValue({
      ...storedFile,
      fileName: "shot.png",
      fileMimeType: "image/png",
      itemType: { name: "Image" },
    });

    await getDownloadLink("item-1");

    expect(mocks.createDownloadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "image", asAttachment: true }),
    );
  });

  it("returns a friendly error and not the storage message when linking fails", async () => {
    mocks.createDownloadUrl.mockRejectedValue(
      new Error("R2 credentials wrong"),
    );

    const result = await getDownloadLink("item-1");

    expect(result).toEqual({
      success: false,
      error: "Could not prepare the download. Try again.",
    });
  });
});
