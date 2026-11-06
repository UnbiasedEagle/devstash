# Tags Phase 1: Tag Pages Spec

## Overview

Let users browse their items by tag: an index of all their tags and a page per tag listing its items.

## Requirements

- Add a protected `/tags` page in the `(workspace)` group listing the user's tags with their item counts, ordered by count then name, using the existing tag color dot, with an empty state and a loading skeleton. Add `/tags` to the route protection in `src/proxy.ts`
- Add a protected `/tags/[name]` page listing the tag's items with `ItemCard`, a count pill and `?page=N` pagination (24 per page), with a loading skeleton
- Validate the route param with a shared Zod schema (trimmed, lowercased like the stored tags, max `MAX_TAG_LENGTH`). Show a not-found state when the tag does not exist or belongs to another user
- Add `getTagsWithCounts(userId)` and `getTagByName(userId, name)` to a new `src/lib/db/tags.ts` and `getItemsByTag(userId, tagId, page)` to `src/lib/db/items.ts`, all scoped by `userId`
- The item drawer keeps working on tag pages through `?item=<id>` and returns to the same page and tag when closed. An item opened here can be of any type
- Add a "Tags" link to the sidebar and to the mobile drawer, next to the collections section, hidden from the collapsed rail the same way other labels are
- Verify in the browser (index and detail render, counts match, pagination, empty tag list, another user's tag shows not found, drawer opens and closes on a tag page, mobile layout), then run `npm run build`

## Tests

- The tag route schema trims, lowercases and rejects empty and over-long names
- `getTagsWithCounts`, `getTagByName` and `getItemsByTag` scope by `userId` and paginate correctly (Prisma mocked)

## Notes

- Mirrors `/collections/[id]` from collections phase 1. Reuse `ItemCard`, `Pagination`, `OpenItemContent` and the skeleton patterns
- Tag names are stored lowercase and are unique per user, so the route uses the name rather than the id and stays readable and shareable. Encode the name in links
- No rename or delete for tags in this feature. Unused tags are already removed when their last item is deleted

## References

- @context/coding-standards.md (Next.js, Data Fetching)
- `src/app/(workspace)/collections/[id]/page.tsx`
- `src/lib/db/items.ts`, `src/lib/tag-colors.ts`
