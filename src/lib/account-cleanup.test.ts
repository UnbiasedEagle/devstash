import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteBillingAccount: vi.fn(),
  listObjectKeys: vi.fn(),
  deleteObjects: vi.fn(),
}));

vi.mock("@/lib/billing-cleanup", () => ({
  deleteBillingAccount: mocks.deleteBillingAccount,
}));
vi.mock("@/lib/storage", () => ({
  listObjectKeys: mocks.listObjectKeys,
  deleteObjects: mocks.deleteObjects,
}));

import { deleteAccountData, deleteUserFiles } from "@/lib/account-cleanup";

const empty = { keys: [], nextToken: undefined };

describe("deleteUserFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.listObjectKeys.mockResolvedValue(empty);
    mocks.deleteObjects.mockResolvedValue(undefined);
  });

  it("looks under the user's own folders only, with a trailing slash", async () => {
    await deleteUserFiles("user-1");

    expect(
      new Set(mocks.listObjectKeys.mock.calls.map(([prefix]) => prefix)),
    ).toEqual(new Set(["files/user-1/", "pending/user-1/"]));
  });

  it("deletes every page of keys before moving on, in both folders", async () => {
    mocks.listObjectKeys
      .mockResolvedValueOnce({
        keys: ["files/user-1/a", "files/user-1/b"],
        nextToken: "t1",
      })
      .mockResolvedValueOnce({ keys: ["files/user-1/c"], nextToken: "t2" })
      .mockResolvedValueOnce({ keys: ["files/user-1/d"], nextToken: undefined })
      .mockResolvedValueOnce(empty)
      .mockResolvedValueOnce({
        keys: ["pending/user-1/e"],
        nextToken: undefined,
      });

    await deleteUserFiles("user-1");

    expect(mocks.listObjectKeys.mock.calls).toEqual([
      ["files/user-1/", undefined],
      ["files/user-1/", "t1"],
      ["files/user-1/", "t2"],
      ["files/user-1/"],
      ["pending/user-1/", undefined],
      ["pending/user-1/"],
    ]);
    expect(mocks.deleteObjects.mock.calls).toEqual([
      [["files/user-1/a", "files/user-1/b"]],
      [["files/user-1/c"]],
      [["files/user-1/d"]],
      [["pending/user-1/e"]],
    ]);
  });

  it("finishes without deleting anything for a user with no files", async () => {
    await deleteUserFiles("user-1");

    expect(mocks.deleteObjects).toHaveBeenCalledWith([]);
  });

  it("fails when a file turns up after the sweep, so the account isn't deleted with it left behind", async () => {
    mocks.listObjectKeys.mockResolvedValueOnce(empty).mockResolvedValueOnce({
      keys: ["files/user-1/late"],
      nextToken: undefined,
    });

    await expect(deleteUserFiles("user-1")).rejects.toThrow(
      "Files appeared under files/user-1/ during cleanup",
    );
  });

  it("stops at the first failure and lets it through", async () => {
    mocks.listObjectKeys.mockResolvedValueOnce({
      keys: ["files/user-1/a"],
      nextToken: undefined,
    });
    mocks.deleteObjects.mockRejectedValue(new Error("R2 is down"));

    await expect(deleteUserFiles("user-1")).rejects.toThrow("R2 is down");
    expect(mocks.listObjectKeys).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAccountData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.deleteBillingAccount.mockResolvedValue(undefined);
    mocks.listObjectKeys.mockResolvedValue(empty);
    mocks.deleteObjects.mockResolvedValue(undefined);
  });

  it("cancels billing first and then deletes the files", async () => {
    await deleteAccountData({ id: "user-1" });

    expect(mocks.deleteBillingAccount).toHaveBeenCalledWith({ id: "user-1" });
    expect(mocks.deleteBillingAccount.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listObjectKeys.mock.invocationCallOrder[0],
    );
  });

  it("leaves the files alone when billing fails, so a failed account deletion loses nothing", async () => {
    mocks.deleteBillingAccount.mockRejectedValue(new Error("Stripe is down"));

    await expect(deleteAccountData({ id: "user-1" })).rejects.toThrow(
      "Stripe is down",
    );
    expect(mocks.listObjectKeys).not.toHaveBeenCalled();
  });

  it("stops the account deletion with a friendly error when the files can't be deleted", async () => {
    mocks.listObjectKeys.mockRejectedValue(new Error("R2 credentials wrong"));

    await expect(deleteAccountData({ id: "user-1" })).rejects.toMatchObject({
      message: expect.stringContaining("Could not delete your files"),
    });
    expect(
      await deleteAccountData({ id: "user-1" }).catch((error) => error.message),
    ).not.toContain("credentials");
  });

  it("logs the user and the cause when the files can't be deleted", async () => {
    mocks.listObjectKeys.mockRejectedValue(new Error("R2 is down"));

    await deleteAccountData({ id: "user-1" }).catch(() => {});

    expect(console.error).toHaveBeenCalledWith(
      "Failed to delete a user's files before account deletion",
      expect.objectContaining({ userId: "user-1" }),
    );
  });
});
