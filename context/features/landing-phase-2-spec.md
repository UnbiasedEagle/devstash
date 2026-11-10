# Landing Page Phase 2: Page Metadata Spec

## Overview

Give the landing page what search engines and link previews need.

## Requirements

- The page has a proper title and description, Open Graph and Twitter card tags and a generated share image (the headline on the graphite background, in the page's font), using `BETTER_AUTH_URL` as the base address so no new environment variable is added
- The base address is read from `BETTER_AUTH_URL` alone, validated on its own in `src/lib/site-url.ts` (server only), and not through `src/lib/env.ts`, which checks every service's settings at once: a missing Stripe or R2 key must not take the landing page, the robots file and the sitemap down with it
- `robots` allows `/` and keeps the app's private routes out (dashboard, profile, items, collections, search, tags, and the API), and a sitemap lists `/` only. On a preview deployment (`VERCEL_ENV` is `preview`) it disallows everything and lists no sitemap
- The pages behind sign-in and the sign-in pages carry a `noindex` robots tag (a shared constant used by the workspace and auth layouts), because the robots file only stops crawling and doesn't remove a page from search results
- The headline and the page title are written once in `src/lib/site-copy.ts` and used by the hero, the page tags and the share image, so they can't drift apart
- Verify in the browser (the share image renders, `/robots.txt` and `/sitemap.xml` answer, the tags are in the page source), then run `npm run build`

## Tests

- The robots rules disallow the private routes and allow `/`, disallow everything on a preview deployment, and the sitemap lists only `/`
- The page metadata has a title, a description and the Open Graph and Twitter fields, and the page title is made from the headline
- The site address is the origin of the auth address (without a path or trailing slash), works with only that one setting present without loading the full env file, and fails when it isn't a URL
- The workspace and auth layouts ask search engines not to index their pages
- The share image is a real PNG of the right size and is described by the page title

## Notes

- The share image is generated with the framework's image support, not a stored file
- The landing page has no animation, so there is nothing to pause or reduce for motion

## References

- Phase 1 spec and `src/components/landing/`
- `src/app/layout.tsx` for the existing metadata
