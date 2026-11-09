import { strFromU8, unzipSync } from "fflate";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportData } from "@/types/export";

const mocks = vi.hoisted(() => ({
  collectionFindMany: vi.fn(),
  itemFindMany: vi.fn(),
  getObjectBytes: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { findMany: mocks.collectionFindMany },
    item: { findMany: mocks.itemFindMany },
  },
}));
vi.mock("@/lib/storage", () => ({ getObjectBytes: mocks.getObjectBytes }));

import { exportZipChunks } from "@/lib/export-zip";

const created = new Date("2026-01-02T03:04:05.000Z");

interface StoredFile {
  id: string;
  fileName: string;
  bytes: Uint8Array;
  type?: string;
  // What the database says the size is; the bytes' length unless a test says otherwise
  savedSize?: number | null;
}

function dbItem(file?: StoredFile) {
  return {
    id: file?.id ?? "text-1",
    title: file ? `File ${file.id}` : "A note",
    description: null,
    contentType: file ? "FILE" : "TEXT",
    content: file ? null : "hello",
    url: null,
    language: null,
    fileKey: file ? `files/user-1/${file.id}` : null,
    fileName: file?.fileName ?? null,
    fileSize: file?.bytes.length ?? null,
    fileMimeType: file ? "application/pdf" : null,
    isFavorite: false,
    isPinned: false,
    createdAt: created,
    updatedAt: created,
    itemType: { name: file?.type ?? "Note" },
    collection: null,
    tags: [],
  };
}

function bytesOf(text: string) {
  return new TextEncoder().encode(text);
}

// The database holds these items; storage answers for the keys of files in `readable`. Files in `unlisted` are in the items but missing from the first pass that lists files, like an item added between the two passes
function givenStash(
  files: StoredFile[],
  {
    readable = files.map((f) => f.id),
    unlisted = [],
  }: { readable?: string[]; unlisted?: string[] } = {},
) {
  mocks.collectionFindMany.mockResolvedValue([]);
  mocks.itemFindMany.mockImplementation(
    async (args: { where: { fileKey?: unknown } }) =>
      args.where.fileKey
        ? files
            .filter((file) => !unlisted.includes(file.id))
            .map((file) => ({
              id: file.id,
              fileKey: `files/user-1/${file.id}`,
              fileName: file.fileName,
              fileSize:
                file.savedSize === undefined
                  ? file.bytes.length
                  : file.savedSize,
            }))
        : [dbItem(), ...files.map((file) => dbItem(file))],
  );
  mocks.getObjectBytes.mockImplementation(async (key: string) => {
    const id = key.replace("files/user-1/", "");
    const file = files.find((candidate) => candidate.id === id);
    if (!file || !readable.includes(id)) throw new Error("NoSuchKey");
    return file.bytes;
  });
}

async function zipOf(options?: Parameters<typeof exportZipChunks>[2]) {
  const parts: Uint8Array[] = [];
  for await (const chunk of exportZipChunks(
    "user-1",
    new Date("2026-05-06T07:08:09.000Z"),
    options,
  )) {
    parts.push(chunk);
  }
  const all = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    all.set(part, offset);
    offset += part.length;
  }
  const entries = unzipSync(all);
  const document = JSON.parse(strFromU8(entries["export.json"])) as ExportData;
  return { entries, document };
}

