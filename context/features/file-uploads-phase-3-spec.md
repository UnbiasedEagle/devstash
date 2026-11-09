# File Uploads Phase 3: View, Download and Clean Up Spec

## Overview

Show uploaded images and files where items are shown, let users download them, and remove the stored objects when an item or account is deleted.

## Requirements

- Image items show a thumbnail on `ItemCard` and an inline preview in the item drawer. Thumbnails use short-lived signed links created on the server when the page renders, are lazy loaded and have the item's title as alt text. File items show an icon with the file name and size instead
- The drawer for a File or Image item shows the file name, size and type and a Download button that opens a fresh signed link (a Server Action creates it on click, so a link left open in a tab never outlives its expiry). Files download as attachments; images are served with their stored type only
- Editing a File or Image item changes only the title, description, tags and collection. The file itself can't be replaced; to change it the user creates a new item. The existing edit form hides the content editor for these types
- Deleting an item deletes its object from R2 after the database delete succeeds. A failed object delete is logged with the key and doesn't undo the item delete or show an error to the user
- Deleting an account removes everything under `files/{userId}/` and `pending/{userId}/` in R2 before the account goes, listing in pages so no object is missed. If R2 fails the deletion stops with a friendly error, like the Stripe cleanup, and the usage and plan checks keep working for the retry
- Verify in the browser (thumbnail and preview, download of a file and an image, edit keeps the file, delete removes the object from the bucket, deleting an account removes its objects, an expired link isn't shown as broken UI, mobile layout), then run `npm run build`

## Tests

- The download action requires a session and the item's owner, returns a link only for File and Image items and never for another user's item (Storage, Prisma and auth mocked)
- `deleteItem` removes the object after a successful delete, and a failing object delete leaves the item deleted and logs the key
- The account cleanup deletes objects across several pages of keys and stops the deletion when R2 fails
- `ItemCard` shows a thumbnail for an image item and a file name for a file item

## Notes

- Signed links must not be cached by the app or put in URLs a user can share. They are created per request
- Orphaned objects from a failed object delete are acceptable and can be removed from the bucket by hand; the key is in the log

## References

- `src/components/items/ItemCard.tsx`, `ItemDetail.tsx`, `ItemEditForm.tsx`, `DeleteItemButton.tsx`
- `src/actions/items.ts` (deleteItem), `src/lib/billing-cleanup.ts` and `src/lib/auth.ts` (deleteUser hooks)
- `src/lib/storage.ts` from phase 1
