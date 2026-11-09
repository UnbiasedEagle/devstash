import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  retrieve: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
  },
}));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: { retrieve: mocks.retrieve, list: mocks.list },
  },
}));

import { handleStripeEvent } from "@/lib/stripe-webhook";

const freeUser = {
  id: "user-1",
  isPro: false,
  stripeCustomerId: "cus_1",
  stripeSubscriptionId: null,
};
const proUser = { ...freeUser, isPro: true, stripeSubscriptionId: "sub_1" };

const REVOKE_WRITE = {
  where: { id: "user-1", stripeSubscriptionId: "sub_1" },
  data: { isPro: false, stripeSubscriptionId: null },
};

function subscription(
  status: Stripe.Subscription.Status,
  overrides: Partial<Stripe.Subscription> = {},
) {
  return {
    id: "sub_1",
    customer: "cus_1",
    status,
    metadata: {},
    ...overrides,
  } as Stripe.Subscription;
}

function event(type: string, object: unknown) {
  return { id: "evt_1", type, data: { object } } as Stripe.Event;
}

function checkoutEvent(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return event("checkout.session.completed", {
    mode: "subscription",
    payment_status: "paid",
    subscription: "sub_1",
    client_reference_id: "user-1",
    ...overrides,
  });
}

describe("handleStripeEvent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.findUnique.mockResolvedValue(freeUser);
    mocks.findFirst.mockResolvedValue(null);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.retrieve.mockResolvedValue(subscription("active"));
    mocks.list.mockResolvedValue({ data: [] });
  });

  describe("granting Pro", () => {
    it("turns Pro on and saves the subscription when checkout completes", async () => {
      const changed = await handleStripeEvent(checkoutEvent());

      expect(changed).toBe(true);
      expect(mocks.retrieve).toHaveBeenCalledWith("sub_1");
      expect(mocks.updateMany).toHaveBeenCalledWith({
        where: {
          id: "user-1",
          OR: [
            { stripeSubscriptionId: null },
            { stripeSubscriptionId: "sub_1" },
          ],
        },
        data: {
          isPro: true,
          stripeSubscriptionId: "sub_1",
          stripeCustomerId: "cus_1",
        },
      });
    });

    it("turns Pro on for an active subscription update", async () => {
      const changed = await handleStripeEvent(
        event("customer.subscription.updated", subscription("active")),
      );

      expect(changed).toBe(true);
      expect(mocks.updateMany).toHaveBeenCalledTimes(1);
    });

    it("treats a trialing subscription as Pro", async () => {
      mocks.retrieve.mockResolvedValue(subscription("trialing"));

      await handleStripeEvent(
        event("customer.subscription.updated", subscription("trialing")),
      );

      expect(mocks.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPro: true }),
        }),
      );
    });

    it("ignores a checkout whose payment hasn't been made", async () => {
      const changed = await handleStripeEvent(
        checkoutEvent({ payment_status: "unpaid" }),
      );

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("ignores a checkout that isn't a subscription", async () => {
      const changed = await handleStripeEvent(
        checkoutEvent({ mode: "payment", subscription: null }),
      );

      expect(changed).toBe(false);
      expect(mocks.retrieve).not.toHaveBeenCalled();
    });

    it("reports no change when another event already took the write", async () => {
      mocks.updateMany.mockResolvedValue({ count: 0 });

      const changed = await handleStripeEvent(checkoutEvent());

      expect(changed).toBe(false);
    });
  });

  describe("finding the user", () => {
    it("falls back to the checkout reference only for a user with no customer saved", async () => {
      mocks.findUnique.mockResolvedValue(null);
      mocks.findFirst.mockResolvedValue({
        ...freeUser,
        stripeCustomerId: null,
      });

      await handleStripeEvent(checkoutEvent());

      expect(mocks.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1", stripeCustomerId: null },
        }),
      );
      expect(mocks.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stripeCustomerId: "cus_1" }),
        }),
      );
    });

    it("doesn't bind a customer to a user who already has a different one", async () => {
      mocks.findUnique.mockResolvedValue(null);
      mocks.findFirst.mockResolvedValue(null);

      const changed = await handleStripeEvent(checkoutEvent());

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("doesn't trust a user id in the subscription metadata", async () => {
      mocks.findUnique.mockResolvedValue(null);
      mocks.retrieve.mockResolvedValue(
        subscription("active", { metadata: { userId: "user-1" } }),
      );

      const changed = await handleStripeEvent(
        event(
          "customer.subscription.updated",
          subscription("active", { metadata: { userId: "user-1" } }),
        ),
      );

      expect(changed).toBe(false);
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("revoking Pro", () => {
    beforeEach(() => {
      mocks.findUnique.mockResolvedValue(proUser);
    });

    it.each(["canceled", "unpaid", "incomplete_expired"] as const)(
      "turns Pro off and clears the subscription for a %s update",
      async (status) => {
        mocks.retrieve.mockResolvedValue(subscription(status));

        const changed = await handleStripeEvent(
          event("customer.subscription.updated", subscription(status)),
        );

        expect(changed).toBe(true);
        expect(mocks.updateMany).toHaveBeenCalledWith(REVOKE_WRITE);
      },
    );

    it("turns Pro off when the subscription is deleted, without re-reading it", async () => {
      const changed = await handleStripeEvent(
        event("customer.subscription.deleted", subscription("canceled")),
      );

      expect(changed).toBe(true);
      expect(mocks.retrieve).not.toHaveBeenCalled();
      expect(mocks.updateMany).toHaveBeenCalledWith(REVOKE_WRITE);
    });

    it("keeps Pro while a cancellation is only scheduled for the period end", async () => {
      const scheduled = subscription("active", { cancel_at_period_end: true });
      mocks.retrieve.mockResolvedValue(scheduled);

      const changed = await handleStripeEvent(
        event("customer.subscription.updated", scheduled),
      );

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("keeps Pro while a payment is being retried", async () => {
      mocks.retrieve.mockResolvedValue(subscription("past_due"));

      const changed = await handleStripeEvent(
        event("customer.subscription.updated", subscription("past_due")),
      );

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("doesn't revoke the current subscription for a late event about an older one", async () => {
      const older = subscription("canceled", { id: "sub_old" });

      const changed = await handleStripeEvent(
        event("customer.subscription.deleted", older),
      );

      expect(changed).toBe(false);
      expect(mocks.list).not.toHaveBeenCalled();
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("two subscriptions on one customer", () => {
    it("keeps the current subscription when another one becomes active", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.retrieve.mockResolvedValue(subscription("active", { id: "sub_2" }));

      const changed = await handleStripeEvent(
        event(
          "customer.subscription.updated",
          subscription("active", { id: "sub_2" }),
        ),
      );

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("hands Pro to the remaining live subscription when the current one ends", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.list.mockResolvedValue({
        data: [
          subscription("canceled"),
          subscription("canceled", { id: "sub_3" }),
          subscription("active", { id: "sub_2" }),
        ],
      });

      const changed = await handleStripeEvent(
        event("customer.subscription.deleted", subscription("canceled")),
      );

      expect(changed).toBe(true);
      expect(mocks.list).toHaveBeenCalledWith(
        expect.objectContaining({ customer: "cus_1", status: "all" }),
      );
      expect(mocks.updateMany).toHaveBeenCalledWith({
        where: { id: "user-1", stripeSubscriptionId: "sub_1" },
        data: { isPro: true, stripeSubscriptionId: "sub_2" },
      });
    });

    it("turns Pro off when no other subscription is live", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.list.mockResolvedValue({
        data: [
          subscription("canceled"),
          subscription("past_due", { id: "sub_2" }),
        ],
      });

      await handleStripeEvent(
        event("customer.subscription.deleted", subscription("canceled")),
      );

      expect(mocks.updateMany).toHaveBeenCalledWith(REVOKE_WRITE);
    });
  });

  describe("out of order and repeated events", () => {
    it("uses the current state from Stripe, so a stale active update can't bring Pro back", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.retrieve.mockResolvedValue(subscription("canceled"));

      await handleStripeEvent(
        event("customer.subscription.updated", subscription("active")),
      );

      expect(mocks.updateMany).toHaveBeenCalledWith(REVOKE_WRITE);
    });

    it("falls back to the event payload when Stripe no longer has the subscription", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.retrieve.mockRejectedValue(
        Object.assign(new Error("No such subscription"), {
          code: "resource_missing",
        }),
      );

      const changed = await handleStripeEvent(
        event("customer.subscription.updated", subscription("canceled")),
      );

      expect(changed).toBe(true);
    });

    it("writes nothing when a granting event is replayed", async () => {
      mocks.findUnique.mockResolvedValue(proUser);

      const changed = await handleStripeEvent(checkoutEvent());

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("writes nothing when a revoking event is replayed", async () => {
      mocks.findUnique.mockResolvedValue(freeUser);

      const changed = await handleStripeEvent(
        event("customer.subscription.deleted", subscription("canceled")),
      );

      expect(changed).toBe(false);
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("reports no change when the user was deleted before the write", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.updateMany.mockResolvedValue({ count: 0 });

      const changed = await handleStripeEvent(
        event("customer.subscription.deleted", subscription("canceled")),
      );

      expect(changed).toBe(false);
    });
  });

  it("returns without writing for an unknown customer", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const changed = await handleStripeEvent(
      event("customer.subscription.deleted", subscription("canceled")),
    );

    expect(changed).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("ignores events it doesn't handle", async () => {
    const changed = await handleStripeEvent(
      event("invoice.paid", { id: "in_1" }),
    );

    expect(changed).toBe(false);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  describe("failures the route turns into a retry", () => {
    it("lets a database failure through", async () => {
      mocks.updateMany.mockRejectedValue(new Error("db down"));

      await expect(handleStripeEvent(checkoutEvent())).rejects.toThrow(
        "db down",
      );
    });

    it("lets a unique subscription id collision through", async () => {
      mocks.updateMany.mockRejectedValue(
        Object.assign(new Error("Unique constraint"), { code: "P2002" }),
      );

      await expect(handleStripeEvent(checkoutEvent())).rejects.toMatchObject({
        code: "P2002",
      });
    });

    it("lets a failing subscription lookup on checkout through", async () => {
      mocks.retrieve.mockRejectedValue(new Error("Stripe is down"));

      await expect(handleStripeEvent(checkoutEvent())).rejects.toThrow(
        "Stripe is down",
      );
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });

    it("lets a failing successor lookup through before anything is written", async () => {
      mocks.findUnique.mockResolvedValue(proUser);
      mocks.list.mockRejectedValue(new Error("Stripe is down"));

      await expect(
        handleStripeEvent(
          event("customer.subscription.deleted", subscription("canceled")),
        ),
      ).rejects.toThrow("Stripe is down");
      expect(mocks.updateMany).not.toHaveBeenCalled();
    });
  });
});
