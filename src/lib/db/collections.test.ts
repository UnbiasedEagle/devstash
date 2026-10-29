import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { findFirst: mocks.findFirst } },
}));

import { getCollectionById } from "@/lib/db/collections";

describe("getCollectionById", () => {
  beforeEach(() => vi.resetAllMocks());

  it("only matches a collection owned by the user", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const collection = await getCollectionById("user-1", "col-1");

    expect(collection).toBeNull();
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({
      id: "col-1",
      userId: "user-1",
    });
  });
});
