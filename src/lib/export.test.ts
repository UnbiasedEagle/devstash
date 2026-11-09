import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportData } from "@/types/export";

const mocks = vi.hoisted(() => ({
  collectionFindMany: vi.fn(),
  itemFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { findMany: mocks.collectionFindMany },
    item: { findMany: mocks.itemFindMany },
  },
}));

import { EXPORT_PAGE_SIZE, exportChunks, exportFileName } from "@/lib/export";

const created = new Date("2026-01-02T03:04:05.000Z");

function dbItem(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Item ${id}`,
    description: null,
    contentType: "TEXT",
    content: "const a = 1;",
    url: null,
    language: "typescript",
    fileName: null,
    fileSize: null,
    fileMimeType: null,
    isFavorite: false,
    isPinned: true,
    createdAt: created,
    updatedAt: created,
    itemType: { name: "Snippet" },
    collection: null,
    tags: [],
    ...overrides,
  };
}

function dbCollection(id: string) {
  return {
    id,
    name: `Collection ${id}`,
    description: null,
    isFavorite: false,
    userId: "user-1",
    createdAt: created,
    updatedAt: created,
  };
}

async function pieces(userId = "user-1", now?: Date): Promise<string[]> {
  const out: string[] = [];
  for await (const piece of exportChunks(userId, now)) out.push(piece);
  return out;
}

async function exportOf(userId = "user-1", now?: Date): Promise<ExportData> {
  return JSON.parse((await pieces(userId, now)).join(""));
}

describe("exportChunks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.collectionFindMany.mockResolvedValue([]);
    mocks.itemFindMany.mockResolvedValue([]);
  });

  it("is one valid document that describes the export, even for an empty stash", async () => {
    const data = await exportOf("user-1", new Date("2026-05-06T07:08:09.000Z"));

    expect(data).toEqual({
      version: 1,
      exportedAt: "2026-05-06T07:08:09.000Z",
      collections: [],
      items: [],
    });
  });

  it("reads only the given user's rows", async () => {
    await pieces("user-1");

    expect(mocks.collectionFindMany.mock.calls[0][0].where).toEqual({
      userId: "user-1",
    });
    expect(mocks.itemFindMany.mock.calls[0][0].where).toEqual({
      userId: "user-1",
    });
  });

  it("names the type, collection and tags instead of ids", async () => {
    mocks.itemFindMany.mockResolvedValue([
      dbItem("a", {
        collection: { name: "React Patterns" },
        tags: [{ tag: { name: "hooks" } }, { tag: { name: "react" } }],
      }),
    ]);

    const { items } = await exportOf();

    expect(items[0]).toMatchObject({
      title: "Item a",
      type: "Snippet",
      collection: "React Patterns",
      tags: ["hooks", "react"],
      isPinned: true,
      createdAt: "2026-01-02T03:04:05.000Z",
    });
  });

  it("asks the database for tags in name order", async () => {
    await pieces();

    expect(mocks.itemFindMany.mock.calls[0][0].select.tags.orderBy).toEqual({
      tag: { name: "asc" },
    });
  });

  it("gives a file item its file details but never the storage key or any id", async () => {
    mocks.itemFindMany.mockResolvedValue([
      dbItem("f", {
        contentType: "FILE",
        content: null,
        fileKey: "files/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
        fileName: "report.pdf",
        fileSize: 2048,
        fileMimeType: "application/pdf",
        itemType: { name: "File" },
        userId: "user-1",
      }),
    ]);

    const { items } = await exportOf();

    expect(items[0]).toMatchObject({
      fileName: "report.pdf",
      fileSize: 2048,
      fileMimeType: "application/pdf",
    });
    expect(JSON.stringify(items[0])).not.toContain("files/user-1");
    expect(items[0]).not.toHaveProperty("fileKey");
    expect(items[0]).not.toHaveProperty("userId");
    expect(items[0]).not.toHaveProperty("id");
  });

  it("exports collections without ids or the owner", async () => {
    mocks.collectionFindMany.mockResolvedValue([
      { ...dbCollection("c1"), name: "Context Files", description: "Prompts" },
    ]);

    const { collections } = await exportOf();

    expect(collections).toEqual([
      {
        name: "Context Files",
        description: "Prompts",
        isFavorite: false,
        createdAt: "2026-01-02T03:04:05.000Z",
        updatedAt: "2026-01-02T03:04:05.000Z",
      },
    ]);
  });

  it("reads items page by page, keeps their order and sends one piece per page", async () => {
    const firstPage = Array.from({ length: EXPORT_PAGE_SIZE }, (_, index) =>
      dbItem(`a${index}`),
    );
    mocks.itemFindMany
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([dbItem("b0"), dbItem("b1")]);

    const out = await pieces();
    const { items } = JSON.parse(out.join("")) as ExportData;

    expect(items).toHaveLength(EXPORT_PAGE_SIZE + 2);
    expect(items[0].title).toBe("Item a0");
    expect(items.at(-1)?.title).toBe("Item b1");
    expect(out).toHaveLength(3);
    expect(mocks.itemFindMany).toHaveBeenCalledTimes(2);
    expect(mocks.itemFindMany.mock.calls[1][0]).toMatchObject({
      cursor: { id: `a${EXPORT_PAGE_SIZE - 1}` },
      skip: 1,
    });
  });

  it("pages collections the same way", async () => {
    mocks.collectionFindMany
      .mockResolvedValueOnce(
        Array.from({ length: EXPORT_PAGE_SIZE }, (_, index) =>
          dbCollection(`c${index}`),
        ),
      )
      .mockResolvedValueOnce([dbCollection("last")]);

    const { collections } = await exportOf();

    expect(collections).toHaveLength(EXPORT_PAGE_SIZE + 1);
    expect(collections.at(-1)?.name).toBe("Collection last");
    expect(mocks.collectionFindMany.mock.calls[1][0]).toMatchObject({
      cursor: { id: `c${EXPORT_PAGE_SIZE - 1}` },
      skip: 1,
    });
  });

  it("orders by date then id so every request returns the same order", async () => {
    await pieces();

    const order = [{ createdAt: "asc" }, { id: "asc" }];
    expect(mocks.itemFindMany.mock.calls[0][0].orderBy).toEqual(order);
    expect(mocks.collectionFindMany.mock.calls[0][0].orderBy).toEqual(order);
  });

  it("sends nothing until the first read has worked, so a failure can still be an error response", async () => {
    mocks.collectionFindMany.mockRejectedValue(new Error("db down"));

    const chunks = exportChunks("user-1");

    await expect(chunks.next()).rejects.toThrow("db down");
  });

  it("reads only as far as it is asked, so a cancelled download stops reading", async () => {
    mocks.itemFindMany.mockResolvedValueOnce(
      Array.from({ length: EXPORT_PAGE_SIZE }, (_, index) =>
        dbItem(`a${index}`),
      ),
    );

    const chunks = exportChunks("user-1");
    await chunks.next();
    await chunks.return(undefined);

    expect(mocks.itemFindMany).toHaveBeenCalledTimes(1);
  });
});

describe("exportFileName", () => {
  it("is dated by the day of the export", () => {
    expect(exportFileName(new Date("2026-11-09T23:59:00.000Z"))).toBe(
      "devstash-export-2026-11-09.json",
    );
  });
});
