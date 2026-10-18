# Items Phase 4: Edit Item, Favorite and Pin Spec

## Overview

Let users edit an item from its drawer, and toggle favorite and pinned with one click.

## Requirements

- Add an "Edit" button to the drawer header that swaps the content for the same form used by create, filled with the item's values. The type is shown but cannot be changed
- Add `updateItem(id, input)` to `src/actions/items.ts`, returning `{ success, data, error }`. It validates with the shared schemas, scopes the update with `where: { id, userId }`, and replaces the item's tags with the submitted set. An id that is not the user's returns "Item not found"
- Count `updateItem` against the shared mutation limit from phase 3
- Add `setItemFavorite(id, value)` and `setItemPinned(id, value)` Server Actions with the same ownership check and mutation limit
- Add a star and a pin toggle to the drawer header and show the state on `ItemCard`. Updates are optimistic with `useOptimistic`, and revert with a toast if the action fails
- Closing the drawer while the form has unsaved changes asks for confirmation to discard them, using the existing `Dialog`
- On success, show an "Item updated" toast, return to the view mode and revalidate the type list, the dashboard and the drawer content
- Verify in the browser (edit each type and see the change in the drawer and the list, validation errors, tags replaced correctly, favorite and pin toggle instantly and survive a refresh, pinned items sort first, a failed update reverts, discard confirmation, another user's item id cannot be edited, mobile layout), then run `npm run build`

## Notes

- Changing an item's type is not supported
- Tags no longer used by any item stay available until phase 5 cleans them up on delete

## References

- @context/coding-standards.md (Next.js, Error Handling)
- `src/actions/items.ts`
- `src/lib/item-schemas.ts`
- `src/components/items/`
