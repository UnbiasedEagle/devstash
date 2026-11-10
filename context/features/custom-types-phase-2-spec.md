# Custom Types Phase 2: Use Custom Types Spec

## Overview

Make custom types work everywhere an item type does: the sidebar, the New Item dialog, the type page, item cards, the drawer, editing and search.

## Requirements

- A custom type's items hold text like a Note: title, description, Markdown content (the shared Markdown editor with Write and Preview), tags and an optional collection. They are stored with `contentType` TEXT, so no schema change is needed
- The sidebar lists the user's custom types after the built-in ones, with their icon, colour and item count, each linking to `/items/<name in lower case>`. The type page, pagination and drawer already work by name and keep working; names can't clash with built-in ones, so the lookup is unambiguous
- The New Item dialog lists custom types after the built-in ones. Choosing one shows the Note fields. Creating an item in a custom type needs no Pro check (the type already exists), and the free item limit still applies
- `createItem` and `updateItem` accept a custom type by id for the signed-in user and treat it as text: the type must belong to the user, otherwise "Type not found". The built-in union in `src/lib/item-schemas.ts` stays as it is for the seven types
- Item cards, dashboard rows, the drawer header, the edit form (type locked, as today) and search results show the custom type's own icon and colour and its name as the label
- Quick search and `/search` match a custom type by name like a built-in one
- The `/types` page's item counts and the sidebar counts agree, and counts and lists are revalidated after item mutations, as for built-in types
- Deleting an item that was the last one in a type leaves the type in place (phase 1 refuses deleting a type with items, and allows it once empty)
- Export (JSON and ZIP) includes custom types: each item's type name is its custom type's name, and the JSON lists the user's custom types with name, icon and colour
- The pricing section and the Pro plan card list "Custom item types" as a Pro feature, and the landing page names it in the plan; nothing else on the landing page changes
- A former Pro user keeps seeing and using their custom types and items; only creating and editing types is gated (phase 1)

## Tests

- `createItem` and `updateItem` with a custom type: accept the user's own type as text, reject another user's type and an unknown id with "Type not found", and keep the free limit
- The type queries return built-in types first and custom types after, with counts that agree between the sidebar and `/types`
- The item card, row and drawer header show a custom type's icon, colour and name
- The New Item dialog lists custom types after the built-in ones and shows the Note fields for one
- Export lists custom types and uses their names on items
- The Pro plan lists custom item types on the pricing section and the plan card

## Notes

- Depends on phase 1
- Custom types are text only; per-type fields and file or link custom types are not part of this feature
- Import from files and AI are not touched

## References

- `src/lib/item-schemas.ts`, `src/actions/items.ts`, `src/components/items/ItemTypeSelector.tsx`, `NewItemDialog.tsx`, `ItemCard.tsx`, `ItemDrawerHeader.tsx`
- `src/lib/export.ts`, `src/components/landing/PricingSection.tsx`, `src/components/profile/PlanCard.tsx`
