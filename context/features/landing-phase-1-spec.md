# Landing Page Phase 1: Page and Sections Spec

## Overview

Replace the bare `/` page with a landing page that shows what DevStash looks like, says what it holds, states the plans and sends visitors to sign up. The page is product-first: real pieces of the interface, shown at a readable size, are the main pictures.

## Design

The design is a finished prototype in `context/landing-prototype.html` (open it in a browser to see it). Follow it for layout, copy and spacing; rebuild it with Tailwind classes and the project's components rather than copying its CSS. `context/screenshots/dashboard-ui-main.png` is the real interface the pictures are based on.

- The product is the picture. The hero shows two real pieces of the interface layered (the item drawer with highlighted code, and the Ctrl K search floating over it), each at its normal size. A later section shows the full dashboard at the full page width. Pieces are never shrunk to fit a narrow column: if a piece doesn't fit, show fewer pieces
- The app's graphite theme and fonts: Schibsted Grotesk for everything, JetBrains Mono only for code and file names. The app is dark only, so there is no light variant to build
- The only color on the page is the seven item type colors (Snippet `#3b82f6`, Prompt `#8b5cf6`, Command `#f97316`, Note `#fde047`, File `#8b93a0`, Image `#ec4899`, Link `#10b981`), and only on real content: item type icons, soft tinted pills, the colored left edge of cards and the underline under matched words. No color strips or filled color blocks
- The DevStash logo is the real one from `src/components/dashboard/Sidebar.tsx` (a rounded square with the indigo-to-purple gradient and the white layers icon), used next to the wordmark in the page header and in the dashboard picture. It and the soft fade under the cropped dashboard picture are the only gradients on the page. The floating search panel has one shadow so it reads as floating; nothing else has one
- Balanced, not loud: one large headline (up to about 3.75rem, three lines in its column), consistent section spacing, nothing inverted. Both plan panels stay dark, with Pro on a slightly lighter panel
- Left aligned and flat: no emoji, no numbered markers, no all-caps labels. Headlines use balanced wrapping. Lines stay under about 80 characters
- The pictures use the app's own components and styles where they exist (item type icons, pills, chips), so they stay true to the product, and are drawn as static markup, not screenshots
- Each picture has a solid background (so one that overlaps another hides it) and hides itself with `aria-hidden` on its own root, with no headings inside it, so it can't disturb the page's heading order if it is moved
- The numbers in the pictures are consistent and plausible for a free account: item counts add up to less than the free item limit, there are no more collections than the free limit, and a collection shows the same count everywhere it appears
- Numbers and prices come from one place: the free limits and the Pro prices (and the yearly saving, worked out from them) from `src/lib/plan-limits.ts`, shared with the plan card, and the upload size from `src/lib/upload-rules.ts`. The type colors mirror `prisma/seed.ts`, checked by a test, except the File gray, which is lightened so it can be read as text

## Requirements

