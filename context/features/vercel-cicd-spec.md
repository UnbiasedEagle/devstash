# Vercel CI/CD Spec

## Overview

Deploy DevStash to Vercel from GitHub, with production deploys from `main`, preview deploys for every branch and pull request, and CI checks that block a broken change before it ships.

## Requirements

- Connect the GitHub repo (`UnbiasedEagle/devstash`) to a Vercel project through Vercel's GitHub integration
- Every push to `main` deploys to production
- Every pull request and feature branch gets its own preview deployment
- Add a `vercel-build` npm script that runs `prisma generate`, `prisma migrate deploy` and `next build`, because `src/generated/prisma` is gitignored and migrations must be applied before the app starts
- Add a GitHub Actions workflow at `.github/workflows/ci.yml` that runs `npm ci`, `npm run lint` and `npx tsc --noEmit` on pull requests and on pushes to `main`
- Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in Vercel for Production and Preview; `prisma migrate deploy` uses the direct URL
- Neon already has `production` and `development` branches: Production env vars point at `production`, Preview env vars point at `development`, so preview deployments never migrate the production database
- Document the required environment variables in `.env.example`
- Verify by opening a pull request and checking that CI passes and a preview URL is created, then merging and checking the production deploy. Run `npm run build` locally first

## Notes

- Vercel deploys on its own, so the workflow only runs checks and has no deploy step
- Never run `prisma db push` or the seed script as part of a deploy
- No application code changes

## References

- @context/coding-standards.md (Database)
- @context/features/prisma-neon-setup-spec.md
- `package.json`
- `prisma.config.ts`
