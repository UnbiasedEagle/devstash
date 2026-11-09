# File Uploads Phase 2: Create File and Image Items Spec

## Overview

Let users add File and Image items from the New Item dialog: pick a file, upload it to R2 with progress, and save it as an item with a title, description, tags and an optional collection.

## Requirements

- Add a migration with `prisma migrate dev` (never `db push`) that renames `Item.fileUrl` to `fileKey` with `ALTER TABLE ... RENAME COLUMN` so no data is lost, and adds a nullable `fileMimeType`. The column holds the object key, not a link. Update every use of the old name
- Extend `createItem` and its Zod schemas with the `File` and `Image` types: `fileKey`, `fileName`, `fileSize` and `fileMimeType` are required. Before saving, the server checks with `getObjectInfo` that the object exists under the user's own `pending/{userId}/` prefix and that its real size and type match the rules and the submitted values, then moves it to `files/{userId}/...` with `moveObject` and saves that key. A key under another user's prefix, a missing object or a mismatch returns a clear error
- `File` is Pro only and `Image` is free. A free user submitting a File gets a message with the Upgrade button (add a `pro_required` code to `ActionErrorCode`, handled by `showActionError` the same way as `free_limit`). The free limit of 50 items still counts these items and the existing limit transaction and write-conflict retry are reused
- If saving the item fails after the object was moved, the moved object is deleted so nothing is left behind
- Add `File` and `Image` to the type selector in the New Item dialog. Picking one shows a file field (button and drag and drop) in place of the content editor, with the allowed types and size limit written under it and an inline error when the chosen file breaks the rules. Title defaults to the file name and can be edited
- On submit the dialog calls `requestUpload`, uploads straight to the returned link with `XMLHttpRequest` so a progress bar can show, then calls `createItem`. While uploading the dialog can't be dismissed by accident, a Cancel button aborts the upload, and a failed upload shows a toast and keeps the form
- Remove the Pro badge from Image in the sidebar (files keep it) and show the Pro badge next to File in the type selector for free users
- Verify in the browser (image upload as a free user, file upload as a Pro user, a free user picking File sees the upgrade message, wrong type and oversize are rejected, progress and cancel, the item appears in its type page and the dashboard, mobile layout), then run `npm run build`

## Tests

- The `File` and `Image` schemas require the file fields and reject a key outside the pending prefix shape
- `createItem` for a file: rejects a missing object, a size or type mismatch and another user's key; moves the object and saves the new key; deletes the moved object when the save fails; rejects a File for a free user but accepts an Image; counts toward the free limit (Storage, Prisma and auth mocked)
- The file picker rejects a disallowed type and an oversize file before any upload starts

## Notes

- Editing File and Image items, previews and downloads come in the next phase. Until then a saved file item shows its title and file name in lists
- Keep the dialog layout fixed-height and mobile safe like the existing item dialog

## References

- `src/actions/items.ts`, `src/lib/item-schemas.ts`, `src/components/items/NewItemDialog.tsx`, `ItemFormFields.tsx`, `ItemTypeSelector.tsx`
- `src/components/dashboard/Sidebar.tsx` (`PRO_TYPE_NAMES`), `src/lib/show-action-error.ts`
- `src/actions/uploads.ts` and `src/lib/storage.ts` from phase 1
