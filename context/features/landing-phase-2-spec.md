# Landing Page Phase 2: Page Metadata Spec

## Overview

Give the landing page what search engines and link previews need.

## Requirements

- The page has a proper title and description, Open Graph and Twitter card tags and a generated share image (the headline on the graphite background, in the page's font), using `BETTER_AUTH_URL` as the base address so no new environment variable is added
- `robots` allows `/` and keeps the app's private routes out (dashboard, profile, items, collections, search, tags, and the API), and a sitemap lists `/` only
- Verify in the browser (the share image renders, `/robots.txt` and `/sitemap.xml` answer, the tags are in the page source), then run `npm run build`

## Tests

- The robots rules disallow the private routes and allow `/`, and the sitemap lists only `/`
- The page metadata has a title, a description and the Open Graph and Twitter fields

## Notes

- The share image is generated with the framework's image support, not a stored file
- The landing page has no animation, so there is nothing to pause or reduce for motion

## References

- Phase 1 spec and `src/components/landing/`
- `src/app/layout.tsx` for the existing metadata
