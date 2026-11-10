# Custom Types Phase 1: Manage Custom Types Spec

## Overview

Pro users can create their own item types next to the seven built-in ones. This phase adds the types themselves: a page to list, create, edit and delete them, and the Server Actions behind it. Using a custom type for items comes in phase 2.

## Requirements

- A protected `/types` page (added to the route protection in `src/proxy.ts` and to `robots` private paths, with a link in the sidebar and mobile drawer) that lists the seven built-in types (read only) and the user's custom types, each with its icon, colour and item count
- Custom types are Pro only. The Pro check reads `isPro` from the database in each action, not from the session. A free user sees the page with an Upgrade prompt that opens the plan on `/profile#plan` and no create or edit controls; a free user who has custom types left over from Pro still sees a delete button on each
- A custom type has a name, an icon and a colour:
  - Name: 1 to 24 characters, letters, digits and hyphens only (no spaces, because the page address of a type is its name, as for the built-in types), trimmed. It can't equal a built-in type's name, including the old "URL" name and its "Link" label, compared without regard to case, and must be unique among the user's own types without regard to case
  - Icon: one of a fixed set of about 16 icons from `lucide-react`, stored by name and shared with the built-in icons in `src/lib/item-type-icons.ts`
  - Colour: one of a fixed palette of about 8 hex colours, none of them the seven built-in colours, in one shared list
  - The icon and colour lists live in one file, `src/lib/custom-type-options.ts`, used by the form, the schema and the tests
- A user can have at most 20 custom types, checked inside the same Serializable transaction that creates the type, with the write-conflict retry helper the item and collection actions share
- Server Actions `createItemType`, `updateItemType` and `deleteItemType` in `src/actions/item-types.ts`, returning `{ success, data, error }`, validated with Zod, on the shared mutation rate limit, with a `pro_required` error code that gives the Upgrade toast the other Pro-gated actions use
- Editing changes name, icon and colour. Renaming keeps the type's items and its address follows the new name
- Deleting is refused with a clear message while the type has items ("Move or delete its N items first"), checked in the same transaction as the delete. A type that belongs to another user, or a built-in one, answers "Type not found"
- The new and edit forms are one shared dialog (like the collection dialog), with the name field, an icon picker and a colour picker as accessible radio groups with arrow-key support and human names ("Red", "Book") instead of hex codes and component names, a live preview of the type's pill, field errors linked to their fields, and a toast for server errors. The delete confirmation names the type and stays open when the delete fails. At 20 types the New button is replaced by a short note that the limit is reached
- `/types` and the sidebar are revalidated after every change
- If a user's Pro plan ends, their custom types and the items in them stay as they are and can still be deleted; only creating and editing types needs Pro

## Tests

- Name schema: accepts letters, digits and hyphens, trims, rejects spaces, empty, 25 characters and built-in names in any letter case (including "url" and "link")
- Option lists: every icon name has an icon in `ITEM_TYPE_ICONS`, no colour equals a built-in colour, and the schema rejects an icon or colour outside the lists
- `createItemType`: rejects a free user with `pro_required`, rejects a duplicate name in a different case, enforces the 20-type limit inside the transaction, and retries on a write conflict
- `updateItemType` and `deleteItemType`: refuse another user's type and a built-in type, rename keeps items, and delete is refused while the type has items and works when it is empty and for a former Pro user
- The types page shows built-in types read only, shows an Upgrade prompt and no controls for a free user, and the form's pickers are labelled radio groups

## Notes

- A custom type's items hold text only (title, description, Markdown content, tags, collection), like a Note; this is decided in phase 2
- No new environment variable and no change to the built-in types or their seed
- Do not add sharing, reordering or per-type fields

## References

- `src/lib/db/item-types.ts`, `src/lib/item-type-icons.ts`, `prisma/schema.prisma` (`ItemType` already has `name`, `icon`, `color`, `isSystem` and `userId`, so no migration is expected)
- `src/actions/collections.ts` and the collection form dialog for the action and dialog patterns
