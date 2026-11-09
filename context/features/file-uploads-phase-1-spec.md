# File Uploads Phase 1: Storage Foundation Spec

## Overview

Let the app hand out short-lived, validated upload links for a private Cloudflare R2 bucket. This phase has no screens: it adds the storage layer and the Server Action the later phases build on.

## Requirements

- Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (R2 is S3 compatible) and add a server-only storage client in `src/lib/storage.ts`
- Validate the new env vars with Zod in `src/lib/env.ts` like the other groups: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`. Add them to `.env.example` and the README env table, noting they must be set in every Vercel environment
- Put the upload rules in `src/lib/upload-rules.ts` so the client and the server share them:
  - Two kinds: `image` (png, jpeg, gif, webp, max 5 MB) and `file` (pdf, plain text, markdown, json, csv, zip and the Word, Excel and PowerPoint formats, max 10 MB). SVG and executables are not allowed
  - The extension decides the stored type. The declared MIME type must agree with it: empty, the type itself or a known alias (browsers send an empty type for Markdown and spreadsheet or compressed types for CSV and ZIP on Windows). `requestUpload` returns the canonical type, which the link signs and the browser must send
  - A helper that cleans a file name (no path parts, control characters or leading dots, at most 120 characters) and one that builds the object key
- Objects are first uploaded under `pending/{userId}/{uuid}` and only moved to `files/{userId}/{uuid}` once an item is created in phase 2. The key never contains the user's file name
- `parsePendingKey(userId, key)` in `src/lib/upload-rules.ts` accepts only the user's own `pending/{userId}/{uuid}` key, and it is the only way a key that came back from the browser may reach storage
- `src/lib/storage.ts` exports `createUploadUrl`, `createDownloadUrl`, `getObjectInfo` (which also returns the ETag), `moveObject` (which can require the ETag to still match, since an upload link can be used again until it expires) and `deleteObject`. `createDownloadUrl` refuses a stored type that isn't allowed for its kind. Upload links expire after 5 minutes and sign the exact `Content-Type` and `Content-Length`, so R2 rejects an upload that differs from what was approved. Download links expire after 10 minutes, force `attachment` for files and the stored type for images
- Add a `requestUpload({ kind, fileName, mimeType, size })` Server Action in `src/actions/uploads.ts` returning `{ success, data, error }` with `{ uploadUrl, key }`. It requires a session, validates the input with Zod and the rules above, runs on its own, tighter per-user upload limit (10 a minute, since every link lets someone store up to 10 MB), and rejects the `file` kind for free users with a code that lets the UI offer an upgrade (the `image` kind is free)
- Verify with curl against a real bucket: a valid image upload succeeds, a wrong size or type is rejected by R2, an expired or tampered link is rejected, and a free user gets the Pro message for a file. Then run `npm run build`

## Tests

- The rules accept each allowed type and reject SVG, executables, a MIME type that doesn't match the extension, oversize files and empty files
- File name cleaning removes path parts, control characters and leading dots and shortens long names; the object key contains the user id and never the file name
- `requestUpload` rejects signed-out users and bad input, rejects the `file` kind for free users but not Pro users, allows `image` for free users, and returns the link and key (Storage, Prisma and auth mocked)

## Notes

- Prerequisites on your side: an R2 bucket (private, no public access), an API token with Object Read & Write on that bucket, and a CORS rule on the bucket that allows `PUT` from `http://localhost:3000` and the production domain with the `Content-Type` header
- Free users can upload images and Pro users can upload both, as in the pricing table. The free item limit of 50 still applies to every item, uploads included
- Images and files are different kinds but are stored the same way, under the same key layout

## References

- @context/project-overview.md (File Storage, Monetization)
- `src/lib/env.ts`, `src/lib/rate-limit-actions.ts`, `src/lib/stripe.ts` (server-only client pattern)
- `src/actions/billing.ts` (action pattern)
