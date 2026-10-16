# Dashboard Skeletons Spec

## Overview

Replace the plain loading placeholders on the dashboard with skeletons that match the real layout, so content doesn't jump when the data arrives.

## Requirements

- Add the ShadCN `skeleton` component
- Main dashboard area: a skeleton for each section that mirrors its final shape
  - Stats card: four stat blocks and the item type bar with its legend
  - Recent collections: 6 collection cards in the same grid
  - Pinned and Recent items: item rows with an icon, title, description and date
- Sidebar: skeleton rows for the Types section and the Collections section (Favorites and Recent), and a skeleton for the user area
- Keep the real headings and section titles visible while loading; only the data is skeletonized
- Skeletons use the same spacing, borders and card styles as the real components so the layout doesn't shift when data loads
- Skeletons respect the collapsed sidebar state and the mobile drawer
- Mark skeletons `aria-hidden`, and keep the page accessible while loading
- Define each skeleton next to the component it mirrors (for example `CollectionCardSkeleton` beside `CollectionCard`)
- Replace the current `DashboardSkeleton` and the sidebar fallbacks
- Verify by throttling the network or slowing a query in the browser, and run `npm run build`

## Notes

- No changes to the queries or the data returned
- Keep the dark-mode-first look and the current theme tokens

## References

- @context/features/dashboard-db-phase-1-spec.md
- @context/features/dashboard-db-phase-2-spec.md
- @context/coding-standards.md (Styling)
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/Sidebar.tsx`
