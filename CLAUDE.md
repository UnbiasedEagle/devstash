# CLAUDE.md

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following files to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interactions.md
- @context/current-feature.md

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build and serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`)
- `npx tsc --noEmit` — typecheck
- `npm test` — Vitest unit tests (`npm run test:watch` while developing). Tests live next to the code as `*.test.ts(x)` and mock Prisma, Redis and auth, so they never touch a real service
- Browser checks (layout, drawers, real flows, mobile) run through Playwright with `/feature test`

## Neon MCP

Whenever using the Neon MCP, target the `devstash` project (`mute-leaf-00076928`) and its `development` branch (`br-steep-thunder-b3u47jx4`). Never query the `production` branch unless explicitly asked.
