import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  consumeMutationQuota: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
    },
  },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {},
    TransactionIsolationLevel: { Serializable: "Serializable" },
  },
}));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeMutationQuota: mocks.consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE: "Too many changes, try again in a minute",
}));

import {
  deleteCollection,
  setCollectionFavorite,
  updateCollection,
} from "@/actions/collections";

const actions = {
  updateCollection: {
    run: () => updateCollection("col-1", { name: "DevOps" }),
    write: mocks.updateMany,
    failure: "Could not update the collection. Try again.",
    revalidatesDetailPage: true,
  },
  setCollectionFavorite: {
    run: () => setCollectionFavorite("col-1", true),
    write: mocks.updateMany,
    failure: "Could not update the collection. Try again.",
    revalidatesDetailPage: true,
  },
  deleteCollection: {
    run: () => deleteCollection("col-1"),
    write: mocks.deleteMany,
    failure: "Could not delete the collection. Try again.",
    revalidatesDetailPage: false,
  },
};

describe("collection mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
  });

  describe.each(Object.entries(actions))(
    "%s",
    (_name, { run, write, failure, revalidatesDetailPage }) => {
      it("rejects a signed-out user without writing", async () => {
        mocks.getSession.mockResolvedValue(null);

        const result = await run();

        expect(result.success).toBe(false);
        expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
        expect(write).not.toHaveBeenCalled();
      });

      it("returns the rate limit message without writing", async () => {
        mocks.consumeMutationQuota.mockResolvedValue(false);

        const result = await run();

        expect(result).toEqual({
          success: false,
          error: "Too many changes, try again in a minute",
        });
        expect(write).not.toHaveBeenCalled();
      });

      it("reports not found when the collection is not the user's", async () => {
        write.mockResolvedValue({ count: 0 });

        const result = await run();

        expect(result).toEqual({
          success: false,
          error: "Collection not found",
        });
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      });

      it("returns a generic error without revalidating when the write fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        write.mockRejectedValue(new Error("db down"));

        const result = await run();

        expect(result).toEqual({ success: false, error: failure });
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      });

      it("scopes the write to the signed-in user and revalidates the list views", async () => {
        const result = await run();

        expect(result).toEqual({ success: true, data: { id: "col-1" } });
        expect(write.mock.calls[0][0].where).toEqual({
          id: "col-1",
          userId: "user-1",
        });
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/collections");
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
      });

      it(
        revalidatesDetailPage
          ? "revalidates the collection detail pages"
          : "leaves the detail pages alone so the deleted page does not re-render as not found",
        async () => {
          await run();

          const revalidatedDetailPage = mocks.revalidatePath.mock.calls.some(
            ([path]) => path === "/collections/[id]",
          );
          expect(revalidatedDetailPage).toBe(revalidatesDetailPage);
        },
      );
    },
  );

  describe("updateCollection", () => {
    it("saves the trimmed name and clears an empty description", async () => {
      await updateCollection("col-1", { name: "  DevOps ", description: "" });

      expect(mocks.updateMany.mock.calls[0][0].data).toEqual({
        name: "DevOps",
        description: null,
      });
    });

    it("rejects invalid input before using the rate limit", async () => {
      const result = await updateCollection("col-1", { name: "   " });

      expect(result.success).toBe(false);
      expect(mocks.consumeMutationQuota).not.toHaveBeenCalled();
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("treats an oversized id as not found", async () => {
      const result = await updateCollection("x".repeat(65), { name: "DevOps" });

      expect(result).toEqual({
        success: false,
        error: "Collection not found",
      });
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("setCollectionFavorite", () => {
    it("stores the requested favorite value", async () => {
      await setCollectionFavorite("col-1", false);

      expect(mocks.updateMany.mock.calls[0][0].data).toEqual({
        isFavorite: false,
      });
    });

    it("rejects a value that is not a boolean", async () => {
      const result = await setCollectionFavorite(
        "col-1",
        "yes" as unknown as boolean,
      );

      expect(result.success).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });
  });
});
