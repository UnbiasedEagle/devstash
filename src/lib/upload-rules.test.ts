import { describe, expect, it } from "vitest";
import {
  attachmentDisposition,
  cleanFileName,
  fileKey,
  isAllowedMimeType,
  MAX_UPLOAD_BYTES,
  parsePendingKey,
  pendingKey,
  uploadRequestSchema,
  validateUpload,
} from "@/lib/upload-rules";

const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

describe("validateUpload", () => {
  it.each([
    ["image", "photo.png", "image/png"],
    ["image", "photo.jpg", "image/jpeg"],
    ["image", "photo.jpeg", "image/jpeg"],
    ["image", "anim.gif", "image/gif"],
    ["image", "shot.webp", "image/webp"],
    ["file", "doc.pdf", "application/pdf"],
    ["file", "notes.txt", "text/plain"],
    ["file", "readme.md", "text/markdown"],
    ["file", "readme.markdown", "text/markdown"],
    ["file", "data.json", "application/json"],
    ["file", "table.csv", "text/csv"],
    ["file", "bundle.zip", "application/zip"],
    ["file", "report.docx", DOCX],
    ["file", "sheet.xlsx", XLSX],
    ["file", "deck.pptx", PPTX],
  ] as const)(
    "accepts a %s named %s of type %s and returns that type",
    (kind, fileName, mimeType) => {
      expect(validateUpload({ kind, fileName, mimeType, size: 1024 })).toEqual({
        ok: true,
        mimeType,
      });
    },
  );

  it.each([
    ["file", "readme.md", "", "text/markdown"],
    ["file", "readme.md", "text/x-markdown", "text/markdown"],
    ["file", "table.csv", "application/vnd.ms-excel", "text/csv"],
    ["file", "bundle.zip", "application/x-zip-compressed", "application/zip"],
    ["file", "data.json", "application/x-json", "application/json"],
    ["image", "photo.jpg", "image/jpg", "image/jpeg"],
    ["image", "photo.png", "", "image/png"],
  ] as const)(
    "accepts what real browsers send for %s %s (%j) and returns %s",
    (kind, fileName, mimeType, canonical) => {
      expect(validateUpload({ kind, fileName, mimeType, size: 10 })).toEqual({
        ok: true,
        mimeType: canonical,
      });
    },
  );

  it("ignores the case of the extension and the MIME type", () => {
    expect(
      validateUpload({
        kind: "image",
        fileName: "PHOTO.PNG",
        mimeType: "IMAGE/PNG",
        size: 10,
      }),
    ).toEqual({ ok: true, mimeType: "image/png" });
  });

  it.each([
    ["image", "logo.svg", "image/svg+xml"],
    ["file", "logo.svg", "image/svg+xml"],
    ["file", "setup.exe", "application/x-msdownload"],
    ["file", "run.sh", "application/x-sh"],
    ["file", "page.html", "text/html"],
    ["file", "unknown.bin", "application/octet-stream"],
    ["file", "setup.exe", ""],
  ] as const)("rejects %s %s of type %j", (kind, fileName, mimeType) => {
    const result = validateUpload({ kind, fileName, mimeType, size: 100 });

    expect(result.ok).toBe(false);
  });

  it.each([
    ["a png type with an exe name", "image", "photo.exe", "image/png"],
    ["a jpeg type with a png name", "image", "photo.png", "image/jpeg"],
    ["an image type sent as a file", "file", "photo.png", "image/png"],
    ["a pdf type with a txt name", "file", "doc.txt", "application/pdf"],
    ["an html type with a markdown name", "file", "a.md", "text/html"],
    ["an image type with a csv name", "file", "a.csv", "image/png"],
    ["a name with no extension", "image", "photo", "image/png"],
    ["a bare dotfile name", "image", ".png", "image/png"],
  ] as const)("rejects %s", (_label, kind, fileName, mimeType) => {
    const result = validateUpload({ kind, fileName, mimeType, size: 100 });

    expect(result.ok).toBe(false);
  });

  it("accepts exactly the size limit and rejects one byte more", () => {
    const image = { kind: "image", fileName: "a.png", mimeType: "image/png" };
    const file = {
      kind: "file",
      fileName: "a.pdf",
      mimeType: "application/pdf",
    };

    expect(
      validateUpload({ ...image, kind: "image", size: MAX_UPLOAD_BYTES.image }),
    ).toMatchObject({ ok: true });
    expect(
      validateUpload({ ...file, kind: "file", size: MAX_UPLOAD_BYTES.file }),
    ).toMatchObject({ ok: true });

    const tooBigImage = validateUpload({
      ...image,
      kind: "image",
      size: MAX_UPLOAD_BYTES.image + 1,
    });
    const tooBigFile = validateUpload({
      ...file,
      kind: "file",
      size: MAX_UPLOAD_BYTES.file + 1,
    });
    expect(tooBigImage).toEqual({
      ok: false,
      error: "Images can be at most 5 MB",
    });
    expect(tooBigFile).toEqual({
      ok: false,
      error: "Files can be at most 10 MB",
    });
  });

  it("rejects an empty file", () => {
    expect(
      validateUpload({
        kind: "file",
        fileName: "a.txt",
        mimeType: "text/plain",
        size: 0,
      }),
    ).toEqual({ ok: false, error: "This file is empty" });
  });
});

