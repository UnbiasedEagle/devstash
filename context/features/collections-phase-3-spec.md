# Collections Phase 3: Edit, Favorite and Delete Spec

## Overview

Let users rename, favorite and delete their collections without losing the items inside them.

## Requirements

- Add `updateCollection`, `setCollectionFavorite` and `deleteCollection` to `src/actions/collections.ts`, each returning `{ success, data, error }` and scoped with `where: { id, userId }`. An id that is not the user's returns "Collection not found"
- Count all three against the shared mutation limit
- Deleting a collection keeps its items: they become uncollected
- Add an edit dialog reusing the create form, and a delete confirmation dialog naming the collection and saying its items are kept
- Add an optimistic favorite star on collection cards and the detail page, reverting on failure
- On success, show a toast and revalidate the index, the dashboard, the sidebar and `/profile` usage. After deleting from the detail page, redirect to `/collections`
- Disable submit and confirm buttons while a request runs
- Verify in the browser (edit, favorite toggle, delete keeps items, sidebar favorites update, another user's id cannot be changed, mobile layout), then run `npm run build`

## Tests

- Each action: success, unauthenticated, rate limited, not found for another user's id
- `deleteCollection` leaves the collection's items in place

## References

- @context/coding-standards.md (Error Handling)
- `src/actions/collections.ts`
- `src/components/ui/dialog.tsx`
