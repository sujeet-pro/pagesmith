# @pagesmith/core Migration Notes (Pre-1.0)

`@pagesmith/core` is pre-1.0. Minor releases can include breaking changes while API boundaries settle.

## Upgrade checklist

1. Upgrade `@pagesmith/core` with the repository's existing package manager and workspace conventions.
2. Read these version-matched files before editing anything:
  - `node_modules/@pagesmith/core/ai-guidelines/migration.md`
  - `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md`
  - `node_modules/@pagesmith/core/ai-guidelines/usage.md`
  - `node_modules/@pagesmith/core/REFERENCE.md`
3. Prefer subpath imports from the package export map where relevant:
  - `@pagesmith/core/vite`
  - `@pagesmith/core/mcp`
  - `@pagesmith/core/ssg-utils`
4. Recheck Vite wiring and examples:
  - keep `pagesmithContent(...)` in the Vite plugin list
  - spread `...pagesmithSsg(...)` into the Vite plugin list
5. Verify that `virtual:content/<collection>` consumers expect serialized payloads:
  - markdown collections: `{ id, contentSlug, html, headings, frontmatter }[]`
  - data loaders: `{ id, contentSlug, data }[]`
6. Refresh project memory pointers in `CLAUDE.md` / `AGENTS.md` if they are missing or stale.
7. Run the repo's normal validation, build, and test flow after the upgrade.

## Prompt: upgrade an existing @pagesmith/core integration

```text
Upgrade the existing @pagesmith/core integration in this repository. Read node_modules/@pagesmith/core/ai-guidelines/migration.md first and follow it exactly.

Requirements:
1. Use the repo's existing package manager and workspace conventions to upgrade @pagesmith/core. Do not introduce a different package manager.
2. Read these version-matched files before making changes:
   - node_modules/@pagesmith/core/ai-guidelines/migration.md
   - node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md
   - node_modules/@pagesmith/core/ai-guidelines/usage.md
   - node_modules/@pagesmith/core/REFERENCE.md
3. Keep the existing content model, directory layout, and routing structure unless an API or validation change requires a targeted adjustment.
4. Recheck Vite wiring: keep `pagesmithContent(...)` in the plugin list and spread `...pagesmithSsg(...)` into that list rather than nesting it.
5. Verify that any `virtual:content/<collection>` consumers expect serialized payloads (`html`, `headings`, `frontmatter` for markdown collections, or `data` for data loaders).
6. Review changelog-notes.md and adopt any compatible new features or guidance improvements that make the repo easier for both humans and agents to maintain.
7. Refresh `CLAUDE.md` / `AGENTS.md` pointers to the version-matched package guidance when needed.
8. Run the repo's normal validation, build, and test flow before finishing.
9. Summarize what changed, what compatibility fixes were required, and what still needs a user decision.
```

## Behavior updates to note

- The `pagesmith` CLI lives in `@pagesmith/docs`, not `@pagesmith/core`.
- `pagesmithSsg(...)` returns a Vite plugin array and should be spread into `plugins`.
- `virtual:content/<collection>` exports serialized payloads, not lazy `ContentEntry` instances.

## Related docs

- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- `node_modules/@pagesmith/core/ai-guidelines/recipes.md`
- `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`