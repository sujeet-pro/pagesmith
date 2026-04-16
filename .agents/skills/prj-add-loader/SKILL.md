---
name: prj-add-loader
description: Add a new content loader to @pagesmith/core. Use when introducing a new content file format (e.g. MDX, org-mode, custom DSL) or a virtual loader that reads from a non-filesystem source.
---

# Project Add Loader

## Quick Start

1. Read `packages/core/CLAUDE.md` and `packages/core/src/loaders/` for the current loader contract.
2. Read `packages/core/ai-guidelines/core-guidelines.md` for the documented loader behavior.

## Workflow

1. Implement the loader class in `packages/core/src/loaders/<name>.ts`:
   - Implement the `Loader` interface from `packages/core/src/loaders/types.ts`.
   - Set `name`, `extensions`, and `load(filePath) -> LoaderResult`.
   - Reuse `LoaderError` from `packages/core/src/loaders/errors.ts` for failure cases.
2. Register it:
   - Add a new literal to the `LoaderType` union in `packages/core/src/loaders/types.ts`.
   - Wire the loader in `packages/core/src/loaders/index.ts` (`resolveLoader` + `defaultIncludePatterns`).
3. Export:
   - Re-export from `packages/core/src/loaders/index.ts`.
   - Confirm the `@pagesmith/core/loaders` entry in `packages/core/package.json` exports surfaces the new loader.
4. Validate:
   - Add a `packages/core/src/__tests__/<name>-loader.test.ts` that covers happy path, parse error, and missing-file cases.
   - Add a fixture under `tests/integration/fixtures/` if the loader needs real files.
5. Update guidance:
   - `packages/core/ai-guidelines/core-guidelines.md` (loader table)
   - `packages/core/ai-guidelines/usage.md` (recipe)
   - Root docs under `docs-site/content/reference/core/api/` and `docs-site/content/guide/content-layer/`
   - Add a consumer-facing `SKILL.md` under `packages/core/skills/add-loader/` if the new loader needs a distinct workflow (or update the existing one).
6. Run `npm run cicd` (or at minimum `vp test run` + `vp check`).

## Rules

- Zero IO outside of `load()`; loaders must be pure w.r.t. the store.
- Return `{ data, rawContent? }` only — no side effects.
- Do not add runtime dependencies for niche formats without justification; prefer a tiny parser or a peer-dep pattern.