describe("exportZipChunks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("holds each file's exact bytes under files/ and points the item at it", async () => {
    givenStash([
      { id: "a1", fileName: "report.pdf", bytes: bytesOf("%PDF one") },
      { id: "b2", fileName: "photo.png", bytes: new Uint8Array([0, 255, 7]) },
    ]);

    const { entries, document } = await zipOf();

    expect([...entries["files/a1-report.pdf"]]).toEqual([
      ...bytesOf("%PDF one"),
    ]);
    expect([...entries["files/b2-photo.png"]]).toEqual([0, 255, 7]);
    expect(document.items.find((item) => item.title === "File a1")?.file).toBe(
      "files/a1-report.pdf",
    );
    expect(document.items.find((item) => item.title === "File b2")?.file).toBe(
      "files/b2-photo.png",
    );
  });

  it("is one ZIP with export.json as the same document as the JSON export, and no file field on items without a file", async () => {
    givenStash([{ id: "a1", fileName: "report.pdf", bytes: bytesOf("x") }]);

    const { document } = await zipOf();

    expect(document).toMatchObject({
      version: 1,
      exportedAt: "2026-05-06T07:08:09.000Z",
      collections: [],
      missing: [],
    });
    const note = document.items.find((item) => item.title === "A note");
    expect(note).toBeDefined();
    expect(note).not.toHaveProperty("file");
  });

  it("gives two items with the same file name different paths", async () => {
    givenStash([
      { id: "a1", fileName: "notes.pdf", bytes: bytesOf("first") },
      { id: "b2", fileName: "notes.pdf", bytes: bytesOf("second") },
    ]);

    const { entries } = await zipOf();

    expect(strFromU8(entries["files/a1-notes.pdf"])).toBe("first");
    expect(strFromU8(entries["files/b2-notes.pdf"])).toBe("second");
  });

  it("cleans the file name so it can't point outside files/", async () => {
    givenStash([
      { id: "a1", fileName: "../../etc/passwd", bytes: bytesOf("x") },
    ]);

    const { entries } = await zipOf();

    expect(Object.keys(entries).sort()).toEqual([
      "export.json",
      "files/a1-passwd",
    ]);
  });

  it("skips a file it can't read, logs its key, lists it as missing and still sends the rest", async () => {
    givenStash(
      [
        { id: "a1", fileName: "gone.pdf", bytes: bytesOf("lost") },
        { id: "b2", fileName: "kept.pdf", bytes: bytesOf("kept") },
      ],
      { readable: ["b2"] },
    );

    const { entries, document } = await zipOf();

    expect(Object.keys(entries).sort()).toEqual([
      "export.json",
      "files/b2-kept.pdf",
    ]);
    expect(document.missing).toEqual([
      { itemId: "a1", fileName: "gone.pdf", reason: "unreadable" },
    ]);
    expect(
      document.items.find((item) => item.title === "File a1"),
    ).not.toHaveProperty("file");
    expect(console.error).toHaveBeenCalledWith(
      "Export skipped a file it could not read",
      expect.objectContaining({ key: "files/user-1/a1" }),
    );
  });

  it("treats a file that comes back at the wrong size as unreadable instead of archiving it", async () => {
    givenStash([{ id: "a1", fileName: "cut.pdf", bytes: bytesOf("12345") }]);
    mocks.getObjectBytes.mockResolvedValue(bytesOf("123"));

    const { entries, document } = await zipOf();

    expect(Object.keys(entries)).toEqual(["export.json"]);
    expect(document.missing).toEqual([
      { itemId: "a1", fileName: "cut.pdf", reason: "unreadable" },
    ]);
  });

  it("stops adding files once the next one would pass the limit, even if a later one is small enough", async () => {
    givenStash([
      { id: "a1", fileName: "one.bin", bytes: new Uint8Array(40) },
      { id: "b2", fileName: "big.bin", bytes: new Uint8Array(80) },
      { id: "c3", fileName: "small.bin", bytes: new Uint8Array(5) },
    ]);

    const { entries, document } = await zipOf({ filesLimitBytes: 100 });

    expect(Object.keys(entries).sort()).toEqual([
      "export.json",
      "files/a1-one.bin",
    ]);
    expect(document.missing).toEqual([
      { itemId: "b2", fileName: "big.bin", reason: "size_limit" },
      { itemId: "c3", fileName: "small.bin", reason: "size_limit" },
    ]);
    expect(mocks.getObjectBytes).toHaveBeenCalledTimes(1);
  });

  it("allows files that add up to exactly the limit", async () => {
    givenStash([
      { id: "a1", fileName: "one.bin", bytes: new Uint8Array(60) },
      { id: "b2", fileName: "two.bin", bytes: new Uint8Array(40) },
    ]);

    const { document } = await zipOf({ filesLimitBytes: 100 });

    expect(document.missing).toEqual([]);
  });

  it("is only export.json for a stash with no files", async () => {
    givenStash([]);

    const { entries, document } = await zipOf();

    expect(Object.keys(entries)).toEqual(["export.json"]);
    expect(document.missing).toEqual([]);
  });

  it("looks up only the given user's files", async () => {
    givenStash([{ id: "a1", fileName: "report.pdf", bytes: bytesOf("x") }]);

    await zipOf();

    const fileQuery = mocks.itemFindMany.mock.calls
      .map(([args]) => args)
      .find((args) => args.where.fileKey);
    expect(fileQuery.where).toMatchObject({ userId: "user-1" });
  });

  it("fails before sending anything when the database can't be read, so the route can answer with an error", async () => {
    mocks.itemFindMany.mockRejectedValue(new Error("db down"));

    await expect(exportZipChunks("user-1").next()).rejects.toThrow("db down");
  });

  it("reads no more files once the download is cancelled", async () => {
    givenStash([
      { id: "a1", fileName: "one.bin", bytes: new Uint8Array(4) },
      { id: "b2", fileName: "two.bin", bytes: new Uint8Array(4) },
    ]);

    const chunks = exportZipChunks("user-1");
    await chunks.next();
    await chunks.return(undefined);

    expect(mocks.getObjectBytes).toHaveBeenCalledTimes(1);
  });

  it("stops without blaming a file when the browser leaves in the middle of a read", async () => {
    givenStash([
      { id: "a1", fileName: "one.bin", bytes: new Uint8Array(4) },
      { id: "b2", fileName: "two.bin", bytes: new Uint8Array(4) },
    ]);
    const leaving = new AbortController();
    mocks.getObjectBytes.mockImplementation(async () => {
      leaving.abort();
      throw new DOMException("Aborted", "AbortError");
    });

    const chunks = [];
    for await (const chunk of exportZipChunks("user-1", undefined, {
      signal: leaving.signal,
    })) {
      chunks.push(chunk);
    }

    expect(mocks.getObjectBytes).toHaveBeenCalledTimes(1);
    expect(console.error).not.toHaveBeenCalled();
    expect(chunks).toEqual([]);
  });

  it("gives every read the expected size and a signal that ends when the browser leaves or a timeout passes", async () => {
    givenStash([{ id: "a1", fileName: "one.bin", bytes: new Uint8Array(4) }]);
    const leaving = new AbortController();

    await zipOf({ signal: leaving.signal });

    const [key, size, readSignal] = mocks.getObjectBytes.mock.calls[0];
    expect(key).toBe("files/user-1/a1");
    expect(size).toBe(4);
    expect(readSignal.aborted).toBe(false);
    leaving.abort();
    expect(readSignal.aborted).toBe(true);
  });

  it("stops adding files at the entry limit and lists the rest with count_limit", async () => {
    givenStash([
      { id: "a1", fileName: "one.bin", bytes: new Uint8Array(1) },
      { id: "b2", fileName: "two.bin", bytes: new Uint8Array(1) },
      { id: "c3", fileName: "three.bin", bytes: new Uint8Array(1) },
    ]);

    const { entries, document } = await zipOf({ maxFiles: 2 });

    expect(Object.keys(entries).sort()).toEqual([
      "export.json",
      "files/a1-one.bin",
      "files/b2-two.bin",
    ]);
    expect(document.missing).toEqual([
      { itemId: "c3", fileName: "three.bin", reason: "count_limit" },
    ]);
    expect(mocks.getObjectBytes).toHaveBeenCalledTimes(2);
  });

  it("lists a damaged item with no saved size as unreadable instead of leaving it out", async () => {
    givenStash([
      {
        id: "a1",
        fileName: "odd.bin",
        bytes: new Uint8Array(3),
        savedSize: null,
      },
    ]);

    const { entries, document } = await zipOf();

    expect(Object.keys(entries)).toEqual(["export.json"]);
    expect(document.missing).toEqual([
      { itemId: "a1", fileName: "odd.bin", reason: "unreadable" },
    ]);
    expect(mocks.getObjectBytes).not.toHaveBeenCalled();
  });

  it("lists an item with a file that appeared after the files were listed, so the export doesn't look complete when it isn't", async () => {
    givenStash(
      [
        { id: "a1", fileName: "old.bin", bytes: new Uint8Array(3) },
        { id: "z9", fileName: "late.bin", bytes: new Uint8Array(3) },
      ],
      { unlisted: ["z9"] },
    );

    const { entries, document } = await zipOf();

    expect(Object.keys(entries).sort()).toEqual([
      "export.json",
      "files/a1-old.bin",
    ]);
    expect(document.missing).toEqual([
      { itemId: "z9", fileName: "late.bin", reason: "unreadable" },
    ]);
    expect(
      document.items.find((item) => item.title === "File z9"),
    ).not.toHaveProperty("file");
  });

  it("never writes the storage key into export.json", async () => {
    givenStash([{ id: "a1", fileName: "one.bin", bytes: new Uint8Array(3) }]);

    const { entries } = await zipOf();

    expect(strFromU8(entries["export.json"])).not.toContain("files/user-1");
  });

  it("logs the reason and key of a file it skips, not the whole error", async () => {
    givenStash([{ id: "a1", fileName: "one.bin", bytes: new Uint8Array(3) }], {
      readable: [],
    });

    await zipOf();

    expect(console.error).toHaveBeenCalledWith(
      "Export skipped a file it could not read",
      { key: "files/user-1/a1", reason: "NoSuchKey" },
    );
  });
});
