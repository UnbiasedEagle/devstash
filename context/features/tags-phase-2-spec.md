# Tags Phase 2: Clickable Tags Spec

## Overview

Make every tag chip a link to its tag page, so users can jump from an item to everything else with the same tag.

## Requirements

- Turn the tag chips in the item drawer into links to `/tags/[name]`, with the name URL-encoded and an accessible label such as "Tag: react"
- Turn the tag chips on `ItemCard` into links as well. They must sit above the card's stretched item link so clicking a tag opens the tag page and clicking anywhere else still opens the drawer, without breaking the card's focus ring
- Leave the compact dashboard rows (`ItemRow`) as plain chips, since the whole row already opens the drawer
- Clicking a tag in the drawer closes the drawer and goes to the tag page without leaving the drawer open over it
- Chips keep their current look; add only a hover and keyboard focus state
- Verify in the browser (tag link from a card and from the drawer, card click still opens the drawer, keyboard order and focus ring, tag with a space or special character in its name, mobile touch targets), then run `npm run build`

## Tests

- The tag link builds an encoded `/tags/[name]` href, including names with spaces and reserved characters

## Notes

- Reuse the existing stretched-link pattern from `CollectionCard` and `ItemCard`, where the buttons sit above the link
- Do not change the search popup, which already shows tags as plain text

## References

- `src/components/items/TagChip.tsx`
- `src/components/items/ItemCard.tsx`
- `src/components/items/ItemDrawerHeader.tsx`
