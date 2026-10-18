import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    item: { count: vi.fn(), create: vi.fn() },
  };
  return {
    PrismaClientKnownRequestError,
    tx,
    getSession: vi.fn(),
    consumeMutationQuota: vi.fn(),
    findItemType: vi.fn(),
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
  prisma: {
    itemType: { findFirst: mocks.findItemType },
    $transaction: mocks.transaction,
  },
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

import { createItem } from "@/actions/items";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";

const validSnippet = {
  type: "Snippet",
  title: "useToggle",
  description: "Boolean toggle",
  content: "export const useToggle = () => {};",
  language: "typescript",
  tags: ["React", "hooks"],
};

function conflict(code = "P2034") {
  return new mocks.PrismaClientKnownRequestError("conflict", { code });
}

describe("createItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.findItemType.mockResolvedValue({ id: "type-snippet" });
    mocks.transaction.mockImplementation((run) => run(mocks.tx));
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: false });
    mocks.tx.item.count.mockResolvedValue(0);
    mocks.tx.item.create.mockResolvedValue({ id: "item-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await createItem(validSnippet);

    expect(result).toEqual({
      success: false,
      error: "Sign in again to create items",
    });
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid input before using the rate limit or database", async () => {
    const result = await createItem({ ...validSnippet, title: "   " });

    expect(result).toEqual({
      success: false,
      error: "Check the form and try again",
    });
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns the mutation limit message when over the limit", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await createItem(validSnippet);

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.consumeMutationQuota).toHaveBeenCalledWith("user-1");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("creates the item for the session user and ignores a user id sent by the client", async () => {
    const result = await createItem({ ...validSnippet, userId: "attacker" });

    expect(result).toEqual({
      success: true,
      data: { id: "item-1", type: "Snippet" },
    });
    const { data } = mocks.tx.item.create.mock.calls[0][0];
    expect(data).toMatchObject({
      title: "useToggle",
      description: "Boolean toggle",
      contentType: "TEXT",
      content: "export const useToggle = () => {};",
      url: null,
      language: "typescript",
      userId: "user-1",
      itemTypeId: "type-snippet",
    });
  });

  it("saves tags with connectOrCreate on the user's own tags", async () => {
    await createItem(validSnippet);

    const { data } = mocks.tx.item.create.mock.calls[0][0];
    expect(data.tags.create).toEqual([
      {
        tag: {
          connectOrCreate: {
            where: { userId_name: { userId: "user-1", name: "react" } },
            create: { name: "react", userId: "user-1" },
          },
        },
      },
      {
        tag: {
          connectOrCreate: {
            where: { userId_name: { userId: "user-1", name: "hooks" } },
            create: { name: "hooks", userId: "user-1" },
          },
        },
      },
    ]);
  });

  it("stores a URL item with the URL content type and no content", async () => {
    mocks.findItemType.mockResolvedValue({ id: "type-url" });

    await createItem({
      type: "URL",
      title: "Docs",
      url: "https://example.com",
      tags: [],
    });

    const { data } = mocks.tx.item.create.mock.calls[0][0];
    expect(data).toMatchObject({
      contentType: "URL",
      content: null,
      url: "https://example.com",
      language: null,
      itemTypeId: "type-url",
    });
  });

  it("looks the type up among system types only", async () => {
    await createItem(validSnippet);

    expect(mocks.findItemType).toHaveBeenCalledWith({
      where: { name: "Snippet", userId: null },
      select: { id: true },
    });
  });

  it("revalidates the dashboard and the type page after creating", async () => {
    await createItem(validSnippet);

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/items/snippet");
  });

  describe("free plan limit", () => {
    it("blocks a free user at the limit with a clear message", async () => {
      mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT);

      const result = await createItem(validSnippet);

      expect(result).toEqual({
        success: false,
        error: `The free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro to add more.`,
      });
      expect(mocks.tx.item.create).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("allows a free user one item below the limit", async () => {
      mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT - 1);

      const result = await createItem(validSnippet);

      expect(result.success).toBe(true);
    });

    it("lets Pro users go past the limit", async () => {
      mocks.tx.user.findUnique.mockResolvedValue({ isPro: true });
      mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT * 10);

      const result = await createItem(validSnippet);

      expect(result.success).toBe(true);
      expect(mocks.tx.item.create).toHaveBeenCalledTimes(1);
    });

    it("runs the check and the insert in one Serializable transaction", async () => {
      await createItem(validSnippet);

      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(mocks.transaction.mock.calls[0][1]).toEqual({
        isolationLevel: "Serializable",
      });
    });
  });

  describe("retries", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // The retry backoff uses timers, so they are advanced instead of waited for
    async function createWithTimers() {
      const pending = createItem(validSnippet);
      await vi.runAllTimersAsync();
      return pending;
    }

    it("retries a Serializable write conflict and then succeeds", async () => {
      mocks.transaction
        .mockRejectedValueOnce(conflict("P2034"))
        .mockImplementation((run) => run(mocks.tx));

      const result = await createWithTimers();

      expect(result.success).toBe(true);
      expect(mocks.transaction).toHaveBeenCalledTimes(2);
    });

    it("retries when two creates race to insert the same new tag", async () => {
      mocks.transaction
        .mockRejectedValueOnce(conflict("P2002"))
        .mockImplementation((run) => run(mocks.tx));

      const result = await createWithTimers();

      expect(result.success).toBe(true);
      expect(mocks.transaction).toHaveBeenCalledTimes(2);
    });

    it("gives up after three attempts with a generic error", async () => {
      mocks.transaction.mockRejectedValue(conflict("P2034"));

      const result = await createWithTimers();

      expect(result).toEqual({
        success: false,
        error: "Could not create the item. Try again.",
      });
      expect(mocks.transaction).toHaveBeenCalledTimes(3);
    });

    it("does not retry other database errors", async () => {
      mocks.transaction.mockRejectedValue(conflict("P2025"));

      await createItem(validSnippet);

      expect(mocks.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("never exposes database messages", async () => {
      mocks.transaction.mockRejectedValue(
        new Error(
          "connect ECONNREFUSED postgres://user:secret@db.internal:5432",
        ),
      );

      const result = await createItem(validSnippet);

      expect(result).toEqual({
        success: false,
        error: "Could not create the item. Try again.",
      });
      expect(JSON.stringify(result)).not.toContain("secret");
    });

    it("returns a generic error when the item type is missing", async () => {
      mocks.findItemType.mockResolvedValue(null);

      const result = await createItem(validSnippet);

      expect(result).toEqual({
        success: false,
        error: "Could not create the item. Try again.",
      });
      expect(mocks.transaction).not.toHaveBeenCalled();
    });
  });
});
