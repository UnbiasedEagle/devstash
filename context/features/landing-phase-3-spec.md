# Landing Page Phase 3: Show the Built Features Spec

## Overview

Show every main feature the app has today as a picture on the landing page. Favorites and pins, the Markdown editor and export are only named in a list or a plan line so far; give each a picture, like search, collections and files already have.

## Requirements

- Three new sections in `src/components/landing/`, as server components with static pictures, in the style of phase 1 (same classes, solid picture background, `aria-hidden` on the picture's root, no headings inside it, type colors only on real content):
  - "Write notes and prompts in Markdown.": copy with a short line that it also covers prompts, and a picture of the editor with the Write and Preview tabs, a Note being written (a heading, a list and a code span) with the Write tab active
  - "Keep the daily ones close.": copy on favorites and pins, and a picture of an item list where some rows carry the pin icon and the filled star, as in the app
  - "Take it with you.": copy on export, and a picture of the Export card with the two buttons (JSON and ZIP) and a Pro pill, next to the ZIP's contents (`export.json` and a `files/` folder with an image and a file)
- The section order alternates the picture's side so the page has a rhythm: files (picture right), Markdown (left), collections (right), favorites and pins (left), export (right). Below the large breakpoint every section stacks with the copy first
- The collections section's short list keeps only Tags; favorites and pins and export now have their own sections, so they are removed from it
- Copy is plain and says only what exists: the Markdown editor has Write and Preview and is used for notes and prompts; export is JSON or a ZIP with the files and is a Pro feature (say so in the section and show the Pro pill, as the plan already lists it)
- Numbers and names in the pictures are consistent with the other pictures (same item titles where the same items appear) and need no new constants; the Pro pill and the ZIP file names use plain text
- One `h2` per section, headings in order, text that meets contrast on the graphite background, nothing scrolls sideways from 360px
- Verify in the browser (the three sections at desktop and phone width, alternating sides, no horizontal scroll, no console errors), then run `npm run build`

## Tests

- The page shows the three new headings in order after the files section and before the plans
- Each new picture hides itself from assistive technology, has no headings and has a solid background
- The collections section no longer lists favorites and pins or export, and keeps Tags
- The export picture marks export as Pro and shows both the JSON and the ZIP choices; the favorites picture shows both the pin and the star

## Notes

- Do not add new pages, other features or animation; the page stays fully static
- The filled star uses the app's own yellow star, as on the item cards; it is the one color outside the seven type colors and it matches the real interface
- Custom types, import from files and AI are not built, so they are not shown

## References

- Phase 1 spec and `src/components/landing/`
- `src/components/items/ItemFlagIcons.tsx`, `src/components/items/MarkdownEditor.tsx` and `src/components/profile/ExportCard.tsx` for what the pictures copy
