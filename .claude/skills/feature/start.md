# start

1. Read `context/current-feature.md`. Stop and say so if no feature is loaded (empty Goals) or its status is not `Not Started`.
2. Build the todo list from Goals with the real task tool and update it as you go.
3. Create the branch `feature/<kebab-name>` (`fix/<name>` for fixes) from an up-to-date `main` (`git pull --ff-only`; stop if it can't fast-forward). Stop if the working tree has changes other than `context/current-feature.md` and untracked `.claude/`; those carry over to the branch.
4. Set Status to `In Progress`.
5. Implement only what Goals and Notes ask for, matching existing patterns. For schema changes use `prisma migrate dev`, never `db push`.
6. Write or update unit tests (Vitest, `*.test.ts(x)` next to the code) for any new or changed logic: schemas, helpers, Server Actions with Prisma, Redis and auth mocked. Follow the Tests section of the spec when it has one. Layout and browser flows are covered by `/feature test`, not here.
   - Every test must guard behavior that could really break or that carries a rule (limits, security checks, edge cases, error paths). Don't pad the count with trivial tests: no testing constants, getters, framework behavior, or assertions that just mirror the implementation.
   - If a feature has no meaningful unit-testable logic (pure UI, layout), write no unit tests and say so.
7. Run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`; fix failures. If still failing after 2-3 attempts, stop and explain.
8. Don't commit. Tell the user it's ready to test in the browser.
