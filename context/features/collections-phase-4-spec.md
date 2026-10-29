# Collections Phase 4: Assign Items to Collections Spec

## Overview

Let users put an item in a collection when creating or editing it, and see which collection an item is in.

## Requirements

- Add an optional collection selector to the shared item form, used by both create and edit, listing only the user's collections with a "None" option
- Add `collectionId` to the shared item schemas and persist it in `createItem` and `updateItem`
- Verify server-side that `collectionId` belongs to the user. Another user's or unknown id returns "Collection not found" and nothing is saved
- Show the item's collection in the drawer as a link to `/collections/[id]`
- Revalidate the collection pages, the dashboard and the sidebar after item mutations
- Verify in the browser (assign on create, change and clear on edit, item shows in the collection page, drawer link works, mobile layout), then run `npm run build`

## Tests

- Schema accepts an optional `collectionId`
- `createItem` and `updateItem` reject a collection owned by another user and save an owned one

## References

- @context/coding-standards.md (Data Fetching)
- `src/actions/items.ts`
- `src/lib/item-schemas.ts`
