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

import { getItemById, getItemsByCollection } from "@/lib/db/items";

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

  it("scopes a single item lookup to the user and the collection", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const item = await getItemById("user-1", "item-1", {
      collectionId: "col-1",
    });

    expect(item).toBeNull();
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({
      id: "item-1",
      userId: "user-1",
      collectionId: "col-1",
    });
  });
});
