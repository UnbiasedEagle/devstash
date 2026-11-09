import type Stripe from "stripe";

export type SubscriptionAccess = "grant" | "revoke" | "keep";

const GRANTING_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];
const REVOKING_STATUSES: Stripe.Subscription.Status[] = [
  "canceled",
  "unpaid",
  "incomplete_expired",
];

// past_due, incomplete and paused are transitional, so the user keeps whatever access they have while Stripe retries the payment
export function getSubscriptionAccess(
  status: Stripe.Subscription.Status,
): SubscriptionAccess {
  if (GRANTING_STATUSES.includes(status)) return "grant";
  if (REVOKING_STATUSES.includes(status)) return "revoke";
  return "keep";
}
