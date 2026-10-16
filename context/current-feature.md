# Current Feature

Dashboard Database Phase 1

## Status

In Progress

## Goals

- Query functions under `src/lib/db/` for items, collections and item types
- Stats cards, recent collections, pinned items and recent items read from the database
- Collection card color derived from its most common item type
- Query result types in `src/types/`
- Queries scoped to the demo user through one helper
- Empty states for each section

## Notes

- Spec: @context/features/dashboard-db-phase-1-spec.md
- The sidebar is not part of this phase and keeps using the mock data
- Do not delete `src/lib/mock-data.ts` or `src/lib/collections.ts` in this phase

## History

- Initial Next.js project setup and boilerplate cleanup
- Added mock data for dashboard UI (`src/lib/mock-data.ts`)
- Completed Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode, top bar, sidebar/main placeholders
- Completed Dashboard UI Phase 2: collapsible sidebar with icon rail, item types, favorite/recent collections, user area, mobile drawer
- Completed Dashboard UI Phase 3: stats overview, recent collections, pinned and recent items, new fonts and graphite theme
- Completed Prisma and Neon setup: Prisma 7 with Neon adapter, pooled/direct connection strings, shared client in `src/lib/prisma.ts`, db npm scripts
- Completed database models: User, Item, ItemType, Collection, Tag, ItemTag and Better Auth tables, `init` migration with partial unique index for system item type names
- Completed seed data: re-runnable `prisma/seed.ts` via `npm run db:seed` with system item types, demo user, 6 collections, 13 items and tags