describe("isAllowedMimeType", () => {
  it("accepts the stored types for their own kind only", () => {
    expect(isAllowedMimeType("image", "image/png")).toBe(true);
    expect(isAllowedMimeType("file", "application/pdf")).toBe(true);
    expect(isAllowedMimeType("image", "application/pdf")).toBe(false);
    expect(isAllowedMimeType("file", "image/png")).toBe(false);
  });

  it.each(["text/html", "image/svg+xml", "application/javascript", ""])(
    "rejects %j for both kinds",
    (mimeType) => {
      expect(isAllowedMimeType("image", mimeType)).toBe(false);
      expect(isAllowedMimeType("file", mimeType)).toBe(false);
    },
  );

  it("does not accept an alias as a stored type", () => {
    expect(isAllowedMimeType("file", "application/vnd.ms-excel")).toBe(false);
  });
});

describe("uploadRequestSchema", () => {
  const valid = {
    kind: "image",
    fileName: "a.png",
    mimeType: "image/png",
    size: 10,
  };

  it("accepts a well formed request", () => {
    expect(uploadRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an empty MIME type, which some systems send", () => {
    expect(
      uploadRequestSchema.safeParse({ ...valid, mimeType: "" }).success,
    ).toBe(true);
  });

  it.each([
    { kind: "video" },
    { fileName: "" },
    { mimeType: 5 },
    { size: 0 },
    { size: -5 },
    { size: 1.5 },
    { size: "10" },
  ])("rejects %j", (override) => {
    expect(
      uploadRequestSchema.safeParse({ ...valid, ...override }).success,
    ).toBe(false);
  });
});

describe("cleanFileName", () => {
  it("keeps an ordinary name", () => {
    expect(cleanFileName("report 2026.pdf")).toBe("report 2026.pdf");
  });

  it.each([
    ["../../etc/passwd", "passwd"],
    ["C:\\Users\\me\\notes.txt", "notes.txt"],
    ["folder/sub/file.md", "file.md"],
  ])("removes the path from %s", (input, expected) => {
    expect(cleanFileName(input)).toBe(expected);
  });

  it("removes control characters, including line breaks", () => {
    expect(cleanFileName("a\u0000b\u001fc\u007f.txt")).toBe("abc.txt");
    expect(cleanFileName("a\r\nb.txt")).toBe("ab.txt");
  });

  it("removes direction overrides and line separators that could fake an extension", () => {
    expect(cleanFileName("invoice\u202Efdp.exe")).toBe("invoicefdp.exe");
    expect(cleanFileName("a\u2066b\u2069\u200e\u200f\u2028\u2029.txt")).toBe(
      "ab.txt",
    );
  });

  it("removes leading dots so a name can't be a hidden file", () => {
    expect(cleanFileName("...hidden.txt")).toBe("hidden.txt");
  });

  it.each(["", "   ", "...", "../", "\u0000", "\u202E"])(
    "falls back to a default for %j",
    (input) => {
      expect(cleanFileName(input)).toBe("file");
    },
  );

  it("shortens a long name to 120 characters and keeps its extension", () => {
    const cleaned = cleanFileName(`${"a".repeat(300)}.pdf`);

    expect(cleaned).toHaveLength(120);
    expect(cleaned.endsWith(".pdf")).toBe(true);
  });

  it("shortens a long name that has no extension", () => {
    expect(cleanFileName("b".repeat(300))).toHaveLength(120);
  });
});

describe("object keys", () => {
  it("builds keys from the user id and a random id only", () => {
    expect(pendingKey("user-1", "abc")).toBe("pending/user-1/abc");
    expect(fileKey("user-1", "abc")).toBe("files/user-1/abc");
  });
});

describe("parsePendingKey", () => {
  const id = "3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b";

  it("returns the id of the user's own pending key", () => {
    expect(parsePendingKey("user-1", `pending/user-1/${id}`)).toBe(id);
  });

  it("accepts a key built by pendingKey", () => {
    expect(parsePendingKey("user-1", pendingKey("user-1", id))).toBe(id);
  });

  it.each([
    ["another user's key", `pending/user-2/${id}`],
    ["a key already moved to files", `files/user-1/${id}`],
    ["a key with a different prefix", `other/user-1/${id}`],
    ["a path traversal", `pending/user-1/../user-2/${id}`],
    ["an extra segment", `pending/user-1/${id}/extra`],
    ["a missing segment", `pending/${id}`],
    ["an id that isn't a UUID", "pending/user-1/photo.png"],
    ["an empty id", "pending/user-1/"],
    ["an empty key", ""],
    ["a UUID with trailing characters", `pending/user-1/${id}x`],
  ])("rejects %s", (_label, key) => {
    expect(parsePendingKey("user-1", key)).toBeNull();
  });

  it("does not let a user id with a slash match someone else's prefix", () => {
    expect(
      parsePendingKey("user-1/user-2", `pending/user-1/user-2/${id}`),
    ).toBeNull();
  });
});

describe("attachmentDisposition", () => {
  it("offers a plain name and the full UTF-8 name", () => {
    expect(attachmentDisposition("résumé 2026.pdf")).toBe(
      "attachment; filename=\"r_sum_ 2026.pdf\"; filename*=UTF-8''r%C3%A9sum%C3%A9%202026.pdf",
    );
  });

  it("can't be broken out of by a quote in the name", () => {
    const header = attachmentDisposition('a"b.txt; evil="x');

    expect(header).toContain('filename="a_b.txt; evil=_x"');
    expect(header.match(/"/g)).toHaveLength(2);
  });

  it("can't be split into another header by line breaks in the name", () => {
    const header = attachmentDisposition("a\r\nSet-Cookie: x=1\r\n.txt");

    expect(header).not.toMatch(/[\r\n]/);
    expect(header).toContain('filename="aSet-Cookie: x=1.txt"');
  });

  it("drops any path from the name", () => {
    expect(attachmentDisposition("..\\..\\secret.txt")).toContain(
      'filename="secret.txt"',
    );
  });
});
