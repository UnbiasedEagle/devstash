# load

Argument: a path to a spec file (e.g. `context/features/foo-spec.md`) or free text.

1. If a path, read it. If text, use it as the source.
2. Read `context/current-feature.md` and keep its `## History` section untouched. If its status is `In Progress`, stop and ask before overwriting the active feature.
3. Rewrite the file with:
   - `# Current Feature` and a short feature name
   - `## Status`: `Not Started`
   - `## Goals`: concise bullets distilled from the source
   - `## Notes`: link the spec as `@context/features/<name>.md` when one exists, plus constraints from the source
   - `## History`: unchanged
4. If the source is free text, don't invent a spec file.
5. Show the new goals and ask for confirmation before moving on.
