# Auth Phase 1: Better Auth Core and Email/Password Spec

## Overview

Install and configure Better Auth with the Prisma adapter and let users register and sign in with email and password.

## Requirements

- Install `better-auth`
- Create the server instance in `src/lib/auth.ts` using the Prisma adapter (`@/lib/prisma`, provider `postgresql`) and enable `emailAndPassword`
- Mount the handler at `src/app/api/auth/[...all]/route.ts` with `toNextJsHandler`
- Create the browser client in `src/lib/auth-client.ts`
- Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `.env` and `.env.example`
- Confirm the existing `User`, `Session`, `Account` and `Verification` models match what Better Auth expects (run the Better Auth CLI generate against a scratch file to compare). Only add a migration if something differs, using `prisma migrate dev`
- Build `/sign-in` and `/sign-up` pages with ShadCN form components in `src/components/auth/`
- Sign-up fields: name, email, password, confirm password. Sign-in fields: email, password
- Validate both forms with Zod (valid email, password min 8 characters, passwords match on sign-up)
- Show errors (wrong credentials, email already registered) as toasts
- On success, redirect to `/dashboard`
- Link between the sign-in and sign-up pages
- Verify in the browser (register, sign in, wrong password, duplicate email), then run `npm run build`

## Notes

- Email verification and password reset are out of scope
- Do not touch dashboard queries or route protection yet. The dashboard keeps using the demo user
- Better Auth stores the password hash in `Account.password` for the `credential` provider

## References

- @context/project-overview.md (Auth Flow)
- @context/coding-standards.md (Data Fetching, Error Handling)
- `prisma/schema.prisma`
- `src/lib/prisma.ts`
