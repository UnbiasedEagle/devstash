# Auth Phase 4: Google OAuth and Account Linking Spec

## Overview

Let users sign in and sign up with their Google account, and make sure one email maps to one user across all providers.

## Requirements

- Create a Google OAuth client with redirect URI `{BETTER_AUTH_URL}/api/auth/callback/google` for local development
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` and `.env.example`
- Enable the `google` social provider in `src/lib/auth.ts`
- Add a "Continue with Google" button to the sign-in and sign-up forms using the existing `OAuthButton`
- Enable Better Auth account linking (`account.accountLinking`) with `google` and `github` as trusted providers, so signing in with a different provider that has the same verified email attaches to the existing user instead of creating a duplicate or failing
- Show a clear toast when a sign-in is rejected because the email belongs to an email/password account that cannot be linked
- Verify in the browser (new Google user, returning Google user, same email via GitHub and Google resolves to one user with two `Account` rows), then run `npm run build`

## Notes

- Do not auto-link into an email/password account unless Better Auth can confirm the email is verified, because email verification is not enabled
- Production needs its own Google client and redirect URI, set through Vercel env vars

## References

- @context/project-overview.md (Auth)
- `src/lib/auth.ts`
- `src/components/auth/OAuthButton.tsx`
