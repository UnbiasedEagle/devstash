# Current Feature

Not Started

## Status

Not Started

## Goals

## Notes

## History

- Initial Next.js project setup and boilerplate cleanup
- Added mock data for dashboard UI (`src/lib/mock-data.ts`)
- Completed Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode, top bar, sidebar/main placeholders
- Completed Dashboard UI Phase 2: collapsible sidebar with icon rail, item types, favorite/recent collections, user area, mobile drawer
- Completed Dashboard UI Phase 3: stats overview, recent collections, pinned and recent items, new fonts and graphite theme
- Completed Prisma and Neon setup: Prisma 7 with Neon adapter, pooled/direct connection strings, shared client in `src/lib/prisma.ts`, db npm scripts
- Completed database models: User, Item, ItemType, Collection, Tag, ItemTag and Better Auth tables, `init` migration with partial unique index for system item type names
- Completed seed data: re-runnable `prisma/seed.ts` via `npm run db:seed` with system item types, demo user, 6 collections, 13 items and tags
- Completed dashboard database phase 1: query layer in `src/lib/db/` and main dashboard area (stats, recent collections, pinned and recent items) read from the database
- Completed dashboard database phase 2: sidebar item types, favorite and recent collections and user area read from the database, mock data removed
- Completed dashboard skeletons: ShadCN skeleton component and loading skeletons for the stats card, collection cards, item rows and sidebar, with each section streaming in on its own
- Completed Vercel CI/CD: `vercel-build` script, GitHub Actions checks workflow, Vercel deploys from `main` with preview branches
- Completed sidebar pro badge: reusable `ProBadge` pill shown on File and Image types in the sidebar, hidden when collapsed
- Completed auth core: Better Auth with Prisma adapter, `/api/auth/[...all]` handler, `/sign-in` and `/sign-up` pages with Zod validation, toast errors and redirect to `/dashboard`
- Completed auth sessions: `src/proxy.ts` route protection, session-based current user replacing the demo user, real user in the sidebar with an avatar menu and sign out
- Completed auth GitHub OAuth: github provider with Zod-validated env vars, reusable `OAuthButton` and `OAuthSection` on sign-in and sign-up, error toast from `?error=`, plus a sign out button in the expanded sidebar
- Completed mobile sidebar fixes: responsive shell and top bar, mobile account card with sign out at the top of the drawer
- Completed auth account linking: Better Auth account linking with the default verified-email gate, clear toasts for rejected GitHub sign-ins and existing-email sign-ups
- Completed auth email verification: Resend-backed verification emails, required verification for email/password sign-in, "Check your email" screen with 60-second resend cooldown, unverified sign-in and invalid link toasts, existing-account notice email
- Completed auth forgot password: `/forgot-password` and `/reset-password` pages, expiring reset links with sessions revoked on reset, per-user cap on reset emails, GitHub-only notice email, shared resend cooldown hook
- Completed user profile page: protected `/profile` with account details, usage against free limits, edit name and change password forms, sidebar user row and menu links, plus shared `(workspace)` and `(auth)` route group layouts
- Completed email verification flag: `EMAIL_VERIFICATION_ENABLED` env flag (default on, rejected as false on Vercel production) driving Better Auth, sign-up goes straight to `/dashboard` when verification is off so browser tests need no email
- Completed code scan fixes: seed no longer creates a demo user, password reset works while signed in, sidebar and drawer accessibility, server-side name and avatar cleanup, database-backed rate limits (`RateLimit` migration), per-recipient email caps, auth env validation
- Completed delete account: "Danger zone" on `/profile` with a confirmation modal (type your email, plus password for email and password users), new Base UI `Dialog` component, Better Auth `deleteUser` with cleanup of non-cascading rows and a rate limit on the endpoint
- Completed Upstash Redis rate limiting: Better Auth limiter and per-recipient email caps on Redis (`customStorage`, atomic increment with expiry, fail open except `/delete-user`), `RateLimit` table dropped by migration, Upstash env validation
- Completed items phase 1: protected `/items/[type]` lists for every sidebar type with item cards, count pill, empty state, skeletons and `?page=N` pagination (24 per page), plus the specs for items phases 1 to 5
- Completed items phase 2: item detail drawer opened from `?item=<id>` on item cards and dashboard rows, with a Base UI `Sheet`, server-rendered Shiki code and sanitized Markdown, per-type content, copy button and not-found state
- Completed items phase 3: `createItem` Server Action with shared Zod schemas, free plan limit in a Serializable transaction, tags via `connectOrCreate`, shared Redis mutation limit, and a New Item dialog with type selector, chip tag input, lazy-loaded CodeMirror editor with Prettier formatting and a fixed-height mobile-safe layout
- Completed Vitest setup: `npm test` with Vitest and jsdom, `server-only` stub, unit tests for item schemas, tag colors, pagination, relative time, `createItem`, the mutation rate limit and `TagInput` (all with Prisma, Redis and auth mocked), plus `/feature` skill, CI and docs updated to run tests before the Playwright checks
