import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    $queryRaw: mocks.queryRaw,
    item: { findFirst: mocks.findFirst },
  },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    TransactionIsolationLevel: { RepeatableRead: "RepeatableRead" },
    join: (values: unknown[]) => values,
  },
}));

import {
  getItemById,
  getItemForUser,
  getItemsByCollection,
  searchItems,
} from "@/lib/db/items";

describe("searchItems", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation((run) =>
      run({ item: { count: mocks.count, findMany: mocks.findMany } }),
    );
    mocks.findMany.mockResolvedValue([]);
    mocks.queryRaw.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
  });

  it("scopes to the user and requires every word to match some field", async () => {
    await searchItems("user-1", "react  hooks", 1);

    const where = mocks.count.mock.calls[0][0].where;
    expect(where.userId).toBe("user-1");
    expect(where.AND).toHaveLength(2);
    const fields = where.AND[0].OR.map(
      (clause: object) => Object.keys(clause)[0],
    );
    expect(fields).toEqual([
      "title",
      "description",
      "content",
      "url",
      "itemType",
      "tags",
    ]);
    expect(where.AND[0].OR[0]).toEqual({
      title: { contains: "react", mode: "insensitive" },
    });
    expect(where.AND[1].OR[0]).toEqual({
      title: { contains: "hooks", mode: "insensitive" },
    });
  });

  it("matches tag and type names through their relations", async () => {
    await searchItems("user-1", "css", 1);

    const [, , , , itemType, tags] =
      mocks.count.mock.calls[0][0].where.AND[0].OR;
    expect(itemType).toEqual({
      itemType: { name: { contains: "css", mode: "insensitive" } },
    });
    expect(tags).toEqual({
      tags: {
        some: { tag: { name: { contains: "css", mode: "insensitive" } } },
      },
    });
  });

  it("returns an empty page without querying when there are no words", async () => {
    const result = await searchItems("user-1", "   ", 1);

    expect(result).toEqual({ items: [], total: 0, page: 1, totalPages: 1 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("escapes wildcard characters so they match literally", async () => {
    await searchItems("user-1", "100%_done", 1);

    expect(mocks.count.mock.calls[0][0].where.AND[0].OR[0]).toEqual({
      title: { contains: "100\\%\\_done", mode: "insensitive" },
    });
  });

  it("paginates the matches", async () => {
    mocks.count.mockResolvedValue(30);

    const result = await searchItems("user-1", "react", 2);

    expect(result).toMatchObject({ page: 2, totalPages: 2, total: 30 });
    expect(mocks.findMany.mock.calls[0][0]).toMatchObject({
      skip: 24,
      take: 24,
    });
  });
});

describe("collection item queries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation((run) =>
      run({ item: { count: mocks.count, findMany: mocks.findMany } }),
    );
    mocks.findMany.mockResolvedValue([]);
    mocks.queryRaw.mockResolvedValue([]);
  });

  it("scopes the list to the user and the collection", async () => {
    mocks.count.mockResolvedValue(0);

    await getItemsByCollection("user-1", "col-1", 1);

    expect(mocks.count).toHaveBeenCalledWith({
      where: { userId: "user-1", collectionId: "col-1" },
    });
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({
      userId: "user-1",
      collectionId: "col-1",
    });
  });

  it("clamps a page past the end to the last page", async () => {
    mocks.count.mockResolvedValue(30);

    const result = await getItemsByCollection("user-1", "col-1", 99);

    expect(result).toMatchObject({ page: 2, totalPages: 2, total: 30 });
    expect(mocks.findMany.mock.calls[0][0]).toMatchObject({
      skip: 24,
      take: 24,
    });
  });

  it("scopes a single item lookup to the user and the item type", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const item = await getItemById("user-1", "item-1", {
      itemTypeId: "type-1",
    });

    expect(item).toBeNull();
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({
      id: "item-1",
      userId: "user-1",
      itemTypeId: "type-1",
    });
  });

  it("scopes a lookup without a type or collection to the user only", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await getItemForUser("user-1", "item-1");

    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({
      id: "item-1",
      userId: "user-1",
    });
  });
});
