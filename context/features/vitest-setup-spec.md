# Vitest Setup Spec

## Overview

Add Vitest for fast unit tests of logic and server code, and run it as the first step of the `/feature` workflow, ahead of the Playwright browser checks.

## Requirements

- Install `vitest` and add scripts: `npm test` (single run) and `npm run test:watch`
- Add `vitest.config.mts` with the `@/` path alias, a node environment by default and `src/**/*.test.{ts,tsx}` as the include pattern. Tests sit next to the code they cover
- Stub `server-only` in tests so server modules can be imported
- Tests never touch the Neon database, Redis or Resend. Prisma, Redis and Better Auth are mocked at the module boundary
- Add first tests that prove the setup and cover the highest-value logic:
  - `src/lib/item-schemas.ts`: title, description, tag and content limits, tag trimming, lowercasing and duplicates, per-type required fields, `http` and `https` only, URLs with credentials rejected, language list
  - `src/lib/tag-colors.ts`: known technologies, stable fallback color for unknown tags
  - `src/lib/pagination.ts` and `src/lib/relative-time.ts`
  - `src/actions/items.ts` (`createItem`): no session, invalid input, mutation limit message, free limit message at `FREE_ITEM_LIMIT`, Pro users skipping the limit, tags passed as `connectOrCreate`, retry on a write conflict, and generic errors that never expose database messages
  - `src/lib/rate-limit-actions.ts`: the 30th change passes, the 31st is blocked, and Redis failure fails open
- Add `@testing-library/react` with `jsdom` only for a small component test of `TagInput` (Enter and comma add, Backspace removes the last, maximum 10, pasted comma-separated tags)
- Update the `/feature` skill files in `.claude/skills/feature/`:
  - `start`: write or update unit tests for new logic and run `npm test` with lint, tsc and build
  - `test`: run `npm test` first and stop on failures before starting the browser
  - `finish`: `npm test` is part of the pre-commit checks
- Run `npm test` in the GitHub Actions checks workflow
- Update `CLAUDE.md` (Commands, and the "No test runner is configured" line) and `context/ai-interactions.md` (testing guidance) to describe the unit tests plus Playwright split
- Verify that `npm test` passes, a deliberately broken assertion fails, and `npm run lint`, `npx tsc --noEmit` and `npm run build` still pass

## Notes

- Playwright through `/feature test` remains the way to check layout, drawers, real Server Action flows and mobile behavior
- Keep tests small and about behavior, not implementation details
- Test files are excluded from the production build and the Next.js bundle

## References

- @context/coding-standards.md (Code Quality)
- @context/ai-interactions.md (Workflow)
- `.claude/skills/feature/`
- `.github/workflows/`
