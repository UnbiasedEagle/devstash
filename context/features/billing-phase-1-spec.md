# Billing Phase 1: Stripe Checkout Spec

## Overview

Let a free user start a Pro subscription ($8/month or $72/year) through Stripe Checkout. This phase only sends the user to Stripe and back; Pro is switched on by the webhook in phase 2.

## Requirements

- Install the `stripe` SDK and add a server-only client in `src/lib/stripe.ts`
- Validate the new env vars with Zod in `src/lib/env.ts` the same way as the other groups: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`. Add them to `.env.example` and to the Vercel env docs where the other keys are listed
- Add a `createCheckoutSession(plan)` Server Action in `src/actions/billing.ts` returning the `{ success, data, error }` shape. `plan` is validated with Zod as `"monthly"` or `"yearly"`
- The action requires a session, rejects users who are already Pro, and reuses the user's `stripeCustomerId` or creates the customer first and saves the id. The customer is created with the user's id in its metadata, so webhooks can find the user
- Create the Checkout session in `subscription` mode with the chosen price, `client_reference_id` set to the user id, the customer's email, and success and cancel URLs back to `/profile` (`?checkout=success` and `?checkout=cancelled`) built from `BETTER_AUTH_URL`
- Run the action through the shared mutation limit from `src/lib/rate-limit-actions.ts`
- The client redirects to the returned Checkout URL. A failure shows a toast with a friendly message and never leaks Stripe errors
- Show a toast on `/profile` for `?checkout=cancelled` ("Checkout cancelled") and an info toast for `?checkout=success` ("Payment received, upgrading your account"), then clean the param from the URL
- Verify in the browser with Stripe test mode and the test card `4242 4242 4242 4242`: both plans reach Checkout, cancel returns to `/profile` with the toast, an already Pro user is rejected. Then run `npm run build`

## Tests

- The plan schema accepts only `monthly` and `yearly`
- `createCheckoutSession` rejects signed-out and already Pro users, creates and stores a customer only when none exists, picks the price that matches the plan and returns the session URL (Stripe, Prisma and auth mocked)
- A Stripe failure returns the friendly error and not the Stripe message

## Notes

- Use the Stripe SDK directly. The database already has `stripeCustomerId` and `stripeSubscriptionId` on `User`, so no schema change and no Better Auth plugin
- Use Stripe test mode keys locally and on Vercel previews. Production keys go in only when billing is finished
- The Upgrade button itself lives on the profile page in phase 3; this phase can add a temporary entry point on `/profile` to drive the browser checks

## References

- @context/project-overview.md (Monetization)
- `src/lib/env.ts`, `src/lib/rate-limit-actions.ts`, `src/lib/plan-limits.ts`
- `src/actions/collections.ts` (action pattern)
