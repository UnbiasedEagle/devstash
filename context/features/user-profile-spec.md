# User Profile Page Spec

## Overview

Give signed-in users a profile page where they see their account details, edit their name and change their password.

## Requirements

- Add a protected `/profile` route. Add `/profile/:path*` to the `src/proxy.ts` matcher and validate the session on the server with `getCurrentUser`, like the dashboard
- Show an account section:
  - Avatar (the user's `image` with an initials fallback), name and email
  - A "Verified" indicator for the email
  - Member since date
  - Plan badge (Free or Pro, from `isPro`)
  - Sign-in methods as badges (Email and password, GitHub), derived from the user's `Account` rows
- Show a usage section with the user's item count and collection count against the free limits (50 items, 3 collections), read-only. Pro users see the counts without limits
- Add an edit name form: Zod validated (trimmed, required, max 80 characters), calls `authClient.updateUser({ name })`, shows a success toast and refreshes so the sidebar updates. Email is read-only
- Add a change password form, shown only when the user has an email and password sign-in method:
  - Current password, new password and confirm fields, validated with Zod (same 8 to 128 character rule as sign-up, passwords must match, new password must differ from the current one)
  - Calls `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`, so other devices are signed out
  - A wrong current password shows an inline error on that field, other failures show a toast
- For a user with only GitHub, replace the change password form with a short note that the account signs in with GitHub
- Add a data helper `getProfile(userId)` in `src/lib/db/profile.ts` returning plan, member since, email verified, sign-in methods and the two counts, using Prisma with every query scoped to the user
- Link to the page from the app:
  - A "Profile" item in the sidebar avatar menu, above "Sign out"
  - A "Profile" row in the mobile account card, above "Sign out"
- Show loading skeletons for the page sections, matching the dashboard's streaming pattern
- The page is responsive: single column on mobile, sections stacked with a readable max width on larger screens
- Verify in the browser (email/password user and GitHub-only user see the right sections, name update shows in the sidebar, password change works and the old password stops working, wrong current password error, other sessions signed out, `/profile` redirects to `/sign-in` when signed out, mobile drawer link), then run `npm run build`

## Notes

- Every query takes the session user's id, and nothing on the page accepts a user id from the client
- A user who signed up with both methods sees both badges and the change password form
- The avatar is display only, using the existing `image` value

## References

- @context/project-overview.md (Monetization, UI / UX)
- @context/coding-standards.md (Next.js, Data Fetching, Error Handling)
- `src/lib/db/user.ts`
- `src/proxy.ts`
- `src/components/dashboard/UserMenu.tsx`
- `src/components/dashboard/MobileAccountCard.tsx`
