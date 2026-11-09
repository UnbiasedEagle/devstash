import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/stripe", () => ({
  stripe: { customers: { del: mocks.del } },
}));

import { deleteBillingAccount } from "@/lib/billing-cleanup";

describe("deleteBillingAccount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findUnique.mockResolvedValue({ stripeCustomerId: "cus_1" });
    mocks.del.mockResolvedValue({ id: "cus_1", deleted: true });
  });

  it("does nothing for a user who never had a Stripe customer", async () => {
    mocks.findUnique.mockResolvedValue({ stripeCustomerId: null });

    await deleteBillingAccount({ id: "user-1" });

    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("deletes the user's Stripe customer, which cancels all its subscriptions", async () => {
    await deleteBillingAccount({ id: "user-1" });

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { stripeCustomerId: true },
    });
    expect(mocks.del).toHaveBeenCalledWith("cus_1");
  });

  it("stops the deletion with a friendly error when Stripe fails", async () => {
    mocks.del.mockRejectedValue(new Error("Stripe is down"));

    await expect(deleteBillingAccount({ id: "user-1" })).rejects.toMatchObject({
      message: expect.stringContaining("Could not cancel your subscription"),
    });
  });

  it("stops the deletion when the user can't be read", async () => {
    mocks.findUnique.mockRejectedValue(new Error("db down"));

    await expect(deleteBillingAccount({ id: "user-1" })).rejects.toThrow();
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("lets the deletion go ahead when the customer is already gone from Stripe", async () => {
    mocks.del.mockRejectedValue(
      Object.assign(new Error("No such customer"), {
        code: "resource_missing",
      }),
    );

    await expect(
      deleteBillingAccount({ id: "user-1" }),
    ).resolves.toBeUndefined();
  });
});
