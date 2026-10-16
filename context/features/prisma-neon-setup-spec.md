# Prisma and Neon Setup Spec

## Overview

Set up Prisma ORM and connect it to our Neon PostgreSQL database.

## Requirements

- Install Prisma and the Neon driver adapter, using the latest stable Prisma version. Check the current Prisma docs (Context7) for the right setup.
- Initialize Prisma with `prisma/schema.prisma` using the `postgresql` provider
- Use Neon's pooled connection string for the app and the direct connection string for migrations
- Add `DATABASE_URL` and `DIRECT_URL` to `.env`
- Add `.env.example` with the variable names and placeholder values
- Make sure `.env` is ignored by git
- Create a single shared Prisma client in `src/lib/prisma.ts`, reused across hot reloads in development
- Add npm scripts for generate, migrate dev and studio
- Verify the connection works with a throwaway query that is not committed

## Notes

- Use the Neon development branch connection strings, not production
- Never commit credentials or real connection strings

## References

- @context/project-overview.md (Tech Stack)
- @context/coding-standards.md (Database)
