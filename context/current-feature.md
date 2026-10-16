# Current Feature

Prisma and Neon Setup

## Status

In Progress

## Goals

- Install Prisma and the Neon driver adapter
- Initialize `prisma/schema.prisma` with the `postgresql` provider
- Pooled connection string for the app, direct connection string for migrations
- `DATABASE_URL` and `DIRECT_URL` in `.env`, `.env.example` added, `.env` git-ignored
- Shared Prisma client in `src/lib/prisma.ts`
- npm scripts for generate, migrate dev and studio
- Verify the connection with a throwaway query

## Notes

- Spec: @context/features/prisma-neon-setup-spec.md
- Use the Neon development branch connection strings, not production
- Never commit credentials or real connection strings

## History

- Initial Next.js project setup and boilerplate cleanup
- Added mock data for dashboard UI (`src/lib/mock-data.ts`)
- Completed Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode, top bar, sidebar/main placeholders
- Completed Dashboard UI Phase 2: collapsible sidebar with icon rail, item types, favorite/recent collections, user area, mobile drawer
- Completed Dashboard UI Phase 3: stats overview, recent collections, pinned and recent items, new fonts and graphite theme
