# @pagesmith/docs Migration Notes (Pre-1.0)

`@pagesmith/docs` is pre-1.0. Minor releases can include breaking changes while conventions and APIs are finalized.

## Upgrade checklist

1. Upgrade `@pagesmith/docs` with the repository's existing package manager and workspace conventions.
2. Read these version-matched files before editing anything:
   - `node_modules/@pagesmith/docs/ai-guidelines/migration.md`
   - `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md`
   - `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
   - `node_modules/@pagesmith/docs/ai-guidelines/usage.md`
   - `node_modules/@pagesmith/docs/REFERENCE.md`
   - `node_modules/@pagesmith/docs/schemas/*.schema.json`
3. Keep `pagesmith.config.json5` at the repo root unless the project intentionally uses a custom `--config` path.
4. Reconfirm `contentDir`, `origin`, `basePath`, and the root `docs:dev`, `docs:build`, `docs:preview` scripts.
5. Refresh `CLAUDE.md` / `AGENTS.md` pointers to the version-matched package guidance. If AI artifacts are stale or missing, prefer `npx pagesmith init --ai --no-llms` with explicit existing values instead of scaffolding a second docs tree.
6. Run `npx pagesmith build` and optionally `npx pagesmith dev`.
7. Adopt relevant new features only after the existing docs build is green again.

## Prompt: upgrade an existing @pagesmith/docs integration

```text
Upgrade the existing @pagesmith/docs integration in this repository. Read node_modules/@pagesmith/docs/ai-guidelines/migration.md first and follow it exactly.

Requirements:
1. Use the repo's existing package manager and workspace conventions to upgrade @pagesmith/docs. Do not introduce a different package manager.
2. Read these version-matched files before making changes:
   - node_modules/@pagesmith/docs/ai-guidelines/migration.md
   - node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md
   - node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md
   - node_modules/@pagesmith/docs/ai-guidelines/usage.md
   - node_modules/@pagesmith/docs/REFERENCE.md
   - node_modules/@pagesmith/docs/schemas/*.schema.json
3. Keep the existing pagesmith.config.json5 location and contentDir unless a schema or config problem requires a change. Ask before moving docs content.
4. Reuse the existing docs tree. Do not scaffold a second docs directory or replace useful content with starter files.
5. Revalidate origin, basePath, docs:dev/docs:build/docs:preview scripts, and project memory pointers in CLAUDE.md / AGENTS.md.
6. Refresh AI artifacts only when they are missing or stale. Prefer `npx pagesmith init --ai --no-llms` with explicit existing values when that is less invasive than hand-editing.
7. Review changelog-notes.md and adopt any compatible new features, config fields, or guidance improvements that make this repo easier for both humans and agents to maintain.
8. When editing config, meta.json5, or frontmatter, validate against the version-matched schema files under node_modules/@pagesmith/docs/schemas/.
9. Run `npx pagesmith build` and, if helpful, `npx pagesmith dev` before finishing.
10. Summarize what changed, which new features or guidance were adopted, and what still needs a user decision.
```

## Behavior updates to note

- Use `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` for fresh setup or retrofit work, and use this file for upgrades.
- The installed package guidance under `node_modules/@pagesmith/docs/ai-guidelines/` and `node_modules/@pagesmith/docs/schemas/` is the version-matched source of truth for agents.
- The default adoption story is a repo-root `pagesmith.config.json5` plus a docs directory wired through `contentDir`.

## Related docs

- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/ai-guidelines/usage.md`
- `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
