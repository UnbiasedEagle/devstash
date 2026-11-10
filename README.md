# DevStash

**One searchable home for everything a developer keeps: snippets, commands, prompts, notes, files, images and links.**

Developers scatter their essentials across VS Code, Notion, chat history, bookmarks and `.txt` files. DevStash is a single hub where all of it lives, organized into collections and built to be found fast.

**Live:** [getdevstash.com](https://getdevstash.com)

> **Status:** feature complete. Items, collections, search, billing, uploads, export, custom types and import are all built. See [Roadmap](#roadmap).

## What works today

- **Items**
  - Seven built-in types: snippet, prompt, command, note, file, image and link
  - Create, edit and delete from a New Item dialog and a detail drawer, with tags and an optional collection
  - Syntax-highlighted code, a Markdown editor with Write and Preview for notes and prompts, and a copy button
  - Favorites and pins, with pinned and recent items on the dashboard
  - Import up to 20 text and code files at once: Markdown and text files become Notes, code files become Snippets with the language from the extension
- **Collections** that mix item types, with favorites and a detail page for each
- **Search**
  - A search popup opened with `Cmd/Ctrl+K` or `/`, with grouped results and highlighted matches
  - A full results page across titles, descriptions, content, links, tags and types
- **Tags** with an index page and a page per tag
- **Custom item types (Pro)**
  - Create your own types with a name, icon and color, and use them like built-in ones for items, search and export
- **Files and images (Pro)**
  - Private Cloudflare R2 storage with signed upload and download links
  - Image previews in the drawer and on cards, and one-click downloads for files
- **Export (Pro)**: everything as one JSON file, or a ZIP that also holds your uploaded files
- **Billing**: Stripe Checkout for monthly and yearly Pro plans, the Stripe Customer Portal, and webhooks that keep access in sync
- **Authentication**
  - Email and password sign-up with required email verification, sent through Resend
  - GitHub OAuth sign-in
  - Forgot and reset password with expiring, single-use links
  - Account linking guarded by verified emails, so a sign-in can't take over an unverified account
  - Route protection, with sessions validated on the server
- **Profile page**: account details, plan card, usage against the free limits, export, change name and password, and delete account
- **Landing page** at `/`, a static page with pictures of the real interface, plus page metadata, a share image, `robots.txt` and a sitemap

### Plans

|                                  | Free | Pro                      |
| -------------------------------- | ---- | ------------------------ |
| Price                            | $0   | $8 a month or $72 a year |
| Items                            | 50   | Unlimited                |
| Collections                      | 3    | Unlimited                |
| Search, tags, favorites and pins | Yes  | Yes                      |
| Image and file uploads           | No   | Yes                      |
| Custom item types                | No   | Yes                      |
| Export as JSON or ZIP            | No   | Yes                      |

## Tech stack

| Area          | Choice                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router) and React 19                                                                                                                                                  |
| Language      | TypeScript (strict)                                                                                                                                                                   |
| Database      | Neon PostgreSQL with Prisma 7                                                                                                                                                         |
| Auth          | Better Auth (email and password, GitHub OAuth)                                                                                                                                        |
| Payments      | Stripe                                                                                                                                                                                |
| File storage  | Cloudflare R2                                                                                                                                                                         |
| Email         | Resend                                                                                                                                                                                |
| Rate limiting | Upstash Redis                                                                                                                                                                         |
| UI            | Tailwind CSS v4 and shadcn/ui on Base UI                                                                                                                                              |
| Validation    | Zod                                                                                                                                                                                   |
| Tests         | Vitest and Testing Library, with browser checks in Playwright                                                                                                                         |
| Hosting       | Vercel, with functions in `sin1` next to the Neon database in `aws-ap-southeast-1` (set in `vercel.json`, change both together), and GitHub Actions running lint, typecheck and tests |

## How it's built

- **Server Components first.** Pages fetch with Prisma directly. Mutations are Server Actions that return `{ success, data, error }`, and route handlers exist only where a protocol requires them: the auth endpoints, the Stripe webhook and the export download.
- **Every query is scoped to the signed-in user**, and inputs are validated with Zod.
- **Limits are enforced on the server.** The free item and collection limits and the Pro checks run inside Serializable transactions, so two fast requests can't both slip past a limit.
- **Mutation rate limits** on Redis, shared by every Server Action, with their own limits for uploads, downloads, search and export.
- **Migrations only.** Schema changes go through `prisma migrate`, and production runs `prisma migrate deploy` before the app starts.
- **Auth is designed against abuse:** the same response for known and unknown emails, emails sent after the response so timing doesn't leak, a per-recipient cap on every email type, Redis-backed rate limits that hold across serverless instances, server-side cleanup of names and avatar URLs, and sessions revoked on password reset.
- **Uploads never touch the app server.** The browser uploads straight to a private R2 bucket with a link that signs the exact type and size, and the save step re-checks the real object before it is kept.

## Getting started

You need Node.js 20 or newer and a [Neon](https://neon.tech) database. GitHub OAuth, [Resend](https://resend.com), Upstash Redis, Stripe and Cloudflare R2 are needed for the features that use them.

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

| Variable                                                                 | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                           | Neon pooled connection string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DIRECT_URL`                                                             | Neon direct connection string, used by migrations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `BETTER_AUTH_SECRET`                                                     | Session secret, generate with `openssl rand -base64 32`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `BETTER_AUTH_URL`                                                        | App URL, `http://localhost:3000` locally. Also the site address in page metadata, so a bad value fails the build                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`                               | GitHub OAuth app. Callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `RESEND_API_KEY`, `EMAIL_FROM`                                           | Resend key and sender. The shared `onboarding@resend.dev` sender only delivers to your own Resend account address                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                     | [Upstash Redis](https://upstash.com) REST credentials, used for rate limiting. Set them in every Vercel environment, or builds fail                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                             | [Stripe](https://stripe.com) secret key and the signing secret of the webhook endpoint. Use test mode values everywhere until you go live. Locally the webhook secret comes from `stripe listen --print-secret`, with `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running. On Vercel, create a webhook endpoint for `{your app URL}/api/webhooks/stripe` listening to `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted`, and use its signing secret. Set both in every Vercel environment, or builds fail |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`                            | Ids (`price_...`) of the $8 monthly and $72 yearly Pro prices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket for uploaded files. Create a private bucket (no public access), an API token with Object Read & Write scoped to that bucket, a CORS rule on the bucket allowing `PUT` with the `Content-Type` header from `http://localhost:3000` and your production domain, and an object lifecycle rule that deletes objects with the `pending/` prefix after 1 day, so uploads that were never saved don't pile up. Set all four in every Vercel environment, or builds fail                                                |
| `EMAIL_VERIFICATION_ENABLED`                                             | Optional, defaults to `true`. Set to `false` locally to sign up without email verification, for example in browser tests. The build fails if it is `false` on Vercel production. With it off, signing up with an existing email returns an error instead of the generic response                                                                                                                                                                                                                                                                                              |

The auth, GitHub, email, Redis, Stripe, R2 and flag variables are validated at startup, so a missing value fails fast instead of breaking at runtime.

### Scripts

| Command                       | What it does                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Start the dev server                                                                                                            |
| `npm run build` / `npm start` | Production build and serve                                                                                                      |
| `npm run lint`                | ESLint                                                                                                                          |
| `npx tsc --noEmit`            | Typecheck                                                                                                                       |
| `npm test`                    | Vitest unit tests (`npm run test:watch` while developing). They mock Prisma, Redis and auth, so they never touch a real service |
| `npm run db:migrate`          | Create and apply migrations in development                                                                                      |
| `npm run db:seed`             | Seed the system item types                                                                                                      |
| `npm run db:studio`           | Open Prisma Studio                                                                                                              |

## Roadmap

**Done**

- [x] Authentication and sessions
- [x] Dashboard with live data
- [x] Items: create, edit, delete, favorites and pins
- [x] Markdown editor for notes and prompts
- [x] Collections
- [x] Tags and free-tier limits
- [x] Search: popup and results page
- [x] Billing with Stripe
- [x] File and image uploads (Pro)
- [x] Export as JSON or ZIP (Pro)
- [x] Custom item types (Pro)
- [x] Landing page
- [x] Import from files

## Project layout

```
src/
  actions/      Server Actions
  app/          routes and layouts (App Router)
  components/   UI by feature: items, collections, search, landing, ui (shadcn)
  lib/          auth, billing, storage, export, validation, database queries
  types/        shared types
prisma/         schema, migrations and seed
context/        project specs and feature notes
```

Tests live next to the code as `*.test.ts(x)`.

## License

[MIT](LICENSE)
