import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getObjectInfo: vi.fn(),
  moveObject: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  getObjectInfo: mocks.getObjectInfo,
  moveObject: mocks.moveObject,
  deleteObject: mocks.deleteObject,
}));

import { claimUploadedFile, discardStoredFile } from "@/lib/uploaded-files";

const id = "3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b";
const pending = `pending/user-1/${id}`;

const image = {
  userId: "user-1",
  kind: "image" as const,
  fileKey: pending,
  fileName: "shot.png",
  fileSize: 2048,
  fileMimeType: "image/png",
};

describe("claimUploadedFile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getObjectInfo.mockResolvedValue({
      size: 2048,
      contentType: "image/png",
      etag: '"abc"',
    });
    mocks.moveObject.mockResolvedValue(undefined);
  });

  it("moves the user's own upload into place and describes the stored file", async () => {
    const result = await claimUploadedFile(image);

    expect(result).toEqual({
      ok: true,
      file: {
        key: expect.stringMatching(/^files\/user-1\/[0-9a-f-]{36}$/),
        fileName: "shot.png",
        size: 2048,
        mimeType: "image/png",
      },
    });
    const storedKey = result.ok ? result.file.key : "";
    expect(mocks.moveObject).toHaveBeenCalledWith(pending, storedKey, {
      ifMatch: '"abc"',
    });
  });

  it("gives every claim its own destination, so the same upload saved twice at once never shares an object", async () => {
    const first = await claimUploadedFile(image);
    const second = await claimUploadedFile(image);

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.file.key).not.toBe(second.file.key);
    expect(first.file.key).not.toBe(`files/user-1/${id}`);
    expect(second.file.key).not.toBe(`files/user-1/${id}`);
  });

  it.each([
    ["another user's key", `pending/user-2/${id}`],
    ["a key already in files", `files/user-1/${id}`],
    ["a path traversal", `pending/user-1/../user-2/${id}`],
    ["a key that isn't a UUID", "pending/user-1/photo.png"],
  ])("never reaches storage with %s", async (_label, fileKey) => {
    const result = await claimUploadedFile({ ...image, fileKey });

    expect(result).toEqual({
      ok: false,
      error: "The upload wasn't found. Choose the file again.",
    });
    expect(mocks.getObjectInfo).not.toHaveBeenCalled();
    expect(mocks.moveObject).not.toHaveBeenCalled();
  });

  it("reports a missing object", async () => {
    mocks.getObjectInfo.mockResolvedValue(null);

    const result = await claimUploadedFile(image);

    expect(result).toEqual({
      ok: false,
      error: "The upload wasn't found. Choose the file again.",
    });
    expect(mocks.moveObject).not.toHaveBeenCalled();
  });

  it("judges the file by its real size, not the size that was submitted", async () => {
    mocks.getObjectInfo.mockResolvedValue({
      size: 6 * 1024 * 1024,
      contentType: "image/png",
      etag: '"abc"',
    });

    const result = await claimUploadedFile({
      ...image,
      fileSize: 1024,
    });

    expect(result).toEqual({
      ok: false,
      error: "Images can be at most 5 MB",
    });
    expect(mocks.moveObject).not.toHaveBeenCalled();
  });

  it("refuses when the stored size differs from the submitted one", async () => {
    const result = await claimUploadedFile({ ...image, fileSize: 999 });

    expect(result).toEqual({
      ok: false,
      error: "The uploaded file doesn't match. Choose it again.",
    });
    expect(mocks.moveObject).not.toHaveBeenCalled();
  });

  it("refuses when the stored type differs from the allowed one", async () => {
    mocks.getObjectInfo.mockResolvedValue({
      size: 2048,
      contentType: "image/jpeg",
      etag: '"abc"',
    });

    const result = await claimUploadedFile(image);

    expect(result).toEqual({
      ok: false,
      error: "The uploaded file doesn't match. Choose it again.",
    });
    expect(mocks.moveObject).not.toHaveBeenCalled();
  });

  it("refuses a type the rules don't allow, even if it was uploaded", async () => {
    const result = await claimUploadedFile({
      ...image,
      fileName: "logo.svg",
      fileMimeType: "image/svg+xml",
    });

    expect(result).toMatchObject({ ok: false });
    expect(mocks.moveObject).not.toHaveBeenCalled();
  });

  it("stores the canonical type when the browser sent an empty one", async () => {
    mocks.getObjectInfo.mockResolvedValue({
      size: 100,
      contentType: "text/markdown",
      etag: '"md"',
    });

    const result = await claimUploadedFile({
      userId: "user-1",
      kind: "file",
      fileKey: pending,
      fileName: "notes.md",
      fileSize: 100,
      fileMimeType: "",
    });

    expect(result).toMatchObject({
      ok: true,
      file: { mimeType: "text/markdown" },
    });
  });

  it("stores a cleaned file name", async () => {
    const result = await claimUploadedFile({
      ...image,
      fileName: "../../etc/shot.png",
    });

    expect(result).toMatchObject({
      ok: true,
      file: { fileName: "shot.png" },
    });
  });

  it("refuses when the object was replaced after it was checked", async () => {
    mocks.moveObject.mockRejectedValue({ name: "PreconditionFailed" });

    const result = await claimUploadedFile(image);

    expect(result).toEqual({
      ok: false,
      error: "The file changed while saving. Choose it again.",
    });
  });

  it("reports an object that disappeared before the move", async () => {
    mocks.moveObject.mockRejectedValue({ name: "NoSuchKey" });

    const result = await claimUploadedFile(image);

    expect(result).toEqual({
      ok: false,
      error: "The upload wasn't found. Choose the file again.",
    });
  });

  it("lets any other storage failure through", async () => {
    mocks.moveObject.mockRejectedValue(new Error("R2 is down"));

    await expect(claimUploadedFile(image)).rejects.toThrow("R2 is down");
  });
});

describe("discardStoredFile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deletes the stored file", async () => {
    mocks.deleteObject.mockResolvedValue(undefined);

    await discardStoredFile("files/user-1/abc");

    expect(mocks.deleteObject).toHaveBeenCalledWith("files/user-1/abc");
  });

  it("logs a failed delete with the key and doesn't throw", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.deleteObject.mockRejectedValue(new Error("R2 is down"));

    await expect(
      discardStoredFile("files/user-1/abc"),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to delete a stored file after a failed save",
      expect.objectContaining({ key: "files/user-1/abc" }),
    );
    consoleError.mockRestore();
  });
});
