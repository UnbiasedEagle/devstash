# Seed Data Spec

## Overview

Add a seed script that fills the Neon development database with the system item types and a demo account holding sample collections and items, so the schema can be exercised with realistic data.

## Requirements

- Create `prisma/seed.ts` and register it in `prisma.config.ts` so `prisma db seed` runs it
- Add an `npm run db:seed` script
- Run the script with `tsx`, installed as a dev dependency
- Seed the 7 system item types (`userId` null, `isSystem` true), using the names, icons and colors from `src/lib/mock-data.ts`:
  - Snippet, Prompt, Command, Note, File, Image, URL
- Seed a demo user with a hashed password: `demo@devstash.io`, `isPro` false, email verified
- Seed the 6 collections from `src/lib/mock-data.ts` for the demo user: React Patterns, Python Snippets, Context Files, Interview Prep, Git Commands, AI Prompts
- Seed at least 2 realistic items per collection, with real content instead of placeholder text, using the right `contentType` (`TEXT` for snippet, prompt, command and note; `URL` for links)
- Set `language` on snippets and commands
- Seed tags and attach them to items through `ItemTag`
- Mark some items as favorite and some as pinned
- The script must be safe to re-run:
  - Upsert the system item types
  - Clear and recreate the demo user's data, leaving other users untouched
- Log what was created, and exit non-zero on failure
- Use its own Prisma client built with the Neon adapter and `DATABASE_URL`, not the shared client in `src/lib/prisma.ts`
- Verify with `npm run db:seed` run twice (no errors, no duplicate rows), then check the rows in `npm run db:studio`

## Notes

- Seed against the Neon development branch, never production
- No real credentials in the seed file; the demo password is a throwaway for local development only
- Confirm the password hash format matches what Better Auth expects before relying on the demo login
- The seed script is not run by the app or by `prisma migrate dev`

## References

- @context/project-overview.md (Data Model)
- @context/coding-standards.md (Database)
- `src/lib/mock-data.ts`
- `prisma/schema.prisma`
