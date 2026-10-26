import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }
  return {
    PrismaClientKnownRequestError,
    getSession: vi.fn(),
    consumeMutationQuota: vi.fn(),
    itemFindFirst: vi.fn(),
    itemDelete: vi.fn(),
    tagDeleteMany: vi.fn(),
    transaction: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: mocks.PrismaClientKnownRequestError,
    TransactionIsolationLevel: { Serializable: "Serializable" },
  },
}));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeMutationQuota: mocks.consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE: "Too many changes, try again in a minute",
}));

import { deleteItem } from "@/actions/items";

const runInTransaction = (run: (tx: unknown) => unknown) =>
  run({
    item: { findFirst: mocks.itemFindFirst, delete: mocks.itemDelete },
    tag: { deleteMany: mocks.tagDeleteMany },
  });

describe("deleteItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.itemFindFirst.mockResolvedValue({
      tags: [{ tagId: "tag-1" }, { tagId: "tag-2" }],
    });
    mocks.itemDelete.mockResolvedValue({ id: "item-1" });
    mocks.tagDeleteMany.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation(runInTransaction);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("stops at the mutation limit", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns Item not found for a malformed id without spending quota", async () => {
    const result = await deleteItem("");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
  });

  it("scopes the delete to the session user and cleans up only the deleted item's unused tags", async () => {
    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(mocks.itemFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } }),
    );
    expect(mocks.itemDelete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
    expect(mocks.tagDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        id: { in: ["tag-1", "tag-2"] },
        items: { none: {} },
      },
    });
  });

  it("returns Item not found for an item that isn't the user's and deletes nothing", async () => {
    mocks.itemFindFirst.mockResolvedValue(null);

    const result = await deleteItem("someone-elses-item");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.itemDelete).not.toHaveBeenCalled();
    expect(mocks.tagDeleteMany).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns Item not found when the item is deleted between the lookup and the write", async () => {
    mocks.itemDelete.mockRejectedValue(
      new mocks.PrismaClientKnownRequestError("gone", { code: "P2025" }),
    );

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates the dashboard and every type page", async () => {
    await deleteItem("item-1");

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/items/[type]", "page");
  });

  it("retries a Serializable write conflict", async () => {
    mocks.transaction
      .mockRejectedValueOnce(
        new mocks.PrismaClientKnownRequestError("conflict", { code: "P2034" }),
      )
      .mockImplementation(runInTransaction);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("never exposes database messages", async () => {
    mocks.transaction.mockRejectedValue(new Error("postgres://user:secret@db"));

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Could not delete the item. Try again.",
    });
  });
});
