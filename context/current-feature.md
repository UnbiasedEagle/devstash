# Current Feature

Database Models

## Status

In Progress

## Goals

- Define User, Item, ItemType, Collection, Tag, ItemTag models in `prisma/schema.prisma`
- Add Better Auth tables: Session, Account, Verification
- `ContentType` enum (TEXT / FILE / URL)
- Cascade deletes from User, indexes on foreign keys and filter columns
- Tag names unique per user
- Initial migration via `prisma migrate dev --name init`
- Partial unique index on system ItemType names added to the migration SQL
- `prisma migrate status` confirms migrations are in sync

## Notes

- Spec: @context/features/database-models-spec.md
- Never use `prisma db push`, only `prisma migrate dev`
- Run migrations against the Neon development branch, not production

## History

- Initial Next.js project setup and boilerplate cleanup
- Added mock data for dashboard UI (`src/lib/mock-data.ts`)
- Completed Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode, top bar, sidebar/main placeholders
- Completed Dashboard UI Phase 2: collapsible sidebar with icon rail, item types, favorite/recent collections, user area, mobile drawer
- Completed Dashboard UI Phase 3: stats overview, recent collections, pinned and recent items, new fonts and graphite theme
- Completed Prisma and Neon setup: Prisma 7 with Neon adapter, pooled/direct connection strings, shared client in `src/lib/prisma.ts`, db npm scripts
