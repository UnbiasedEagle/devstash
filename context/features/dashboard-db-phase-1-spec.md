# Dashboard Database Phase 1 Spec

## Overview

This is phase 1 of 2 for replacing the dashboard mock data with real data from the database. This phase adds the query layer and moves the main dashboard area (stats cards, recent collections, pinned items, recent items) to it.

## Requirements for phase 1

- Create query functions under `src/lib/db/` (`items.ts`, `collections.ts`, `item-types.ts`) using the shared Prisma client
- Fetch directly in server components, no Server Actions or API routes
- Queries needed by the main area:
  - Recent collections: the 6 most recently updated, each with its item count and the distinct item types it contains
  - Pinned items
  - 10 most recently updated items
  - Stats: total items, collections, favorite items, favorite collections, and item count per item type
- Items come back with their item type and tag names
- Collection cards no longer have a stored color, so use the color of the item type that appears most in that collection (fall back to a neutral color when the collection is empty)
- Define the types for these query results in `src/types/`, no `any`
- Update `StatsCards`, `CollectionCard`, `ItemRow` and `src/app/dashboard/page.tsx` to use the query results instead of `src/lib/mock-data.ts`
- Scope every query to the demo user (`demo@devstash.io`) for now, through one helper so it can be swapped for the session user later
- Handle empty states for each section
- Verify in the browser that the dashboard shows the seeded data, and run `npm run build`

## Notes

- The sidebar is not part of this phase and keeps using the mock data
- Do not delete `src/lib/mock-data.ts` or `src/lib/collections.ts` in this phase
- Keep the current look; this is a data swap, not a redesign

## References

- @context/features/dashboard-phase-3-spec.md
- @context/project-overview.md (Data Model)
- @context/coding-standards.md (Data Fetching)
- `prisma/schema.prisma`
- `prisma/seed.ts`
