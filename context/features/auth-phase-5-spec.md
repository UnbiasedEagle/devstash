# Auth Phase 5: Email Verification Spec

## Overview

Require email/password users to verify their email address before they can sign in, sending the verification email with Resend.

## Requirements

- Install the `resend` package and add `RESEND_API_KEY` and `EMAIL_FROM` to `.env` and `.env.example`, validated with Zod in `src/lib/env.ts`
- Add `src/lib/email.ts` with a `sendEmail({ to, subject, html })` helper that wraps the Resend client and throws when Resend returns an error
- Add a verification email template in `src/lib/email-templates.ts` (subject, short plain copy, one button linking to the verification URL, a text fallback of the link)
- Configure Better Auth in `src/lib/auth.ts`:
  - `emailAndPassword.requireEmailVerification: true`
  - `emailVerification.sendVerificationEmail` sending the template through `sendEmail`
  - `emailVerification.sendOnSignUp: true` and `sendOnSignIn: true`
  - `emailVerification.autoSignInAfterVerification: true`, with the verification link redirecting to `/dashboard`
  - Do not `await` the send inside `sendVerificationEmail`, so response time does not reveal whether an account exists
- Sign-up no longer redirects to `/dashboard`. After a successful sign-up, show a "Check your email" state on the sign-up page that names the address and offers a "Resend email" button
- Sign-in with an unverified email shows a toast explaining the email is not verified, with a "Resend verification email" action that calls `authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" })`
- Rate limit resending in the UI: disable the resend button for 60 seconds after a send and show the remaining seconds
- Handle an expired or invalid verification link: redirect back to `/sign-in` with an error and show a toast with a way to request a new email
- Remove the "account already exists" message branch in `SignUpForm.tsx`, since Better Auth returns a success response for existing emails when verification is required
- Mark existing local credential users as verified in the dev database so they can keep signing in; the seeded demo user is already verified
- Verify in the browser (sign up and receive the email, verify via the link and land on `/dashboard`, sign in before verifying is blocked with the resend toast, resend works, expired link shows the toast, GitHub sign-in still works), then run `npm run build`

## Notes

- Resend's shared `onboarding@resend.dev` sender only delivers to the Resend account owner's address, which is enough for local testing. Production needs a verified sending domain in Resend and `EMAIL_FROM` set to an address on it, through Vercel env vars
- GitHub users are already verified by GitHub, so they are unaffected
- With verification in place, Better Auth's default account linking can attach a GitHub sign-in to a verified email/password user

## References

- @context/project-overview.md (Auth)
- @context/coding-standards.md (Error Handling, Data Fetching)
- `src/lib/auth.ts`
- `src/lib/env.ts`
- `src/components/auth/SignUpForm.tsx`
- `src/components/auth/SignInForm.tsx`
