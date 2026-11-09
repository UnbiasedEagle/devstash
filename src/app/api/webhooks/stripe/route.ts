import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { stripeEnv } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripe-webhook";

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  // The signature covers the exact bytes Stripe sent, so the body must be read as text before anything parses it
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const changed = await handleStripeEvent(event);
    if (changed) {
      revalidatePath("/profile");
      revalidatePath("/", "layout");
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    // Only the ids, the error name and its code: the payload holds customer data and a database error message can echo values
    console.error("Stripe webhook failed", {
      eventId: event.id,
      type: event.type,
      error: error instanceof Error ? error.name : "unknown",
      code: errorCode(error),
    });
    return new Response("Webhook handler failed", { status: 500 });
  }
}
