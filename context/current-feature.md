# Current Feature

Seed Data

## Status

In Progress

## Goals

- `prisma/seed.ts` registered in `prisma.config.ts`, with an `npm run db:seed` script run through `tsx`
- Seed the 7 system item types
- Seed a demo user (`demo@devstash.io`) with a hashed password
- Seed the 6 collections from the mock data with realistic items, tags, favorites and pins
- Safe to re-run: upsert system types, recreate only the demo user's data
- Own Prisma client with the Neon adapter, not the shared one

## Notes

- Spec: @context/features/seed-data-spec.md
- Seed against the Neon development branch, never production
- Confirm the password hash format matches what Better Auth expects before relying on the demo login

## History

- Initial Next.js project setup and boilerplate cleanup
- Added mock data for dashboard UI (`src/lib/mock-data.ts`)
- Completed Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode, top bar, sidebar/main placeholders
- Completed Dashboard UI Phase 2: collapsible sidebar with icon rail, item types, favorite/recent collections, user area, mobile drawer
- Completed Dashboard UI Phase 3: stats overview, recent collections, pinned and recent items, new fonts and graphite theme
- Completed Prisma and Neon setup: Prisma 7 with Neon adapter, pooled/direct connection strings, shared client in `src/lib/prisma.ts`, db npm scripts
- Completed database models: User, Item, ItemType, Collection, Tag, ItemTag and Better Auth tables, `init` migration with partial unique index for system item type names
