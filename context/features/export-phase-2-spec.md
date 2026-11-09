# Export Phase 2: ZIP Export with Files Spec

## Overview

Let Pro users download a ZIP that holds the JSON export and the files and images they uploaded.

## Requirements

- `GET /api/export?format=zip` returns a streamed ZIP attachment named `devstash-export-YYYY-MM-DD.zip`, with the same session, Pro, limit and no-store rules as phase 1. The JSON format stays the default
- The ZIP contains `export.json` built by the phase 1 builder, plus every File and Image item's file under `files/` named `<item id>-<clean file name>` so two items with the same name never collide. Each item in `export.json` gets a `file` field with its path inside the ZIP
- Files are read from R2 one at a time through a new `getObjectStream(key)` helper in `src/lib/storage.ts` and written into the ZIP as they arrive, so memory stays flat however large the stash is. Only keys that belong to the user's own items are read
- A file that can't be read (missing object or an R2 error) is skipped and listed in a `missing` array in `export.json` with the item id and file name, and logged with its key. It doesn't fail the whole export
- A cap on total size (500 MB of files). A stash over the cap isn't cut off silently: the export stops adding files once the cap would be passed, and the skipped ones are listed in `missing` with the reason `size_limit`
- If the request is cancelled by the browser, reading from R2 stops
- The profile card gets a second link, "Download with files (ZIP)", next to the JSON one for Pro users
- Verify in the browser (ZIP opens, `export.json` is valid, each file's bytes match the original, an item with a missing object appears in `missing`, the cap behaviour with a lowered limit, a free user is refused, mobile layout), then run `npm run build`

## Tests

- The ZIP builder writes `export.json` and each file under a unique path, adds the `file` path to the item and lists unreadable files in `missing` (storage mocked)
- Two items with the same file name get different paths
- A file that fails to read is skipped and the rest still arrive
- Files past the size cap are skipped and listed with `size_limit`
- The route returns a ZIP attachment for a Pro user for `format=zip` and keeps JSON as the default; a free user gets 403

## Notes

- Use a streaming ZIP library (fflate or archiver) and check it works on the Vercel runtime before choosing
- A long export can hit the function time limit; the size cap keeps it inside that limit, so set the cap from what the browser check shows, not a guess
- Signed links aren't used here: the server reads the objects itself, so no link is created or stored

## References

- Phase 1 spec and `src/lib/export.ts`
- `src/lib/storage.ts` for the R2 client and helpers
- `src/lib/upload-rules.ts` for `cleanFileName`
