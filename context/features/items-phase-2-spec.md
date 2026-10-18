# Items Phase 2: Item Detail Drawer Spec

## Overview

Open an item in a right-side drawer to read it, with syntax highlighting for code and rendered Markdown for text.

## Requirements

- Add a `Sheet` component in `src/components/ui/sheet.tsx` on the Base UI Dialog primitive, sliding in from the right (full width on mobile, `max-w-xl` from `sm`)
- Clicking an `ItemCard` opens the drawer and sets `?item=<id>` on the URL, so a refresh or a shared link reopens it. Closing, Escape or the backdrop removes the param. Focus is trapped and returns to the card
- The page reads `searchParams` inside a `Suspense` and renders the drawer content on the server, so highlighting and Markdown rendering never ship to the client
- Add `getItemById(userId, id)` in `src/lib/db/items.ts` with the user in the `where` clause. An unknown id, or an id owned by another user, shows the same "Item not found" state, so existence is not revealed
- Drawer content:
  - Type icon and name, title, description, tags, created and updated dates
  - Snippet and Command: a code block highlighted with `shiki` using the item's `language`, falling back to plain text
  - Prompt and Note: Markdown rendered with `react-markdown` and `remark-gfm`, with raw HTML disabled
  - URL: the link shown as its hostname, opening in a new tab with `rel="noopener noreferrer"`, and only `http` and `https` URLs rendered as links
  - File and Image: file name and size only
- A "Copy" button for Snippet, Command, Prompt and URL items copies the content, with a "Copied" toast
- Dashboard pinned and recent item rows link to `/items/<type>?item=<id>` so they open the same drawer
- Verify in the browser (card click opens the drawer and sets the param, refresh keeps it open, Escape and backdrop close it, each type renders correctly, a link with a `javascript:` URL is not clickable, another user's item id shows the not-found state, dashboard rows open the drawer, mobile layout), then run `npm run build`

## Notes

- Install `shiki`, `react-markdown` and `remark-gfm`
- Shiki's generated HTML is the only HTML injected with `dangerouslySetInnerHTML`, and the code it highlights is escaped by Shiki
- Editing and deleting are not part of this phase

## References

- @context/project-overview.md (UI / UX)
- @context/coding-standards.md (Next.js, Data Fetching)
- `src/components/ui/dialog.tsx`
- `src/components/items/ItemCard.tsx`
- `src/lib/db/items.ts`
