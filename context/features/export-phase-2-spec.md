# Export Phase 2: ZIP Export with Files Spec

## Overview

Let Pro users download a ZIP that holds the JSON export and the files and images they uploaded.

## Requirements

- `GET /api/export?format=zip` returns a streamed ZIP attachment named `devstash-export-YYYY-MM-DD.zip`, with the same session, Pro, limit and no-store rules as phase 1. The JSON format stays the default
- The ZIP contains `export.json`, the same document as phase 1 (from `exportChunks` in `src/lib/export.ts`), plus every File and Image item's file under `files/` named `<item id>-<clean file name>` so two items with the same name never collide. Each File and Image item in `export.json` gets a `file` field with its path inside the ZIP. Phase 1 leaves item ids out of the document; in a ZIP export they appear only in the `file` paths and in `missing`, where they are needed to tell files apart
- Files are read from R2 one at a time through a new `getObjectBytes(key)` helper in `src/lib/storage.ts` and written into the ZIP, so memory stays flat however large the stash is: a stored file is at most 10 MB. A file is read in full before it is added, so a read that fails halfway can be skipped cleanly instead of leaving a truncated file in the archive, and a file whose size differs from the saved one counts as unreadable. Only keys that belong to the user's own items are read
- A file that can't be read (missing object or an R2 error) is skipped and listed in a `missing` array in `export.json` with the item id and file name, and logged with its key. It doesn't fail the whole export
- Limits that keep the export inside what one request and the browser can handle: 200 MB of files in total and 10,000 files (the ZIP format this library writes counts entries in 16 bits, so a bigger archive would be silently corrupt). Neither is cut off silently: the export stops adding files once the next one would pass a limit, and the skipped ones are listed in `missing` with the reason `size_limit` or `count_limit`. The numbers are deliberately low and are raised only after timing a real export of that size
- An item that has a stored file but a damaged row (no saved size) or that was added while the export ran is listed in `missing` as `unreadable`, so the export never looks complete when it isn't
- Each read of a file checks the size R2 reports against the saved size before the body is read, ends after 30 seconds, and ends at once when the browser cancels the request (the request's abort signal reaches R2). A cancelled read is not blamed on the file
- The route sets `maxDuration` so a long export isn't cut off by the platform's default limit
- The two download buttons share one pending state, so both are disabled while one export runs and can't use two slots of the limit
- The profile card gets a second button, "Download with files (ZIP)", next to the JSON one for Pro users. Like the JSON button it fetches the route, shows the server's error in a toast and saves the file only when the answer is a ZIP
- Verify in the browser (ZIP opens, `export.json` is valid, each file's bytes match the original, an item with a missing object appears in `missing`, the cap behaviour with a lowered limit, a free user is refused, mobile layout), then run `npm run build`

## Tests

- The ZIP builder writes `export.json` and each file under a unique path, adds the `file` path to the item and lists unreadable files in `missing` (storage mocked)
- Two items with the same file name get different paths
- A file that fails to read is skipped and the rest still arrive
- Files past the size cap are skipped and listed with `size_limit`, and files past the entry limit with `count_limit`
- An item with a damaged row or a file added after the files were listed is listed as `unreadable`; the storage key never appears in `export.json`
- Each read gets the expected size and an abort signal; a read cut off by the browser leaving stops the export without blaming the file
- The storage read refuses an object whose reported size differs from the saved one before reading its body
- The route returns a ZIP attachment for a Pro user for `format=zip` and keeps JSON as the default; a free user gets 403

## Notes

- Use a streaming ZIP library (fflate or archiver) and check it works on the Vercel runtime before choosing
- A long export can hit the function time limit and the browser holds the whole ZIP as a blob; the limits are kept low for both reasons and are raised only from a measured export, not a guess
- Signed links aren't used here: the server reads the objects itself, so no link is created or stored

## References

- Phase 1 spec, `src/lib/export.ts`, `src/app/api/export/route.ts` and `src/components/profile/ExportDownloadButton.tsx`
- `src/lib/storage.ts` for the R2 client and helpers
- `src/lib/upload-rules.ts` for `cleanFileName`
