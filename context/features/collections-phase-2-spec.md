# Collections Phase 2: Create Collection Spec

## Overview

Let users create collections from the `/collections` page, within the free plan limit.

## Requirements

- Add shared Zod schemas in `src/lib/collection-schemas.ts` (name required and trimmed, description optional)
- Add `createCollection` to `src/actions/collections.ts`, returning `{ success, data, error }`, with try/catch and the signed-in user from the session
- Count it against the shared mutation limit used by the item actions
- Enforce the free limit of 3 collections inside a Serializable transaction, as `createItem` does. Pro users are unlimited. Reaching the limit returns a clear error
- Add a New Collection button and dialog (reusing `Dialog`) on `/collections`, with inline validation, a success toast and revalidation of the index, the dashboard, the sidebar and `/profile` usage
- Disable the submit button while the request runs
- Verify in the browser (create, validation errors, limit reached on the fourth collection, new collection appears in the index and sidebar, mobile layout), then run `npm run build`

## Tests

- Schema accepts valid input and rejects empty or oversized names
- `createCollection`: success, unauthenticated, rate limited, free limit reached

## References

- @context/coding-standards.md (Error Handling, Data Fetching)
- `src/actions/items.ts`
- `src/lib/plan-limits.ts`
