"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { auth } from "@/lib/auth";
import { checkoutPlanSchema, type CheckoutPlan } from "@/lib/billing-schemas";
import { authEnv, stripeEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/actions";

interface CheckoutSession {
  url: string;
}

interface CheckoutUser {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}

const CHECKOUT_ERROR = "Could not start checkout. Try again.";
const ALREADY_PRO = "You are already on Pro";
const ACTIVATING = "Your subscription is being activated. Refresh in a moment.";

const PRICE_IDS: Record<CheckoutPlan, string> = {
  monthly: stripeEnv.STRIPE_PRICE_MONTHLY,
  yearly: stripeEnv.STRIPE_PRICE_YEARLY,
};

const LIVE_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
];

function isResourceMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "resource_missing"
  );
}

// Stripe replays the first response for a repeated key, so two checkouts started at once share one customer. The key covers everything the customer is created from and the id it replaces: changed details or a deleted customer get a fresh key instead of a rejected call or a replayed dead customer
function customerIdempotencyKey(
  user: CheckoutUser,
  replacedCustomerId: string | null,
): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([user.email, user.name, replacedCustomerId]))
    .digest("hex")
    .slice(0, 32);
  return `customer-${user.id}-${digest}`;
}

async function getOrCreateCustomerId(
  user: CheckoutUser,
  replacedCustomerId: string | null,
): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create(
    {
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    },
    { idempotencyKey: customerIdempotencyKey(user, replacedCustomerId) },
  );

  // Only the first saved customer wins, so two checkouts started at once end up sharing one customer
  const saved = await prisma.user.updateMany({
    where: { id: user.id, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
  if (saved.count === 1) return customer.id;

  const winner = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });
  return winner?.stripeCustomerId ?? customer.id;
}

// The webhook that sets isPro can lag behind a payment, and in that window isPro alone would let a second subscription be bought
async function hasLiveSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  return subscriptions.data.some((subscription) =>
    LIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );
}

async function openCheckout(
  user: CheckoutUser,
  plan: CheckoutPlan,
  replacedCustomerId: string | null = null,
): Promise<ActionResult<CheckoutSession>> {
  if (
    user.stripeCustomerId &&
    (await hasLiveSubscription(user.stripeCustomerId))
  ) {
    return { success: false, error: ACTIVATING };
  }

  const customerId = await getOrCreateCustomerId(user, replacedCustomerId);
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${authEnv.BETTER_AUTH_URL}/profile?checkout=success`,
    cancel_url: `${authEnv.BETTER_AUTH_URL}/profile?checkout=cancelled`,
  });
  if (!checkout.url) throw new Error("Checkout session has no URL");

  return { success: true, data: { url: checkout.url } };
}

export async function createCheckoutSession(
  input: unknown,
): Promise<ActionResult<CheckoutSession>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to upgrade" };
  }
  const userId = session.user.id;

  const plan = checkoutPlanSchema.safeParse(input);
  if (!plan.success) {
    return { success: false, error: CHECKOUT_ERROR };
  }

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isPro: true,
        stripeCustomerId: true,
      },
    });
    if (!user) return { success: false, error: CHECKOUT_ERROR };
    if (user.isPro) return { success: false, error: ALREADY_PRO };

    try {
      return await openCheckout(user, plan.data);
    } catch (error) {
      if (!user.stripeCustomerId || !isResourceMissing(error)) throw error;

      // The saved customer was deleted in Stripe (for example a test data reset), so forget it and start over with a new one
      await prisma.user.updateMany({
        where: { id: userId, stripeCustomerId: user.stripeCustomerId },
        data: { stripeCustomerId: null },
      });
      return await openCheckout(
        { ...user, stripeCustomerId: null },
        plan.data,
        user.stripeCustomerId,
      );
    }
  } catch (error) {
    console.error("createCheckoutSession failed", error);
    return { success: false, error: CHECKOUT_ERROR };
  }
}
