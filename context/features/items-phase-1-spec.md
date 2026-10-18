# Items Phase 1: Item Lists by Type Spec

## Overview

Make the sidebar type links work. Each type gets a page listing the signed-in user's items of that type, read from the database.

## Requirements

- Add a protected route `src/app/(workspace)/items/[type]/page.tsx`. The `type` param is the lowercase type name used by the sidebar links (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `url`). An unknown type calls `notFound()`
- Add `/items/:path*` to the `src/proxy.ts` matcher and validate the session on the server with `getCurrentUser`
- Add `getItemTypeBySlug(userId, slug)` in `src/lib/db/item-types.ts`, matching the name case-insensitively among system types and the user's own types
- Add `getItemsByType(userId, itemTypeId, requestedPage)` in `src/lib/db/items.ts`: scoped to the user, pinned items first, then most recently updated. Return the page's items with the existing dashboard item fields plus `url` and a content preview of the first 160 characters computed in the query layer, together with the total, the clamped page and the page count. Read the count and the page in one repeatable-read transaction
- Show a page header with the type icon in its color, the type name and the item count
- Render items in a responsive grid (one column on mobile, two from `md`, three from `xl`) using a new `ItemCard` in `src/components/items/ItemCard.tsx`:
  - Title, description (two lines max), content preview in a monospace block for Snippet and Command, hostname for URL
  - Up to three tags with a "+n" overflow
  - Pinned and favorite icons, and a relative "updated" time
- The header count shows the total number of items of the type, not the number on the current page
- Paginate the list with a `?page=N` search param and 24 items per page. `getItemsByType` counts first, clamps the requested page to the valid range, orders by pinned, then most recently updated, then `id` so pages never repeat or skip items, and fetches content previews only for the items on the page. Invalid or missing page values mean page 1
- Add a `Pagination` component in `src/components/items/Pagination.tsx` with server-rendered Previous and Next links, a "25–48 of 120" range and a "page / pages" indicator. It renders nothing when there is only one page
- Show an empty state with a plain message such as "No snippets yet" when the type has no items
- Show loading skeletons that stream in, matching the dashboard pattern (`connection()` and `Suspense` around the data access)
- Verify in the browser (each sidebar type link opens its list with the right items and count, an unknown type shows the not-found page, another user's items never appear, the page redirects to `/sign-in` when signed out, mobile layout), then run `npm run build`

## Notes

- Cards are not interactive yet
- File and Image items are listed the same way, showing the file name instead of a content preview
- Every query takes the session user's id, and nothing accepts a user id from the client

## References

- @context/project-overview.md (Core Features, UI / UX)
- @context/coding-standards.md (Next.js, Data Fetching)
- `src/lib/db/items.ts`
- `src/lib/db/item-types.ts`
- `src/components/dashboard/Sidebar.tsx`
- `src/proxy.ts`
