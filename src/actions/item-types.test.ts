import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }
  const tx = {
    user: { findUnique: vi.fn() },
    itemType: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    item: { count: vi.fn() },
  };
  return {
    PrismaClientKnownRequestError,
    tx,
    getSession: vi.fn(),
    consumeMutationQuota: vi.fn(),
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

import {
  createItemType,
  deleteItemType,
  updateItemType,
} from "@/actions/item-types";
import { MAX_CUSTOM_TYPES } from "@/lib/custom-type-options";

const INPUT = { name: "Recipe", icon: "BookOpen", color: "#ef4444" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
  mocks.consumeMutationQuota.mockResolvedValue(true);
  mocks.transaction.mockImplementation((run) => run(mocks.tx));
  mocks.tx.user.findUnique.mockResolvedValue({ isPro: true });
  mocks.tx.itemType.count.mockResolvedValue(0);
  mocks.tx.itemType.findFirst.mockResolvedValue(null);
  mocks.tx.itemType.create.mockResolvedValue({ id: "type-1", name: "Recipe" });
  mocks.tx.itemType.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.item.count.mockResolvedValue(0);
});

describe("createItemType", () => {
  it("creates the type for the signed-in Pro user and revalidates the views", async () => {
    const result = await createItemType(INPUT);

    expect(result).toEqual({
      success: true,
      data: { id: "type-1", name: "Recipe" },
    });
    expect(mocks.tx.itemType.create).toHaveBeenCalledWith({
      data: { ...INPUT, userId: "user-1" },
      select: { id: true, name: true },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("asks a free user to upgrade, read from the database", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: false });

    const result = await createItemType(INPUT);

    expect(result).toMatchObject({ success: false, code: "pro_required" });
    expect(mocks.tx.itemType.create).not.toHaveBeenCalled();
  });

  it("refuses a name the user already has in another letter case", async () => {
    mocks.tx.itemType.findFirst.mockResolvedValue({ id: "type-9" });

    const result = await createItemType({ ...INPUT, name: "RECIPE" });

    expect(result).toEqual({
      success: false,
      error: "You already have a type with that name",
    });
    expect(mocks.tx.itemType.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        name: { equals: "RECIPE", mode: "insensitive" },
      },
      select: { id: true },
    });
    expect(mocks.tx.itemType.create).not.toHaveBeenCalled();
  });

  it("stops at the limit inside the transaction", async () => {
    mocks.tx.itemType.count.mockResolvedValue(MAX_CUSTOM_TYPES);

    const result = await createItemType(INPUT);

    expect(result.success).toBe(false);
    expect(mocks.tx.itemType.create).not.toHaveBeenCalled();
  });

  it("rejects a built-in name before using the rate limit", async () => {
    const result = await createItemType({ ...INPUT, name: "snippet" });

    expect(result.success).toBe(false);
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns the rate limit message when the quota is used up", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await createItemType(INPUT);

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("retries a write conflict and then succeeds", async () => {
    mocks.transaction
      .mockRejectedValueOnce(
        new mocks.PrismaClientKnownRequestError("conflict", { code: "P2034" }),
      )
      .mockImplementation((run) => run(mocks.tx));

    const result = await createItemType(INPUT);

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("reports a duplicate name when two creates race and the database refuses the second", async () => {
    mocks.transaction.mockRejectedValue(
      new mocks.PrismaClientKnownRequestError("unique", { code: "P2002" }),
    );

    const result = await createItemType(INPUT);

    expect(result).toEqual({
      success: false,
      error: "You already have a type with that name",
    });
  });

  it("turns away a signed-out user", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await createItemType(INPUT);

    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("updateItemType", () => {
  it("changes only the user's own type and lets it keep its own name", async () => {
    const result = await updateItemType("type-1", INPUT);

    expect(result).toEqual({ success: true, data: { id: "type-1" } });
    expect(mocks.tx.itemType.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        name: { equals: "Recipe", mode: "insensitive" },
        id: { not: "type-1" },
      },
      select: { id: true },
    });
    expect(mocks.tx.itemType.updateMany).toHaveBeenCalledWith({
      where: { id: "type-1", userId: "user-1" },
      data: INPUT,
    });
  });

  it("answers not found for another user's or a built-in type", async () => {
    mocks.tx.itemType.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateItemType("type-2", INPUT);

    expect(result).toEqual({ success: false, error: "Type not found" });
  });

  it("asks a free user to upgrade", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: false });

    const result = await updateItemType("type-1", INPUT);

    expect(result).toMatchObject({ success: false, code: "pro_required" });
    expect(mocks.tx.itemType.updateMany).not.toHaveBeenCalled();
  });
});

describe("deleteItemType", () => {
  beforeEach(() => {
    mocks.tx.itemType.findFirst.mockResolvedValue({ id: "type-1" });
  });

  it("deletes an empty type", async () => {
    const result = await deleteItemType("type-1");

    expect(result).toEqual({ success: true, data: { id: "type-1" } });
    expect(mocks.tx.itemType.findFirst).toHaveBeenCalledWith({
      where: { id: "type-1", userId: "user-1" },
      select: { id: true },
    });
    expect(mocks.tx.itemType.delete).toHaveBeenCalledWith({
      where: { id: "type-1" },
    });
  });

  it("refuses while the type has items and says how many", async () => {
    mocks.tx.item.count.mockResolvedValue(3);

    const result = await deleteItemType("type-1");

    expect(result).toEqual({
      success: false,
      error: "Move or delete its 3 items first",
    });
    expect(mocks.tx.itemType.delete).not.toHaveBeenCalled();
  });

  it("uses the singular for one item", async () => {
    mocks.tx.item.count.mockResolvedValue(1);

    const result = await deleteItemType("type-1");

    expect(result).toMatchObject({ error: "Move or delete its 1 item first" });
  });

  it("still works for a former Pro user", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: false });

    const result = await deleteItemType("type-1");

    expect(result.success).toBe(true);
  });

  it("answers not found for another user's or a built-in type", async () => {
    mocks.tx.itemType.findFirst.mockResolvedValue(null);

    const result = await deleteItemType("type-2");

    expect(result).toEqual({ success: false, error: "Type not found" });
    expect(mocks.tx.itemType.delete).not.toHaveBeenCalled();
  });
});
