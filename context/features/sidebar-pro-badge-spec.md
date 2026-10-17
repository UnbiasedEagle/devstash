# Sidebar Pro Badge Spec

## Overview

Show a PRO badge next to the File and Image item types in the sidebar, so users can see at a glance that adding those types requires a Pro plan.

## Requirements

- Render a small "PRO" badge on the File and Image rows in the sidebar Types section
- Place it between the type name and the item count
- Use a muted, compact style that fits the dark graphite theme (small uppercase text, subtle border or background, rounded)
- Hide it when the sidebar is collapsed to the icon rail, like the other row labels (`COLLAPSED_INVISIBLE`)
- Show it to every user regardless of plan, since it only marks which types are Pro
- Keep the list of Pro types in one constant so it is easy to change
- Build the badge as a small reusable `ProBadge` component in `src/components/dashboard/ProBadge.tsx`
- Verify in the browser in expanded, collapsed and mobile drawer states, then run `npm run build`

## Notes

- Display only: no gating or upload restrictions, no changes to the database, queries or `isPro` handling
- Matches Pro-only types by item type name (`file`, `image`)

## References

- @context/project-overview.md (Monetization)
- @context/coding-standards.md (Styling)
- `src/components/dashboard/Sidebar.tsx`
- @context/screenshots/dashboard-ui-main.png
