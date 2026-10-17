# finish

Never run this unless the build passes and the user has tested the feature.

0. Stop unless you're on a `feature/*` or `fix/*` branch and the status is `In Progress`.
1. Run `npm run lint`, `npx tsc --noEmit` and `npm run build`. Stop on failure.
2. If the Prisma schema changed, run `npx prisma migrate status` and stop if out of sync.
3. Ask the user to confirm before committing.
4. Commit in atomic conventional-commit commits (short subject, no body). Never mention Claude or add a Co-Authored-By trailer. Don't stage `context/current-feature.md` in the feature's commits unless it only carries the previous feature's reset, in which case include it in the first commit.
5. Push the branch, switch to `main`, `git pull --ff-only`, merge the branch, push `main`. On merge conflicts or a rejected push, stop and explain.
6. Ask before deleting the branch, then delete it locally and on the remote.
7. Clean up `context/current-feature.md`: append a one-line entry to `## History` (`Completed <feature>: <short summary>`), then reset the rest to the empty template (`Not Started`, empty Goals and Notes). Leave this change uncommitted so it ships with the next feature's commit.
