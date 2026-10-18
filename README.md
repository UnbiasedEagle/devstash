# DevStash

**One searchable home for everything a developer keeps: snippets, commands, prompts, notes, files, images and links.**

Developers scatter their essentials across VS Code, Notion, chat history, bookmarks and `.txt` files. DevStash is a single hub where all of it lives, organized into collections and built to be found fast.

**Live:** [getdevstash.com](https://getdevstash.com)

> **Status: work in progress.** Authentication and the dashboard shell are done. Item and collection editing, search, AI features and billing are still ahead. See [Roadmap](#roadmap).

## What works today

- **Authentication**
  - Email and password sign-up with required email verification, sent through Resend
  - GitHub OAuth sign-in
  - Forgot and reset password with expiring, single-use links
  - Account linking guarded by verified emails, so a sign-in can't take over an unverified account
  - Route protection for the dashboard, with sessions validated on the server
- **Dashboard**
  - Stats overview, recent collections, pinned items and recent items, read straight from the database
  - Collapsible sidebar with item types, favorite and recent collections, and the signed-in user
  - Mobile drawer with an account card and sign out
  - Loading skeletons that stream each section in on its own
- **Data model** for users, items, item types, collections and tags, with a seed script for the system item types

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) and React 19 |
| Language | TypeScript (strict) |
| Database | Neon PostgreSQL with Prisma 7 |
| Auth | Better Auth (email and password, GitHub OAuth) |
| Email | Resend |
| UI | Tailwind CSS v4 and shadcn/ui |
| Validation | Zod |
| Hosting | Vercel, with GitHub Actions running lint and typecheck |

## How it's built

- **Server Components first.** Pages fetch with Prisma directly. Mutations go through Server Actions, and route handlers exist only where a protocol requires them, such as the auth endpoints.
- **Every query is scoped to the signed-in user**, and inputs are validated with Zod.
- **Migrations only.** Schema changes go through `prisma migrate`, and production runs `prisma migrate deploy` before the app starts.
- **Auth is designed against abuse:** the same response for known and unknown emails, emails sent after the response so timing doesn't leak, a per-user cap on reset emails, and sessions revoked on password reset.

## Getting started

You need Node.js 20 or newer, a [Neon](https://neon.tech) database, and optionally a GitHub OAuth app and a [Resend](https://resend.com) account.

```bash
git clone https://github.com/UnbiasedEagle/devstash.git
cd devstash
npm install
cp .env.example .env   # then fill in the values below
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account. A new account starts with an empty dashboard.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string, used by migrations |
| `BETTER_AUTH_SECRET` | Session secret, generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App URL, `http://localhost:3000` locally |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth app. Callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend key and sender. The shared `onboarding@resend.dev` sender only delivers to your own Resend account address |

All of these are validated at startup, so a missing value fails fast instead of breaking at runtime.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npm run db:migrate` | Create and apply migrations in development |
| `npm run db:seed` | Seed system item types and sample data |
| `npm run db:studio` | Open Prisma Studio |

## Roadmap

**MVP**
- [x] Authentication and sessions
- [x] Dashboard with live data
- [ ] Items: create, edit, delete
- [ ] Collections
- [ ] Full-text search across content, tags, titles and types
- [ ] Tags and free-tier limits

**Pro**
- [ ] AI features: auto-tagging, summaries, explain code, prompt optimization
- [ ] Custom item types
- [ ] File and image uploads
- [ ] Export as JSON or ZIP
- [ ] Billing with Stripe

## Project layout

```
src/
  app/          routes and layouts (App Router)
  components/   UI by feature: auth, dashboard, ui (shadcn)
  lib/          auth, email, env validation, database queries
  types/        shared types
prisma/         schema, migrations and seed
context/        project specs and feature notes
```

## License

No license has been chosen yet, so all rights are reserved for now.
