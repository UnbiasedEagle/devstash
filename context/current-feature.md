# Current Feature

Vercel CI/CD

## Status

In Progress

## Goals

- Deploy to Vercel from the GitHub repo, with `main` going to production and every PR or branch getting a preview
- `vercel-build` npm script that runs `prisma generate`, `prisma migrate deploy` and `next build`
- GitHub Actions workflow (`.github/workflows/ci.yml`) running `npm ci`, lint and typecheck on PRs and pushes to `main`
- `DATABASE_URL` and `DIRECT_URL` set in Vercel for Production and Preview, pointing at the existing Neon `production` branch for Production and `development` branch for Preview
- Required environment variables documented in `.env.example`

## Notes

- Spec: @context/features/vercel-cicd-spec.md
- Vercel deploys on its own, so the workflow only runs checks
- Never run `prisma db push` or the seed script as part of a deploy
- No application code changes

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
