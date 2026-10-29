# Collections Phase 1: Collection Pages Spec

## Overview

Let users browse their collections: an index of all collections and a page per collection listing its items.

## Requirements

- Add a protected `/collections` page in the `(workspace)` group listing the user's collections as cards (name, description, item count, favorite star), with an empty state and a loading skeleton
- Add a protected `/collections/[id]` page listing the collection's items with `ItemCard`, a count pill and `?page=N` pagination (24 per page), with a loading skeleton
- Show a not-found state when the collection does not exist or belongs to another user
- Add the queries to `src/lib/db/collections.ts`, always scoped by `userId`
- Point the sidebar and dashboard collection links to `/collections/[id]`
- The item drawer keeps working on collection pages through `?item=<id>`
- Verify in the browser (index and detail render, pagination, empty collection, another user's id shows not found, drawer opens from a collection page, mobile layout), then run `npm run build`

## Tests

- Collection queries scope by `userId` and paginate correctly (Prisma mocked)

## Notes

- Mirrors `/items/[type]` from items phase 1
- Reuse `ItemCard`, the pagination helpers and the skeleton patterns

## References

- @context/coding-standards.md (Next.js, Data Fetching)
- `src/lib/db/collections.ts`
- `src/app/(workspace)/items/[type]/page.tsx`
