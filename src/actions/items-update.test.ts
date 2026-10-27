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
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    tagDeleteMany: vi.fn(),
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
    item: {
      findFirst: mocks.findFirst,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
    tag: { deleteMany: mocks.tagDeleteMany },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
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

import { setItemFavorite, setItemPinned, updateItem } from "@/actions/items";

const validSnippet = {
  type: "Snippet",
  title: "useToggle",
  description: "",
  content: "export const useToggle = () => {};",
  language: "typescript",
  tags: ["React", "hooks"],
};

describe("updateItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.findFirst.mockResolvedValue({
      itemType: { name: "Snippet" },
      tags: [],
    });
    mocks.update.mockResolvedValue({ id: "item-1" });
    mocks.tagDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await updateItem("item-1", validSnippet);

    expect(result.success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects invalid input before the rate limit or database", async () => {
    const result = await updateItem("item-1", { ...validSnippet, title: " " });

    expect(result).toEqual({
      success: false,
      error: "Check the form and try again",
    });
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("stops at the mutation limit", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await updateItem("item-1", validSnippet);

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns Item not found for an item that isn't the user's", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await updateItem("someone-elses-item", validSnippet);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "someone-elses-item", userId: "user-1" },
      }),
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("refuses to change an item's type", async () => {
    mocks.findFirst.mockResolvedValue({ itemType: { name: "Note" } });

    const result = await updateItem("item-1", validSnippet);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("scopes the update to the session user and replaces the tag set", async () => {
    const result = await updateItem("item-1", validSnippet);

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    const { where, data } = mocks.update.mock.calls[0][0];
    expect(where).toEqual({ id: "item-1", userId: "user-1" });
    expect(data.tags.deleteMany).toEqual({});
    expect(data.tags.create).toEqual(
      ["react", "hooks"].map((name) => ({
        tag: {
          connectOrCreate: {
            where: { userId_name: { userId: "user-1", name } },
            create: { name, userId: "user-1" },
          },
        },
      })),
    );
  });

  it("removes only the dropped tags that no other item uses", async () => {
    mocks.findFirst.mockResolvedValue({
      itemType: { name: "Snippet" },
      tags: [{ tagId: "tag-old" }, { tagId: "tag-kept" }],
    });

    await updateItem("item-1", validSnippet);

    expect(mocks.tagDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        id: { in: ["tag-old", "tag-kept"] },
        items: { none: {} },
      },
    });
  });

  it("clears an emptied description and the fields the type doesn't use", async () => {
    mocks.findFirst.mockResolvedValue({ itemType: { name: "URL" }, tags: [] });

    await updateItem("item-1", {
      type: "URL",
      title: "Docs",
      description: "",
      url: "https://example.com",
      tags: [],
    });

    const { data } = mocks.update.mock.calls[0][0];
    expect(data).toMatchObject({
      description: null,
      content: null,
      language: null,
      url: "https://example.com",
    });
  });

  it("keeps a language outside the form's list when the edit doesn't touch it", async () => {
    mocks.findFirst.mockResolvedValue({
      language: "tsx",
      itemType: { name: "Snippet" },
      tags: [],
    });

    await updateItem("item-1", { ...validSnippet, language: undefined });

    expect(mocks.update.mock.calls[0][0].data.language).toBe("tsx");
  });

  it("lets a listed language be changed or cleared", async () => {
    mocks.findFirst.mockResolvedValue({
      language: "python",
      itemType: { name: "Snippet" },
      tags: [],
    });

    await updateItem("item-1", { ...validSnippet, language: undefined });

    expect(mocks.update.mock.calls[0][0].data.language).toBeNull();
  });

  it("returns Item not found when the item is deleted before the write", async () => {
    mocks.update.mockRejectedValue(
      new mocks.PrismaClientKnownRequestError("gone", { code: "P2025" }),
    );

    const result = await updateItem("item-1", validSnippet);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns Item not found for a malformed id", async () => {
    const result = await updateItem("", validSnippet);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("revalidates the dashboard and every type page", async () => {
    await updateItem("item-1", validSnippet);

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/items/[type]", "page");
  });

  it("retries when two edits race to insert the same new tag", async () => {
    mocks.update
      .mockRejectedValueOnce(
        new mocks.PrismaClientKnownRequestError("race", { code: "P2002" }),
      )
      .mockResolvedValue({ id: "item-1" });

    const result = await updateItem("item-1", validSnippet);

    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });

  it("retries when a delete removes a tag as unused before the edit links it", async () => {
    mocks.update
      .mockRejectedValueOnce(
        new mocks.PrismaClientKnownRequestError("fk", { code: "P2003" }),
      )
      .mockResolvedValue({ id: "item-1" });

    const result = await updateItem("item-1", validSnippet);

    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });

  it("never exposes database messages", async () => {
    mocks.update.mockRejectedValue(new Error("postgres://user:secret@db"));

    const result = await updateItem("item-1", validSnippet);

    expect(result).toEqual({
      success: false,
      error: "Could not update the item. Try again.",
    });
  });
});

describe.each([
  ["setItemFavorite", setItemFavorite, "isFavorite"],
  ["setItemPinned", setItemPinned, "isPinned"],
] as const)("%s", (_name, action, field) => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates only its own flag, scoped to the session user", async () => {
    const result = await action("item-1", true);

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      data: { [field]: true },
    });
  });

  it("returns Item not found when no row belongs to the user", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await action("someone-elses-item", true);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("stops at the mutation limit", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await action("item-1", true);

    expect(result.success).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await action("item-1", true);

    expect(result.success).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
