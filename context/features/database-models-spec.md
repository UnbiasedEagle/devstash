# Database Models Spec

## Overview

Define the Prisma schema for DevStash's data model and apply it to the Neon development database with an initial migration.

## Requirements

- Define the models in `prisma/schema.prisma`:
  - **User** — `isPro` flag, `stripeCustomerId`, `stripeSubscriptionId`; owns all other records
  - **Item** — `title`, `contentType` (`TEXT` / `FILE` / `URL`), `content`, `description`, file fields (`fileUrl`, `fileName`, `fileSize`), `url`, `language`, `isFavorite`, `isPinned`, timestamps; belongs to one ItemType and optionally one Collection
  - **ItemType** — `name`, `icon`, `color`, `isSystem`; `userId` is null for system types and set for Pro custom types
  - **Collection** — `name`, `description`, `isFavorite`, timestamps; holds mixed item types
  - **Tag** and **ItemTag** — per-user tags, many-to-many with items
  - **Session**, **Account**, **Verification** — Better Auth tables, added to the User model's relations
- Define `ContentType` as a Prisma enum
- Cascade deletes from User to everything it owns
- Add indexes on foreign keys and on the columns used for filtering (`userId`, `itemTypeId`, `collectionId`)
- Tag names are unique per user
- Generate the initial migration with `npx prisma migrate dev --name init`
- Edit the generated migration SQL to add a partial unique index on `ItemType.name` where `userId IS NULL`, because Postgres treats nulls as distinct
- Run `npx prisma migrate status` to confirm migrations are in sync

## Notes

- Never use `prisma db push`, only `prisma migrate dev`
- Run migrations against the Neon development branch, not production
- Check the current Prisma docs (Context7) for the Prisma 7 schema syntax
- Follow the Better Auth docs for the exact field names of its tables

## References

- @context/project-overview.md (Data Model)
- @context/coding-standards.md (Database)
- `prisma/schema.prisma`
