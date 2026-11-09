# Export Phase 1: JSON Export Spec

## Overview

Let Pro users download all their items, collections and tags as one JSON file from the profile page.

## Requirements

- A protected `GET /api/export` route handler (a download with its own headers, so not a Server Action) returns the signed-in user's data as a JSON attachment named `devstash-export-YYYY-MM-DD.json`
- Requires a session (401 otherwise) and a Pro account (403 with a short JSON error otherwise). The Pro check reads the database, not the session
- The file contains `version` (1), `exportedAt`, `collections` (name, description, isFavorite, createdAt, updatedAt) and `items` (title, description, type name, content type, content, url, language, isFavorite, isPinned, createdAt, updatedAt, collection name, tag names). File and Image items include `fileName`, `fileSize` and `fileMimeType` but never the storage key. No user id, Stripe id or other account data is included
- Only the signed-in user's rows are read, in a stable order (created date, then id). Items are read in pages so a large stash doesn't load at once
- The route uses its own limit of 3 exports a minute per user on Redis, failing open like the other limits, and answers 429 with a short message when it is used up
- The response is never cached (`Cache-Control: no-store`)
- A new "Export your data" card on `/profile`: a Download button for Pro users that starts the download through a plain link to the route, and for free users text saying export is a Pro feature with an Upgrade button to the plan, like the other Pro prompts. The card has a skeleton like the other profile cards so nothing shifts
- Verify in the browser (Pro user downloads a file with the right contents, free user sees the Upgrade prompt and a direct request to the route gets 403, signed-out request gets 401, another user's items never appear, mobile layout), then run `npm run build`

## Tests

- The export builder returns collections and items with tag names and collection names, leaves out storage keys and account data, and maps File and Image items to their file details only (Prisma mocked)
- Items are read in several pages and combined in order
- The route returns 401 without a session, 403 for a free user, 429 over the limit, and 200 with attachment and no-store headers for a Pro user
- The export card shows the Download link for a Pro user and the Upgrade prompt for a free user

## Notes

- Export has no schema change
- Item content can be large; a page size of a few hundred keeps memory low without many queries
- The same file shape is what phase 2 puts inside the ZIP, so the builder is its own function in `src/lib/export.ts` and the route only handles auth, limits and headers

## References

- `src/lib/db/` for the query layer patterns, `src/lib/rate-limit-actions.ts` for the limit helpers
- `src/components/profile/PlanCard.tsx`, `UsageCard.tsx` and `SettingsSkeleton.tsx` for the card and skeleton pattern
- `src/app/api/webhooks/stripe/route.ts` for a route handler example
