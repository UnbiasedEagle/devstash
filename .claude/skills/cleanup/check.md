# check

Read-only. Change nothing, then report findings grouped by category.

1. Unused imports and variables: `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` and `npm run lint`.
2. Unused dependencies and files: `npx knip`. Report unused `dependencies`, `devDependencies`, files and exports.
3. Unused files across the whole repo, not just `src/`: components, hooks, utils, types, actions, scripts, assets in `public/` and stray root files. Grep for each candidate's name and path to confirm nothing imports or references it.
4. Dead code: commented-out code, unreachable code, unused components, functions, types, constants and exports.
5. Warnings: every warning from `npm run lint`, `npx tsc --noEmit` and `npm run build`, including deprecation, React and Next.js warnings. Report each with file and line, and whether it is a real problem or noise from a dependency.

Ignore false positives from framework conventions (Next.js `page`, `layout`, `route`, `loading` files, config files, `.claude/` and `context/` files, Prisma schema, migrations and seed, ShadCN components under `src/components/ui`) and confirm a dependency is really unused with a grep before reporting it.

End with what `run` would remove.
