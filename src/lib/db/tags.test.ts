import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { tag: { findMany: mocks.findMany, findUnique: mocks.findUnique } },
}));

import { getTagByName, getTagsWithCounts } from "@/lib/db/tags";

describe("getTagsWithCounts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("scopes to the user, skips tags without items and orders by count then name", async () => {
    mocks.findMany.mockResolvedValue([]);

    await getTagsWithCounts("user-1");

    const args = mocks.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user-1", items: { some: {} } });
    expect(args.orderBy).toEqual([
      { items: { _count: "desc" } },
      { name: "asc" },
    ]);
  });

  it("flattens the item count", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "t1", name: "react", _count: { items: 3 } },
    ]);

    expect(await getTagsWithCounts("user-1")).toEqual([
      { id: "t1", name: "react", count: 3 },
    ]);
  });
});

describe("getTagByName", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("looks the tag up by the user and name together so another user's tag is never found", async () => {
    mocks.findUnique.mockResolvedValue(null);

    expect(await getTagByName("user-1", "react")).toBeNull();

    expect(mocks.findUnique.mock.calls[0][0].where).toEqual({
      userId_name: { userId: "user-1", name: "react" },
    });
  });
});
