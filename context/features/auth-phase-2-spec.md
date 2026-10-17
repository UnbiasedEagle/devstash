# Auth Phase 2: Sessions and Route Protection Spec

## Overview

Replace the hardcoded demo user with the signed-in user, protect the dashboard and add sign out.

## Requirements

- Protect `/dashboard` and its sub-routes with Next.js 16 `src/proxy.ts`, redirecting unauthenticated users to `/sign-in`
- Do a cheap session-cookie check in the proxy, and do the real session validation with `auth.api.getSession` in the server code that reads data
- Redirect signed-in users away from `/sign-in` and `/sign-up` to `/dashboard`
- Rewrite `getCurrentUser` and `getCurrentUserId` in `src/lib/db/user.ts` to read the session via `auth.api.getSession({ headers })`, keeping the `cache` wrapper and the same return shape. Redirect to `/sign-in` when there is no session
- Remove the `DEMO_USER_EMAIL` constant and its comment
- Make the sidebar user area show the real name, email and avatar (initials fallback when there is no `image`)
- Add a sign-out action to the sidebar user area that ends the session and redirects to `/sign-in`
- Verify in the browser (unauthenticated redirect, each user sees only their own data, sign out), then run `npm run build`

## Notes

- The seed demo user has no credential account, so it cannot sign in. Register a new user to test, or update the seed to create a credential account for the demo user through Better Auth if it is needed for local testing
- Every data query already takes a `userId`, so no query changes are expected beyond the user helper

## References

- @context/coding-standards.md (Next.js)
- `src/lib/db/user.ts`
- `src/lib/auth.ts`
- `src/components/dashboard/`
