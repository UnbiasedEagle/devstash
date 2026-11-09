import "server-only";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isResourceMissing } from "@/lib/stripe-errors";

const DELETE_ERROR =
  "Could not cancel your subscription. Try again in a moment, or contact support.";

// Runs before the account is deleted, so a failure stops the deletion instead of leaving a paid subscription that nobody can manage.
// Deleting the customer cancels all of its subscriptions immediately, however many there are, and makes a Checkout that is still open in another tab fail instead of creating a subscription for a user that no longer exists
export async function deleteBillingAccount(user: {
  id: string;
}): Promise<void> {
  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    if (!record?.stripeCustomerId) return;

    await stripe.customers.del(record.stripeCustomerId);
  } catch (error) {
    // The customer is already gone from Stripe, so there is nothing left to cancel
    if (isResourceMissing(error)) return;
    console.error(
      "Failed to delete the Stripe customer before account deletion",
      error,
    );
    throw new APIError("INTERNAL_SERVER_ERROR", { message: DELETE_ERROR });
  }
}
