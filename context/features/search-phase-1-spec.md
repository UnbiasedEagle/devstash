# Search Phase 1: Search Results Page Spec

## Overview

Let users find their items by text. A protected `/search?q=` page lists matching items, reusing the item cards and the drawer.

## Requirements

- Add a protected `/search` page in the `(workspace)` group (add `/search` to the route protection in `src/proxy.ts`) reading `?q=` and `?page=N`
- Trim the query and cap it at 100 characters with a shared Zod schema in `src/lib/search-schemas.ts`. An empty or missing query shows a "Type something to search" prompt and runs no query
- Add `searchItems(userId, query, page)` to `src/lib/db/items.ts`, always scoped by `userId`, returning the same `ItemPage` shape as the list queries (24 per page, pinned first, then newest)
- An item matches when the query appears, case-insensitively, in its title, description, content, URL, tag name or item type name. Split the query on whitespace and require every word to match somewhere (AND)
- Escape `%`, `_` and `\` so they search literally instead of acting as wildcards (Prisma's `contains` does not escape them)
- Show the result count pill, the query in the heading, a "No results for ..." empty state and a loading skeleton
- Results use `ItemCard`. The drawer opens through `?item=<id>` and keeps `q` and `page` in the URL, so closing it returns to the same results
- Another user's items never appear in results
- Verify in the browser (matches by title, content, tag and type, multi-word AND, special characters, empty and no-result states, pagination, drawer open and close, mobile layout), then run `npm run build`

## Tests

- The query schema trims, rejects over-long input and treats blank as no query
- `searchItems` scopes by `userId`, builds one condition group per word across all fields, escapes wildcard characters, matches tag and type names through relations and paginates (Prisma mocked)

## Notes

- Plain case-insensitive substring matching is enough at the free limit of 50 items and keeps partial words working ("hook" finds "useHook"). Postgres full-text search can replace it later behind the same function if Pro users grow large
- Content previews reuse the existing `left(content, n)` raw query so long content is never loaded just for a card

## References

- @context/coding-standards.md (Data Fetching, Validate all inputs with Zod)
- `src/lib/db/items.ts` (`getItemPage`)
- `src/app/(workspace)/collections/[id]/page.tsx`
