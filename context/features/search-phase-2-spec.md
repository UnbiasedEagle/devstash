# Search Phase 2: Instant Search Popup Spec

## Overview

Make search instant, like the Next.js docs search: `Cmd/Ctrl + K` (or the top bar search box) opens a popup, results appear as the user types with the matching text highlighted, and Enter opens the item.

## Requirements

- Open the popup with `Cmd/Ctrl + K`, `/` outside a text field, and a click on the top bar search box (the existing "Search items..." box becomes the trigger). Build it on the existing Base UI `Dialog`
- Show up to 8 results while typing, debounced by 200 ms. Group them under their item type heading with the type icon, and show the title, a one-line snippet and tags
- Highlight the matched words in the title and snippet. The snippet comes from the field that matched (description or content, trimmed in the database like the card previews)
- Add a `quickSearch(query)` Server Action returning `{ success, data, error }`. It checks the session, validates the query with the phase 1 schema and reuses the phase 1 matching with a limit of 8
- Rate limit the action per user in Redis with its own read quota, separate from the mutation limit, failing open if Redis is down
- Ignore out-of-order responses so a slow request never replaces a newer one
- Arrow keys move the selection, `Enter` opens the selected item in the drawer on the current page (`?item=<id>`), `Escape` closes the popup
- A final row, "See all results for ...", goes to `/search?q=`
- Show empty, loading, no-results and error states, and return focus to the previous element on close
- Works on mobile with a touch-sized trigger and input. Accessible: `role="combobox"` with `aria-activedescendant` on the input and `role="listbox"` on the results
- Verify in the browser (open and close, shortcuts, typing, highlighting, grouping, keyboard selection, drawer opens from the dashboard, items and collection pages, fast typing shows only the latest results, empty and error states, mobile layout), then run `npm run build`

## Tests

- `quickSearch` rejects unauthenticated calls and invalid queries, scopes by the session user and returns at most 8 results (mocked)
- The read rate limit allows requests under the quota, blocks over it and fails open when Redis errors
- The highlight helper marks every matched word case-insensitively and treats regex characters literally
- The popup ignores a stale response that arrives after a newer one

## Notes

- Replaces the earlier phase 2 (top bar box) and phase 3 (palette); the top bar box is now the popup trigger
- Opening an item reuses the existing drawer through the URL, so no new detail view is needed
- Keep it flat and neutral: one input, one list

## References

- @context/coding-standards.md (Server Actions, Error Handling)
- `src/components/ui/dialog.tsx`
- `src/lib/db/items.ts` (`searchItems`)
