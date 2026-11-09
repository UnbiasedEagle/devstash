import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  consumeMutationQuota: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  createCustomer: vi.fn(),
  createSession: vi.fn(),
  listSubscriptions: vi.fn(),
  createPortal: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/env", () => ({
  authEnv: { BETTER_AUTH_URL: "http://localhost:3000" },
  stripeEnv: {
    STRIPE_PRICE_MONTHLY: "price_month",
    STRIPE_PRICE_YEARLY: "price_year",
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique, updateMany: mocks.updateMany },
  },
}));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeMutationQuota: mocks.consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE: "Too many changes, try again in a minute",
}));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: mocks.createCustomer },
    checkout: { sessions: { create: mocks.createSession } },
    subscriptions: { list: mocks.listSubscriptions },
    billingPortal: { sessions: { create: mocks.createPortal } },
  },
}));

import { createCheckoutSession, createPortalSession } from "@/actions/billing";

const freeUser = {
  id: "user-1",
  email: "dev@example.com",
  name: "Dev",
  isPro: false,
  stripeCustomerId: null,
};

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.findUnique.mockResolvedValue(freeUser);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.createCustomer.mockResolvedValue({ id: "cus_new" });
    mocks.createSession.mockResolvedValue({ url: "https://checkout.test/s" });
    mocks.listSubscriptions.mockResolvedValue({ data: [] });
  });

  it("rejects a signed-out user without calling Stripe", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Sign in again to upgrade",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it.each(["weekly", undefined, 5])("rejects the plan %j", async (plan) => {
    const result = await createCheckoutSession(plan);

    expect(result.success).toBe(false);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("stops when the mutation limit is used up", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects a user who is already Pro", async () => {
    mocks.findUnique.mockResolvedValue({ ...freeUser, isPro: true });

    const result = await createCheckoutSession("yearly");

    expect(result).toEqual({
      success: false,
      error: "You are already on Pro",
    });
    expect(mocks.createCustomer).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates and saves a customer when the user has none", async () => {
    await createCheckoutSession("monthly");

    expect(mocks.createCustomer).toHaveBeenCalledWith(
      {
        email: "dev@example.com",
        name: "Dev",
        metadata: { userId: "user-1" },
      },
      {
        idempotencyKey: expect.stringMatching(/^customer-user-1-[0-9a-f]{32}$/),
      },
    );
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", stripeCustomerId: null },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new" }),
    );
  });

  describe("customer idempotency key", () => {
    async function keyFor(user: typeof freeUser) {
      mocks.findUnique.mockResolvedValue(user);
      mocks.createCustomer.mockClear();
      await createCheckoutSession("monthly");
      return mocks.createCustomer.mock.calls[0][1].idempotencyKey as string;
    }

    it("is the same for repeated checkouts so concurrent ones share a customer", async () => {
      expect(await keyFor(freeUser)).toBe(await keyFor(freeUser));
    });

    it("changes when the customer details change", async () => {
      const first = await keyFor(freeUser);
      const second = await keyFor({ ...freeUser, email: "new@example.com" });

      expect(second).not.toBe(first);
    });
  });

  it("reuses the saved customer", async () => {
    mocks.findUnique.mockResolvedValue({
      ...freeUser,
      stripeCustomerId: "cus_saved",
    });

    await createCheckoutSession("monthly");

    expect(mocks.createCustomer).not.toHaveBeenCalled();
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_saved" }),
    );
  });

  it("uses the customer another checkout saved first", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findUnique
      .mockResolvedValueOnce(freeUser)
      .mockResolvedValueOnce({ stripeCustomerId: "cus_winner" });

    await createCheckoutSession("monthly");

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_winner" }),
    );
  });

  it.each([
    ["monthly", "price_month"],
    ["yearly", "price_year"],
  ])(
    "starts a %s subscription checkout and returns its URL",
    async (plan, price) => {
      const result = await createCheckoutSession(plan);

      expect(result).toEqual({
        success: true,
        data: { url: "https://checkout.test/s" },
      });
      expect(mocks.createSession).toHaveBeenCalledWith({
        mode: "subscription",
        customer: "cus_new",
        client_reference_id: "user-1",
        line_items: [{ price, quantity: 1 }],
        subscription_data: { metadata: { userId: "user-1" } },
        success_url: "http://localhost:3000/profile?checkout=success",
        cancel_url: "http://localhost:3000/profile?checkout=cancelled",
      });
    },
  );

  it("returns a friendly error and not the Stripe message when Stripe fails", async () => {
    mocks.createSession.mockRejectedValue(new Error("No such price: price_x"));

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Could not start checkout. Try again.",
    });
  });

  it("fails when Stripe returns no checkout URL", async () => {
    mocks.createSession.mockResolvedValue({ url: null });

    const result = await createCheckoutSession("monthly");

    expect(result.success).toBe(false);
  });

  it("returns a friendly error when the customer can't be created", async () => {
    mocks.createCustomer.mockRejectedValue(new Error("Stripe is down"));

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Could not start checkout. Try again.",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  describe("with a saved customer", () => {
    beforeEach(() => {
      mocks.findUnique.mockResolvedValue({
        ...freeUser,
        stripeCustomerId: "cus_saved",
      });
    });

    it.each(["active", "trialing", "past_due"])(
      "blocks a second checkout while a %s subscription exists",
      async (status) => {
        mocks.listSubscriptions.mockResolvedValue({ data: [{ status }] });

        const result = await createCheckoutSession("monthly");

        expect(result).toEqual({
          success: false,
          error: "Your subscription is being activated. Refresh in a moment.",
        });
        expect(mocks.listSubscriptions).toHaveBeenCalledWith(
          expect.objectContaining({ customer: "cus_saved", status: "all" }),
        );
        expect(mocks.createSession).not.toHaveBeenCalled();
      },
    );

    it("allows a checkout when every earlier subscription has ended", async () => {
      mocks.listSubscriptions.mockResolvedValue({
        data: [{ status: "canceled" }, { status: "incomplete_expired" }],
      });

      const result = await createCheckoutSession("monthly");

      expect(result.success).toBe(true);
    });

    it("skips the subscription lookup for a brand new customer", async () => {
      mocks.findUnique.mockResolvedValue(freeUser);

      await createCheckoutSession("monthly");

      expect(mocks.listSubscriptions).not.toHaveBeenCalled();
    });

    it("starts over with a new customer when the saved one no longer exists in Stripe", async () => {
      mocks.listSubscriptions.mockRejectedValueOnce(
        Object.assign(new Error("No such customer"), {
          code: "resource_missing",
        }),
      );

      const result = await createCheckoutSession("monthly");

      expect(mocks.updateMany).toHaveBeenCalledWith({
        where: { id: "user-1", stripeCustomerId: "cus_saved" },
        data: { stripeCustomerId: null },
      });
      expect(mocks.createCustomer).toHaveBeenCalledTimes(1);
      expect(mocks.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ customer: "cus_new" }),
      );
      expect(result.success).toBe(true);
    });

    it("uses a different idempotency key than the dead customer's creation so Stripe doesn't replay it", async () => {
      mocks.findUnique.mockResolvedValue(freeUser);
      await createCheckoutSession("monthly");
      const firstKey = mocks.createCustomer.mock.calls[0][1].idempotencyKey;

      mocks.createCustomer.mockClear();
      mocks.findUnique.mockResolvedValue({
        ...freeUser,
        stripeCustomerId: "cus_new",
      });
      mocks.listSubscriptions.mockRejectedValueOnce(
        Object.assign(new Error("No such customer"), {
          code: "resource_missing",
        }),
      );
      await createCheckoutSession("monthly");

      expect(mocks.createCustomer.mock.calls[0][1].idempotencyKey).not.toBe(
        firstKey,
      );
    });

    it("does not retry on other Stripe errors", async () => {
      mocks.listSubscriptions.mockRejectedValue(new Error("rate limited"));

      const result = await createCheckoutSession("monthly");

      expect(result.success).toBe(false);
      expect(mocks.createCustomer).not.toHaveBeenCalled();
    });
  });
});

