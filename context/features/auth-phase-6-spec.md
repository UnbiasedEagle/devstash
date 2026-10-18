# Auth Phase 6: Forgot Password Spec

## Overview

Let email/password users who forgot their password request a reset link by email and set a new password.

## Requirements

- Add a "Forgot password?" link to the sign-in form, next to the password field, linking to `/forgot-password`
- Add a `/forgot-password` page with an email field. Submitting calls `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })` and always shows the same "Check your email" confirmation, whether or not the email has an account, so account existence is not revealed
- On the confirmation screen, offer a "Resend email" button that is disabled for 60 seconds after each send with a visible countdown, and a "Use a different email" button
- Add a `/reset-password` page that reads the `token` query param and shows a new password form with a confirm field, validated with Zod (same minimum length as sign-up, passwords must match). Submitting calls `authClient.resetPassword({ newPassword, token })`
- After a successful reset, show a success toast and redirect to `/sign-in`
- When the link is invalid or expired (`?error=INVALID_TOKEN` or no token), show an error state on `/reset-password` with a "Request a new link" button to `/forgot-password`
- Configure Better Auth in `src/lib/auth.ts`:
  - `emailAndPassword.sendResetPassword` sending the reset email through `sendEmail` inside `after()`, not awaited, like the verification email
  - `emailAndPassword.resetPasswordTokenExpiresIn: 3600` (1 hour)
  - `emailAndPassword.revokeSessionsOnPasswordReset: true`, so a reset signs the account out everywhere
- Add a reset email template in `src/lib/email-templates.ts` (subject, short plain copy, one button, text fallback of the link, note that the link expires in 1 hour and can be ignored if the request was not made), built on the existing shared layout
- For a user with no credential account (GitHub only), send an email saying the account signs in with GitHub instead of a reset link, so a GitHub account keeps GitHub as its only sign-in method
- Redirect signed-in users away from `/forgot-password` and `/reset-password` to `/dashboard`, like `/sign-in` and `/sign-up`
- Show a clear toast when the request or the reset fails
- Verify in the browser (request a reset and receive the email, reset via the link and sign in with the new password, old password rejected, reused or expired link shows the error state, unknown email shows the same confirmation with no email sent, GitHub-only account receives the GitHub notice, resend cooldown), then run `npm run build`

## Notes

- Better Auth sends the user to `{BETTER_AUTH_URL}/api/auth/reset-password/{token}?callbackURL=/reset-password`, which redirects to `/reset-password?token=...` on success or `?error=INVALID_TOKEN` on failure
- Email verification stays required, so a user who resets an unverified account still has to verify before signing in
- No new environment variables: it uses the existing Resend setup and `EMAIL_FROM`
- Local testing with `onboarding@resend.dev` only delivers to the Resend account owner's address

## References

- @context/project-overview.md (Auth)
- @context/coding-standards.md (Error Handling, Data Fetching)
- `src/lib/auth.ts`
- `src/lib/email-templates.ts`
- `src/lib/auth-schemas.ts`
- `src/components/auth/SignInForm.tsx`
