# Billing Phase 2: Stripe Webhook Spec

## Overview

Keep the user's Pro status in sync with Stripe. Stripe tells us when a subscription starts, changes or ends, and the webhook is the only place that changes `isPro`.

## Requirements

- Add a `POST /api/webhooks/stripe` route handler (a route handler is required here, as in the coding standards). It reads the raw body, verifies the `Stripe-Signature` header with `STRIPE_WEBHOOK_SECRET` and answers `400` for a missing or bad signature without touching the database
- Handle `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted`. Ignore every other event with a `200`
- Find the user by `stripeCustomerId` (falling back to `client_reference_id` on the checkout event). Set `isPro` to true and save `stripeSubscriptionId` while the subscription status is `active` or `trialing`, and set `isPro` to false and clear `stripeSubscriptionId` when it ends (`canceled`, `unpaid`, `incomplete_expired`) or is deleted. A subscription set to cancel at period end stays Pro until Stripe sends the deleted event
- Handlers are idempotent, so a retried or out-of-order event leaves the same result. An event for an unknown customer returns `200` and is logged, so Stripe does not retry it forever
- Unexpected errors return `500` so Stripe retries. Log the event id and type, never the payload or keys
- The route is public, so it stays out of the `src/proxy.ts` matcher, and it does not use the Redis rate limits (Stripe retries must not be blocked)
- Revalidate `/profile` and the layout after a change so the sidebar and usage reflect the new plan
- Verify with the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe` and `stripe trigger`): a test checkout switches `isPro` on, cancelling the subscription in the Stripe dashboard switches it off, a request with a bad signature gets `400`, replaying an event changes nothing. Then run `npm run build`

## Tests

- A bad or missing signature returns `400` and writes nothing
- `checkout.session.completed` and an `active` update set `isPro` and the subscription id for the right user
- `canceled` and deleted events clear them, and `cancel_at_period_end` alone does not
- A replayed event and an event for an unknown customer both return `200` without extra writes
- A database failure returns `500` (Stripe, Prisma mocked)

## Notes

- Put the status-to-plan decision in a small pure function (`isActiveSubscription(status)`) so it is tested on its own
- A user keeps one current subscription. A second live subscription on the same customer (made outside the app, since checkout blocks it) is ignored until the current one ends, then takes over instead of the user losing Pro
- `customer.subscription.created` and invoice events are not handled: checkout completion covers the normal flow, `past_due` leaves access unchanged and Stripe's retry window ends in `unpaid` or `canceled`, which revokes
- Existing items and collections over the free limits stay after a downgrade. Only creating new ones is blocked again by the existing limit checks

## References

- @context/coding-standards.md (Next.js, when to use API routes)
- `src/proxy.ts`, `src/lib/stripe.ts` from phase 1
- `src/app/api/auth/[...all]/route.ts`
