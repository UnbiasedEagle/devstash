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
    collection: { count: vi.fn(), create: vi.fn() },
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

import { createCollection } from "@/actions/collections";
import { FREE_COLLECTION_LIMIT } from "@/lib/plan-limits";

describe("createCollection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.transaction.mockImplementation((run) => run(mocks.tx));
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: false });
    mocks.tx.collection.count.mockResolvedValue(0);
    mocks.tx.collection.create.mockResolvedValue({
      id: "col-1",
      name: "React Patterns",
    });
  });

  it("creates the collection for the signed-in user and revalidates the views", async () => {
    const result = await createCollection({
      name: " React Patterns ",
      description: "",
    });

    expect(result).toEqual({
      success: true,
      data: { id: "col-1", name: "React Patterns" },
    });
    expect(mocks.tx.collection.create).toHaveBeenCalledWith({
      data: { name: "React Patterns", description: null, userId: "user-1" },
      select: { id: true, name: true },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/collections");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("rejects a signed-out user without touching the database", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await createCollection({ name: "DevOps" });

    expect(result.success).toBe(false);
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid input before using the rate limit", async () => {
    const result = await createCollection({ name: "   " });

    expect(result.success).toBe(false);
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns the rate limit message when the quota is used up", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await createCollection({ name: "DevOps" });

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("blocks a free user at the collection limit", async () => {
    mocks.tx.collection.count.mockResolvedValue(FREE_COLLECTION_LIMIT);

    const result = await createCollection({ name: "DevOps" });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain(
      `${FREE_COLLECTION_LIMIT} collections`,
    );
    expect(mocks.tx.collection.create).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rechecks the free limit when a concurrent create forces a retry", async () => {
    mocks.tx.collection.count
      .mockResolvedValueOnce(FREE_COLLECTION_LIMIT - 1)
      .mockResolvedValueOnce(FREE_COLLECTION_LIMIT);
    mocks.tx.collection.create.mockRejectedValueOnce(
      new mocks.PrismaClientKnownRequestError("conflict", { code: "P2034" }),
    );

    const result = await createCollection({ name: "DevOps" });

    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain(
      `${FREE_COLLECTION_LIMIT} collections`,
    );
    expect(mocks.tx.collection.create).toHaveBeenCalledTimes(1);
  });

  it("lets a Pro user go past the free limit", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: true });
    mocks.tx.collection.count.mockResolvedValue(FREE_COLLECTION_LIMIT + 5);

    const result = await createCollection({ name: "DevOps" });

    expect(result.success).toBe(true);
    expect(mocks.tx.collection.create).toHaveBeenCalled();
  });

  it("returns a generic error when the write fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.tx.collection.create.mockRejectedValue(new Error("db down"));

    const result = await createCollection({ name: "DevOps" });

    expect(result).toEqual({
      success: false,
      error: "Could not create the collection. Try again.",
    });
  });
});
