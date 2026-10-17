# Current Feature

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
