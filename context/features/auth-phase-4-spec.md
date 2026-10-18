# Auth Phase 4: Account Linking Spec

## Overview

Make sure one email maps to one user across the email/password and GitHub providers.

## Requirements

- Enable Better Auth account linking (`account.accountLinking`) without `trustedProviders`, so signing in with GitHub links only when GitHub reports the email as verified and the existing user's email is verified, instead of creating a duplicate or failing
- Show a clear toast when a sign-in is rejected because the email belongs to an email/password account that cannot be linked
- Verify in the browser (new GitHub user, returning GitHub user, same email via email/password and GitHub resolves to one user with two `Account` rows), then run `npm run build`

## Notes

- Do not auto-link into an email/password account unless Better Auth can confirm the email is verified, because email verification is not enabled
- Auth providers are email/password and GitHub only

## References

- @context/project-overview.md (Auth)
- `src/lib/auth.ts`
- `src/components/auth/OAuthButton.tsx`
