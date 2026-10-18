# Items Phase 3: Create Item Spec

## Overview

Let users create text and URL items from a "New Item" dialog, with validation, tags and the free plan limit enforced on the server.

## Requirements

- Add `createItem` as a Server Action in `src/actions/items.ts`, returning `{ success, data, error }`. It validates with Zod, requires a session and never accepts a user id from the client
- Add Zod schemas in `src/lib/item-schemas.ts`, shared by the form and the action:
  - All types: `title` trimmed, 1 to 200 characters. `description` optional, up to 500. `tags` up to 10, each trimmed and lowercased, 1 to 30 characters, no duplicates
  - Snippet, Command, Prompt and Note: `content` required, up to 50,000 characters. Snippet and Command also take an optional `language` from a fixed list (`typescript`, `javascript`, `python`, `bash`, `json`, `html`, `css`, `sql`, `go`, `rust`, `java`, `plaintext`)
  - URL: `url` required, `http` or `https`, up to 2048 characters
- Enforce the free plan limit on the server: a user without Pro cannot exceed `FREE_ITEM_LIMIT` items, and gets a clear message when they try
- Save tags with `connectOrCreate` on the user's own tags (unique per user and name) in one Prisma call
- Add a shared mutation limit in `src/lib/rate-limit-actions.ts`, reusing the Redis client: 30 item changes per minute per user, across create, update and delete. A user over the limit gets "Too many changes, try again in a minute"
- Make the "New Item" button in the top bar open a create dialog:
  - A type selector for Snippet, Prompt, Command, Note and URL, preselected from the current `/items/[type]` page. File and Image show a Pro badge and are not selectable
  - Fields for the chosen type, with content in a monospace textarea for Snippet and Command
  - A chip input for tags: Enter or comma adds, Backspace removes the last, a maximum of 10
  - Client validation with the same schemas, inline field errors, a pending state on submit and a destructive toast for server errors
- On success, close the dialog, show a "Snippet created" style toast and revalidate `/dashboard`, `/items/[type]` and the sidebar counts so they update without a reload
- Verify in the browser (create each type, validation errors, tag chips, preselected type on a type page, the new item and the sidebar count appear immediately, the free limit blocks item 51, the mutation limit blocks a rapid loop, mobile layout), then run `npm run build`

## Notes

- Items are created for the signed-in user only. The type is fixed once created
- The `Dialog` component already exists in `src/components/ui/dialog.tsx`
- The action returns user-friendly errors and never exposes database messages

## References

- @context/project-overview.md (Core Features, Monetization)
- @context/coding-standards.md (Next.js, Data Fetching, Error Handling)
- `src/lib/plan-limits.ts`
- `src/lib/redis.ts`
- `src/components/dashboard/TopBar.tsx`
