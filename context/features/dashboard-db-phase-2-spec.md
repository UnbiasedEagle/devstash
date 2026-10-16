# Dashboard Database Phase 2 Spec

## Overview

This is phase 2 of 2 for replacing the dashboard mock data with real data from the database. This phase moves the sidebar (item types, favorite and recent collections, user area) to the query layer added in phase 1.

## Requirements for phase 2

- Add the sidebar queries to the existing `src/lib/db/` files, reusing `getItemTypeCounts` and `getCurrentUserId`:
  - Item types with the number of items of each type
  - All favorite collections
  - The 4 most recently updated collections that are not favorites, each with its item count
  - The current user's name and email
- Define the sidebar query result types in `src/types/`, no `any`
- Update `Sidebar.tsx` to use the query results instead of `src/lib/mock-data.ts`
- The sidebar is rendered by the dashboard layout, so make sure it still builds and streams correctly with `cacheComponents` enabled
- Show a loading placeholder while the sidebar data loads, and keep the collapsible sidebar and mobile drawer behavior unchanged
- Handle empty states: no favorite collections, no recent collections
- Item type links and collection links keep their current URLs
- Verify in the browser that the sidebar numbers match the seeded data (item type counts add up to the dashboard's total item count) and run `npm run build`
- Once nothing imports `src/lib/mock-data.ts` or `src/lib/collections.ts`, ask before deleting them

## Notes

- Keep the current look; this is a data swap, not a redesign
- Keep every query scoped to the demo user through the existing helper

## References

- @context/features/dashboard-db-phase-1-spec.md
- @context/features/dashboard-phase-2-spec.md
- @context/project-overview.md (Data Model)
- @context/coding-standards.md (Data Fetching)
- `src/components/dashboard/Sidebar.tsx`
- `src/lib/db/`
