# Billing Phase 3: Plan and Billing UI Spec

## Overview

Show the user their plan on the profile page, let free users upgrade from there and from the free limit messages, and let Pro users manage or cancel through the Stripe Customer Portal.

## Requirements

- Add a "Plan" card to `/profile` below the usage card. A free user sees the plan name, the Pro price (`$8/month` or `$72/year`, with the yearly saving stated), a monthly and a yearly Upgrade button wired to `createCheckoutSession`, and a pending state while redirecting
- A Pro user sees "Pro" and a "Manage billing" button that opens the Stripe Customer Portal. Add a `createPortalSession()` Server Action in `src/actions/billing.ts` (session required, Pro or an existing customer only, shared mutation limit, return URL `/profile`)
- Remove the temporary phase 1 entry point
- Update `UsageCard` so a Pro user shows unlimited usage instead of the free limits
- The existing "limit reached" messages for items (`FREE_ITEM_LIMIT`) and collections (`FREE_COLLECTION_LIMIT`) get a link to `/profile` so the user can upgrade from where they are blocked. Keep the message text otherwise
- Deleting an account cancels the user's Stripe subscription first. In the `deleteUser` `beforeDelete` hook, cancel the subscription immediately; if Stripe fails, stop the deletion with a friendly error instead of leaving a paid subscription behind
- Add a loading skeleton for the Plan card like the other profile sections
- Verify in the browser (free user sees both plans and reaches Checkout, Pro user sees Pro and the portal opens, cancelling in the portal returns the user to free after the webhook, limit message links to the plan card, delete account cancels the Stripe subscription, mobile layout), then run `npm run build`

## Tests

- `createPortalSession` rejects signed-out users and users with no Stripe customer, and returns the portal URL otherwise (Stripe, Prisma and auth mocked)
- The delete-account hook cancels the subscription before deleting and blocks the deletion when Stripe fails
- `UsageCard` shows unlimited for Pro and the limits for free users

## Notes

- Billing information (card, invoices, cancel) lives in the Stripe portal. Do not build our own forms for it
- Keep it simple and flat like the rest of `/profile`; reuse `ProfileSection` and the existing button styles

## References

- `src/components/profile/UsageCard.tsx`, `ProfileSection.tsx`, `SettingsSkeleton.tsx`
- `src/lib/plan-limits.ts`, `src/lib/auth.ts` (deleteUser)
- `src/actions/billing.ts` from phase 1