describe("createPortalSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeMutationQuota.mockResolvedValue(true);
    mocks.findUnique.mockResolvedValue({ stripeCustomerId: "cus_saved" });
    mocks.createPortal.mockResolvedValue({ url: "https://portal.test/p" });
  });

  it("rejects a signed-out user without calling Stripe", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "Sign in again to manage billing",
    });
    expect(mocks.createPortal).not.toHaveBeenCalled();
  });

  it("stops when the mutation limit is used up", async () => {
    mocks.consumeMutationQuota.mockResolvedValue(false);

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "Too many changes, try again in a minute",
    });
    expect(mocks.createPortal).not.toHaveBeenCalled();
  });

  it("rejects a user who has no Stripe customer", async () => {
    mocks.findUnique.mockResolvedValue({ stripeCustomerId: null });

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "You have no billing account yet",
    });
    expect(mocks.createPortal).not.toHaveBeenCalled();
  });

  it("opens the portal for the saved customer and returns to the profile page", async () => {
    const result = await createPortalSession();

    expect(result).toEqual({
      success: true,
      data: { url: "https://portal.test/p" },
    });
    expect(mocks.createPortal).toHaveBeenCalledWith({
      customer: "cus_saved",
      return_url: "http://localhost:3000/profile",
    });
  });

  it("returns a friendly error and not the Stripe message when Stripe fails", async () => {
    mocks.createPortal.mockRejectedValue(
      new Error("No configuration provided"),
    );

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "Could not open billing. Try again.",
    });
  });
});
