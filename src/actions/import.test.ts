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
    item: { count: vi.fn(), createMany: vi.fn() },
  };
  return {
    PrismaClientKnownRequestError,
    tx,
    getSession: vi.fn(),
    consumeMutationQuota: vi.fn(),
    findTypes: vi.fn(),
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
    itemType: { findMany: mocks.findTypes },
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

import { importItems } from "@/actions/import";
import { MAX_IMPORT_FILES } from "@/lib/import-rules";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";

const notes = { fileName: "ideas.md", content: "# Ideas\n\nWrite more" };
const script = { fileName: "deploy.sh", content: "npm run build" };

function files(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    fileName: `file-${index}.md`,
    content: `text ${index}`,
  }));
}

function savedData() {
  return mocks.tx.item.createMany.mock.calls[0][0].data;
}

describe("importItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.findTypes.mockResolvedValue([
      { id: "type-note", name: "Note" },
      { id: "type-snippet", name: "Snippet" },
    ]);
    mocks.transaction.mockImplementation((run) => run(mocks.tx));
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: false });
    mocks.tx.item.count.mockResolvedValue(0);
    mocks.tx.item.createMany.mockResolvedValue({ count: 2 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await importItems({ files: [notes] });

    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("saves Markdown as a Note and code as a Snippet with its language", async () => {
    const result = await importItems({ files: [notes, script] });

    expect(result).toEqual({ success: true, data: { imported: 2 } });
    expect(savedData()).toEqual([
      {
        title: "ideas",
        content: "# Ideas\n\nWrite more",
        contentType: "TEXT",
        language: null,
        userId: "user-1",
        itemTypeId: "type-note",
      },
      {
        title: "deploy",
        content: "npm run build",
        contentType: "TEXT",
        language: "bash",
        userId: "user-1",
        itemTypeId: "type-snippet",
      },
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("saves the trimmed text and not the raw text", async () => {
    await importItems({
      files: [{ fileName: "a.txt", content: "\n\n  hello  \n" }],
    });

    expect(savedData()[0].content).toBe("hello");
  });

  it.each([
    ["no files", []],
    [`${MAX_IMPORT_FILES + 1} files`, files(MAX_IMPORT_FILES + 1)],
  ])("refuses %s without saving anything", async (_label, list) => {
    const result = await importItems({ files: list });

    expect(result).toEqual({
      success: false,
      error: "Check the files and try again",
    });
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("accepts the largest allowed import", async () => {
    mocks.tx.item.createMany.mockResolvedValue({ count: MAX_IMPORT_FILES });
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: true });

    const result = await importItems({ files: files(MAX_IMPORT_FILES) });

    expect(result).toEqual({
      success: true,
      data: { imported: MAX_IMPORT_FILES },
    });
  });

  it.each([
    ["an unsupported file", { fileName: "photo.png", content: "x" }],
    ["an empty file", { fileName: "empty.md", content: "  " }],
    ["a binary file", { fileName: "bin.txt", content: "a\0b" }],
  ])(
    "refuses the whole import for %s and names the file",
    async (_label, bad) => {
      const result = await importItems({ files: [notes, bad] });

      expect(result.success).toBe(false);
      expect(!result.success && result.error).toContain(bad.fileName);
      expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );

  it("answers a rate limit without saving", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await importItems({ files: [notes] });

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("turns a free user away when the import would pass the limit, and says how many fit", async () => {
    mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT - 1);

    const result = await importItems({ files: [notes, script] });

    expect(result).toEqual({
      success: false,
      error:
        "You can add 1 more item on the free plan. Upgrade to Pro to add more.",
      code: "free_limit",
    });
    expect(mocks.tx.item.createMany).not.toHaveBeenCalled();
  });

  it("says there is no room left for a free user at the limit", async () => {
    mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT);

    const result = await importItems({ files: [notes] });

    expect(result).toMatchObject({
      success: false,
      code: "free_limit",
      error: expect.stringContaining("no room left"),
    });
  });

  it("lets a free user fill the plan exactly", async () => {
    mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT - 2);

    const result = await importItems({ files: [notes, script] });

    expect(result.success).toBe(true);
  });

  it("has no limit for a Pro user and doesn't count their items", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ isPro: true });
    mocks.tx.item.count.mockResolvedValue(FREE_ITEM_LIMIT + 100);

    const result = await importItems({ files: [notes, script] });

    expect(result.success).toBe(true);
    expect(mocks.tx.item.count).not.toHaveBeenCalled();
  });

  it("retries a write conflict and then saves", async () => {
    mocks.transaction
      .mockRejectedValueOnce(
        new mocks.PrismaClientKnownRequestError("conflict", { code: "P2034" }),
      )
      .mockImplementation((run) => run(mocks.tx));

    const result = await importItems({ files: [notes] });

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("returns a friendly error when saving fails", async () => {
    mocks.transaction.mockRejectedValue(new Error("database down"));

    const result = await importItems({ files: [notes] });

    expect(result).toEqual({
      success: false,
      error: "Could not import the files. Try again.",
    });
  });

  it("returns a friendly error when the system types are missing", async () => {
    mocks.findTypes.mockResolvedValue([]);

    const result = await importItems({ files: [notes] });

    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("refuses a file name with a null character without saving anything", async () => {
    const result = await importItems({
      files: [notes, { fileName: "a\0b.md", content: "x" }],
    });

    expect(result.success).toBe(false);
    expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
