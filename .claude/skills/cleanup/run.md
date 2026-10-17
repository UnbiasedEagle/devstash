# run

1. Do everything in [check.md](check.md) first and show the findings.
2. Ask the user which items to remove. Never delete files or dependencies they haven't approved.
3. Remove approved unused imports, variables, dead code and commented-out code with the Edit tool. Make no unrelated refactors.
4. Delete approved unused files and assets.
5. Remove approved unused dependencies with `npm uninstall`.
6. Fix approved warnings at the cause. Don't silence them with `eslint-disable`, `@ts-ignore` or `any`.
7. Run `npm run lint`, `npx tsc --noEmit` and `npm run build`. Fix anything the cleanup broke, or restore what was removed, and report any warnings that remain.
8. Ask before committing. If confirmed, commit in atomic conventional-commit commits (e.g. `chore: remove unused imports`, `chore: remove unused dependencies`), short subject, no body, never mentioning Claude.
