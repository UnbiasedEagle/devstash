import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isResourceMissing } from "@/lib/stripe-errors";
import { getSubscriptionAccess } from "@/lib/subscription-status";

type StripeRef = string | { id: string };

interface BillingUser {
  id: string;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const BILLING_USER_SELECT = {
  id: true,
  isPro: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
};

function idOf(ref: StripeRef): string {
  return typeof ref === "string" ? ref : ref.id;
}

// The hint (the user id our own checkout put on the session) only applies to a user with no customer saved yet, so an event can never bind a customer to someone who already has one
async function findUser(
  customerId: string,
  userIdHint: string | null | undefined,
): Promise<BillingUser | null> {
  const byCustomer = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: BILLING_USER_SELECT,
  });
  if (byCustomer || !userIdHint) return byCustomer;
  return prisma.user.findFirst({
    where: { id: userIdHint, stripeCustomerId: null },
    select: BILLING_USER_SELECT,
  });
}

// When the current subscription ends, another live one on the same customer takes over instead of the user losing Pro
async function findSuccessorId(
  customerId: string,
  endedSubscriptionId: string,
): Promise<string | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const successor = subscriptions.data.find(
    (subscription) =>
      subscription.id !== endedSubscriptionId &&
      getSubscriptionAccess(subscription.status) === "grant",
  );
  return successor?.id ?? null;
}

async function grantPro(
  user: BillingUser,
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<boolean> {
  // The user already has a current subscription; this one takes over only when that one ends
  if (
    user.stripeSubscriptionId &&
    user.stripeSubscriptionId !== subscription.id
  ) {
    return false;
  }
  const alreadyGranted =
    user.isPro &&
    user.stripeSubscriptionId === subscription.id &&
    user.stripeCustomerId !== null;
  if (alreadyGranted) return false;

  // One conditional statement instead of read-then-write, so two events handled at once can't overwrite each other
  const { count } = await prisma.user.updateMany({
    where: {
      id: user.id,
      OR: [
        { stripeSubscriptionId: null },
        { stripeSubscriptionId: subscription.id },
      ],
    },
    data: {
      isPro: true,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: user.stripeCustomerId ?? customerId,
    },
  });
  return count > 0;
}

async function revokePro(
  user: BillingUser,
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<boolean> {
  // A late event for an old subscription must not revoke the one the user has now
  if (user.stripeSubscriptionId !== subscription.id) return false;

  const successorId = await findSuccessorId(customerId, subscription.id);
  const { count } = await prisma.user.updateMany({
    where: { id: user.id, stripeSubscriptionId: subscription.id },
    data: successorId
      ? { isPro: true, stripeSubscriptionId: successorId }
      : { isPro: false, stripeSubscriptionId: null },
  });
  return count > 0;
}

// Returns whether the user row changed, so replays and no-op events write nothing
async function syncSubscription(
  subscription: Stripe.Subscription,
  userIdHint?: string | null,
): Promise<boolean> {
  const customerId = idOf(subscription.customer);
  const user = await findUser(customerId, userIdHint);
  if (!user) {
    console.warn("Stripe webhook for an unknown customer", {
      subscriptionId: subscription.id,
    });
    return false;
  }

  const access = getSubscriptionAccess(subscription.status);
  if (access === "grant") return grantPro(user, subscription, customerId);
  if (access === "revoke") return revokePro(user, subscription, customerId);
  return false;
}

// Events can arrive late or out of order, so the current state is read from Stripe instead of trusting the payload
async function fetchCurrentSubscription(
  subscription: Stripe.Subscription,
): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.retrieve(subscription.id);
  } catch (error) {
    if (isResourceMissing(error)) return subscription;
    throw error;
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  if (session.mode !== "subscription" || !session.subscription) return false;
  if (session.payment_status === "unpaid") return false;

  const subscription = await stripe.subscriptions.retrieve(
    idOf(session.subscription),
  );
  return syncSubscription(subscription, session.client_reference_id);
}

export async function handleStripeEvent(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event.data.object);
    case "customer.subscription.updated":
      return syncSubscription(
        await fetchCurrentSubscription(event.data.object),
      );
    case "customer.subscription.deleted":
      return syncSubscription(event.data.object);
    default:
      return false;
  }
}
