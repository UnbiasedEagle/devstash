# Items Phase 5: Delete Item Spec

## Overview

Let users delete an item from its drawer, with a confirmation step and tidy tag cleanup.

## Requirements

- Add a destructive "Delete" button to the drawer that opens a confirmation dialog naming the item and stating that it cannot be undone. Cancel, Escape and the backdrop close it without deleting
- Add `deleteItem(id)` to `src/actions/items.ts`, returning `{ success, data, error }`. It scopes the delete with `where: { id, userId }`. An id that is not the user's returns "Item not found"
- In the same transaction, delete the user's tags that no longer belong to any item, so the tag list stays clean
- Count `deleteItem` against the shared mutation limit from phase 3
- On success, show an "Item deleted" toast, close the drawer, remove `?item` from the URL and revalidate the type list, the dashboard and the sidebar counts
- Disable the confirm button while the request runs, and keep it disabled after success until the drawer closes, so it can't be submitted twice
- Verify in the browser (delete from the drawer, the item disappears from the list and the dashboard, sidebar and stats counts drop, an unused tag is removed while a tag still used elsewhere stays, Cancel and Escape keep the item, a second delete of the same id shows not found, another user's item id cannot be deleted, mobile layout), then run `npm run build`

## Notes

- Deleting is permanent, with no trash or undo
- The confirmation dialog reuses the existing `Dialog` component

## References

- @context/coding-standards.md (Next.js, Error Handling)
- `src/actions/items.ts`
- `src/components/ui/dialog.tsx`
