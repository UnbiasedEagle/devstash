# Auth Phase 3: GitHub OAuth Spec

## Overview

Let users sign in and sign up with their GitHub account.

## Requirements

- Register a GitHub OAuth app with callback URL `{BETTER_AUTH_URL}/api/auth/callback/github` for local development
- Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `.env` and `.env.example`
- Enable the `github` social provider in `src/lib/auth.ts`
- Add a "Continue with GitHub" button to the sign-in and sign-up forms, below the email form with a divider, calling `authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" })`
- Build it as a reusable `OAuthButton` component in `src/components/auth/` so more providers can reuse it
- Show a toast when the OAuth flow fails
- New GitHub users get a `User` and an `Account` row with `providerId` `github`, and land on `/dashboard`
- Verify in the browser (new GitHub user, returning GitHub user, cancelled consent), then run `npm run build`

## Notes

- GitHub users with a private email: Better Auth fetches the primary verified email, so no extra handling is expected
- Production needs its own OAuth app and callback URL, set through Vercel env vars

## References

- @context/project-overview.md (Auth)
- `src/lib/auth.ts`
- `src/components/auth/`
