# Current Feature

Dashboard Database Phase 2

## Status

Completed

## Goals

- Sidebar item types with real item counts
- Favorite collections and the 4 most recent non-favorite collections with item counts
- User name and email from the database
- Sidebar query result types in `src/types/`
- Works with `cacheComponents`, with a loading placeholder
- Empty states for favorite and recent collections
- Ask before deleting `mock-data.ts` and `collections.ts` once unused

## Notes

- Spec: @context/features/dashboard-db-phase-2-spec.md
- Keep the current look and the collapsible sidebar and mobile drawer behavior
- Keep every query scoped to the demo user through the existing helper

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
