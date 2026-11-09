import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  getSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => {
  class Command {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    S3Client: class {
      send = mocks.send;
    },
    PutObjectCommand: class PutObjectCommand extends Command {},
    GetObjectCommand: class GetObjectCommand extends Command {},
    HeadObjectCommand: class HeadObjectCommand extends Command {},
    CopyObjectCommand: class CopyObjectCommand extends Command {},
    DeleteObjectCommand: class DeleteObjectCommand extends Command {},
  };
});
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mocks.getSignedUrl,
}));
vi.mock("@/lib/env", () => ({
  r2Env: {
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "bucket",
  },
}));

import {
  createDownloadUrl,
  createUploadUrl,
  deleteObject,
  getObjectInfo,
  moveObject,
} from "@/lib/storage";

function signedCommand() {
  return mocks.getSignedUrl.mock.calls[0][1] as {
    input: Record<string, unknown>;
  };
}

function signedOptions() {
  return mocks.getSignedUrl.mock.calls[0][2] as {
    expiresIn: number;
    signableHeaders?: Set<string>;
  };
}

describe("storage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getSignedUrl.mockResolvedValue("https://signed.test/url");
    mocks.send.mockResolvedValue({});
  });

  describe("createUploadUrl", () => {
    it("signs the exact type and size for five minutes", async () => {
      const url = await createUploadUrl({
        key: "pending/user-1/abc",
        contentType: "image/png",
        size: 2048,
      });

      expect(url).toBe("https://signed.test/url");
      expect(signedCommand().input).toEqual({
        Bucket: "bucket",
        Key: "pending/user-1/abc",
        ContentType: "image/png",
        ContentLength: 2048,
      });
      expect(signedOptions().expiresIn).toBe(300);
      expect([...(signedOptions().signableHeaders ?? [])].sort()).toEqual([
        "content-length",
        "content-type",
      ]);
    });
  });

  describe("createDownloadUrl", () => {
    it("forces a file to download as an attachment under its own name", async () => {
      await createDownloadUrl({
        key: "files/user-1/abc",
        kind: "file",
        fileName: "report.pdf",
        mimeType: "application/pdf",
      });

      expect(signedCommand().input).toMatchObject({
        Key: "files/user-1/abc",
        ResponseContentType: "application/pdf",
        ResponseContentDisposition: expect.stringContaining(
          'attachment; filename="report.pdf"',
        ),
      });
      expect(signedOptions().expiresIn).toBe(600);
    });

    it.each([
      ["image", "text/html"],
      ["image", "image/svg+xml"],
      ["image", "application/pdf"],
      ["file", "image/png"],
      ["file", "text/html"],
      ["file", ""],
    ] as const)(
      "refuses a stored %s type of %j and signs nothing",
      (kind, mimeType) => {
        expect(() =>
          createDownloadUrl({
            key: "files/user-1/abc",
            kind,
            fileName: "x",
            mimeType,
          }),
        ).toThrow("isn't allowed");
        expect(mocks.getSignedUrl).not.toHaveBeenCalled();
      },
    );

    it("serves an image inline with the stored type", async () => {
      await createDownloadUrl({
        key: "files/user-1/abc",
        kind: "image",
        fileName: "photo.png",
        mimeType: "image/png",
      });

      expect(signedCommand().input).toMatchObject({
        ResponseContentType: "image/png",
        ResponseContentDisposition: "inline",
      });
    });
  });

  describe("getObjectInfo", () => {
    it("returns the stored size, type and ETag", async () => {
      mocks.send.mockResolvedValue({
        ContentLength: 123,
        ContentType: "image/png",
        ETag: '"abc123"',
      });

      await expect(getObjectInfo("pending/user-1/abc")).resolves.toEqual({
        size: 123,
        contentType: "image/png",
        etag: '"abc123"',
      });
    });

    it("reports a zero length object as empty", async () => {
      mocks.send.mockResolvedValue({
        ContentLength: 0,
        ContentType: "image/png",
        ETag: '"empty"',
      });

      await expect(getObjectInfo("pending/user-1/abc")).resolves.toMatchObject({
        size: 0,
      });
    });

    it.each([
      ["no size", { ContentType: "image/png", ETag: '"abc"' }],
      ["no ETag", { ContentLength: 5, ContentType: "image/png" }],
    ])(
      "throws when storage returns %s instead of guessing",
      async (_label, head) => {
        mocks.send.mockResolvedValue(head);

        await expect(getObjectInfo("pending/user-1/abc")).rejects.toThrow(
          "no size or ETag",
        );
      },
    );

    it("returns null when the object does not exist", async () => {
      mocks.send.mockRejectedValue({
        name: "NotFound",
        $metadata: { httpStatusCode: 404 },
      });

      await expect(getObjectInfo("pending/user-1/missing")).resolves.toBeNull();
    });

    it("lets other failures through instead of reporting a missing object", async () => {
      mocks.send.mockRejectedValue({
        name: "InternalError",
        $metadata: { httpStatusCode: 500 },
      });

      await expect(getObjectInfo("pending/user-1/abc")).rejects.toMatchObject({
        name: "InternalError",
      });
    });
  });

  describe("moveObject", () => {
    it("copies the object to its new key and then deletes the original", async () => {
      await moveObject("pending/user-1/abc", "files/user-1/abc");

      const [copy, remove] = mocks.send.mock.calls.map(([command]) => command);
      expect(copy.input).toEqual({
        Bucket: "bucket",
        Key: "files/user-1/abc",
        CopySource: "bucket/pending/user-1/abc",
      });
      expect(remove.input).toEqual({
        Bucket: "bucket",
        Key: "pending/user-1/abc",
      });
    });

    it("requires the ETag to still match when asked, so a replaced object isn't moved", async () => {
      await moveObject("pending/user-1/abc", "files/user-1/abc", {
        ifMatch: '"abc123"',
      });

      expect(mocks.send.mock.calls[0][0].input).toMatchObject({
        CopySourceIfMatch: '"abc123"',
      });
    });

    it("keeps the original when the object changed and the copy is refused", async () => {
      mocks.send.mockRejectedValueOnce({
        name: "PreconditionFailed",
        $metadata: { httpStatusCode: 412 },
      });

      await expect(
        moveObject("pending/user-1/abc", "files/user-1/abc", {
          ifMatch: '"old"',
        }),
      ).rejects.toMatchObject({ name: "PreconditionFailed" });
      expect(mocks.send).toHaveBeenCalledTimes(1);
    });

    it("keeps the original when the copy fails", async () => {
      mocks.send.mockRejectedValueOnce(new Error("copy failed"));

      await expect(
        moveObject("pending/user-1/abc", "files/user-1/abc"),
      ).rejects.toThrow("copy failed");
      expect(mocks.send).toHaveBeenCalledTimes(1);
    });
  });

  it("deletes an object by key", async () => {
    await deleteObject("files/user-1/abc");

    expect(mocks.send.mock.calls[0][0].input).toEqual({
      Bucket: "bucket",
      Key: "files/user-1/abc",
    });
  });
});