- `src/app/page.tsx` renders the landing page. Its pieces live in `src/components/landing/` (header, hero, the pictures, feature sections, pricing, closing call to action, footer), as server components, so the page is prerendered
- `src/proxy.ts` sends a visitor with a session cookie from `/` to `/dashboard` with a real redirect before any page is sent, so the page itself stays fully static and a signed-in visitor never sees it flash. Only the cookie is checked, as for the other protected pages: a visitor with a stale cookie is sent on to sign in, where the session is validated
- Header: the logo and wordmark, "Pricing" (jumps to the plans), "Sign in" (`/sign-in`) and a "Get started" button (`/sign-up`). Below the small breakpoint only "Get started" remains
- Hero, in two columns: the copy on the left and the layered pictures on the right. The copy is left aligned: the headline "Never solve the same problem twice.", one supporting sentence ("DevStash keeps your snippets, commands, prompts, notes and links in one place and finds them with one search."), and a single "Start for free" button (`/sign-up`) with the line "Free for up to 50 items. No card needed." under it (the number comes from `plan-limits.ts`). The right column holds the item drawer (a Snippet with its title, description, highlighted code, Copy button, tags and collection) on the left and the search panel (query "debounce", results grouped under Snippets, Notes and Links with the matched word underlined) on the right, overlapping the empty end of the code lines. The two columns and the layering start at the extra large breakpoint (1280px), where the right column is wide enough for the pictures to overlap only their empty edges. Below it the copy comes first and the pictures sit side by side (from 1024px) or stack at full width
- The pictures are decorative, so they are hidden from assistive technology and followed by a visually hidden sentence that says what they show
- A row of the seven item types with their icons and names, directly under the hero
- "Everything you keep, in one place.": the full dashboard picture at the page width (sidebar of item types with counts and collections, search bar, collection cards with a colored left edge, pinned items), cropped at the bottom with a soft fade. Below the medium breakpoint the sidebar is dropped and fewer cards show
- "Files and images, kept with the rest.": copy on the left and a view on the right with a diagram preview, an image row and a file row, each with name, size, type and a Download button
- "Group it the way you work.": copy on the left with a short list (tags, favorites and pins, export) and a collection of mixed items with tags on the right
- "Free until you outgrow it.": Free next to Pro. The Free item and collection numbers come from `src/lib/plan-limits.ts`, so the copy can't drift. Pro is $8 a month or $72 a year, as on the plan card. Only what exists today is listed: unlimited items and collections, file uploads up to 10 MB, and export as JSON or ZIP. Both plan buttons go to `/sign-up`, and the Pro one reads "Start with Pro"
- Closing call to action and a footer with "Sign in" and "Create an account"
- The type colors and their text classes live in one small lookup in `src/components/landing/`, with no inline styles. Icons come from the icon set the app already uses
- Responsive from 360px: the plans and feature sections stack, rows in the pictures stack their label above the text, and nothing scrolls sideways
- One `h1`, headings in order, landmarks for header, main and footer, visible keyboard focus, and text that meets contrast on the graphite background
- Verify in the browser (signed out at desktop, tablet and phone width, signed in is sent to the dashboard, every link and the jump to the plans, tab order, no horizontal scroll, no console errors, the hero pictures are readable and not cramped), then run `npm run build`

## Tests

- The page shows the headline and the seven item types, and every call to action points to the right route (`/sign-up`, `/sign-in`, the plans); the reassurance line uses the Free item limit
- The plans use the limits from `plan-limits.ts` and the Pro prices, and list no feature that isn't built
- The pictures are hidden from assistive technology and the hero has the hidden description
- The search picture shows results grouped under their kind headings, and the drawer picture shows its code and tags (component tests, no network); each picture hides itself, has no headings and has a solid background
- The proxy sends a visitor with a session cookie from `/` to `/dashboard`, lets one without a cookie see `/`, still sends a visitor without a cookie from the protected pages to sign in, and its matcher covers `/` and the protected pages
- The type colors match the seed (the File gray excepted), and the pricing uses the shared price constants and the real upload size

## Notes

- Do not add other pages, a blog, testimonials or a changelog; this is one page
- Keep the copy as written in the prototype unless it is wrong about the product
- The pictures are plain markup on purpose: nothing in them fetches data or runs code
- The redirect lives in `src/proxy.ts` (an earlier version checked the session in the page, which sent the whole page first and redirected afterwards, so signed-in visitors saw a flash)

## References

- `context/landing-prototype.html` and `context/screenshots/dashboard-ui-main.png`
- `src/components/auth/SignedInRedirect.tsx` and `StashPreview.tsx`
- `src/components/dashboard/Sidebar.tsx` for the logo
- `src/components/profile/PlanCard.tsx` for the prices, `src/lib/plan-limits.ts` for the limits
- `src/app/globals.css` for the theme tokens, `src/lib/item-type-icons.ts` for the icons
