---
name: prj-update-content
description: Update the Pagesmith monorepo docs site, examples, published package ai-guidelines, and related diagrams to match current implementation. Use when public behavior, markdown features, docs workflow, or examples change.
---
# Project Update Content

## Quick Start

1. Read the repo-maintainer guides first:
   - `ai-guidelines/core-guidelines.md`
   - `ai-guidelines/docs-guidelines.md`
   - `ai-guidelines/markdown-guidelines.md`
   - `ai-guidelines/diagram-guidelines.md`
2. Read the published package guidance that consumers receive:
   - `packages/core/ai-guidelines/core-guidelines.md`
   - `packages/core/ai-guidelines/markdown-guidelines.md`
   - `packages/core/ai-guidelines/usage.md`
   - `packages/docs/ai-guidelines/setup-docs.md`
   - `packages/docs/ai-guidelines/docs-guidelines.md`
   - `packages/docs/ai-guidelines/markdown-guidelines.md`
   - `packages/docs/ai-guidelines/usage.md`
   - `packages/docs/schemas/*.schema.json`

## Workflow

1. Audit the implementation that changed.
2. Update the root docs under `docs/content/` and the repo docs config at `pagesmith.config.json5` when docs-package behavior changed.
3. Add or refresh diagrams wherever they materially simplify explanations. Keep source plus rendered outputs in sibling `diagrams/` folders and rerun `npm run render:diagrams` after source changes.
4. Update all affected example content and READMEs under `examples/`.
5. Update the published package guidance under `packages/core/ai-guidelines/` and `packages/docs/ai-guidelines/`.
6. Update package `README.md` / `REFERENCE.md` files when user-facing behavior changed.
7. Update `packages/core/src/ai/**` when generated assistant artifacts or packaged guidance paths changed.
8. Verify no stale terminology, stale diagram references, or missing rendered assets remain.

## Key Facts

- The current markdown/code story is the built-in Pagesmith renderer on top of Shiki.
- Package `ai-guidelines` are for library users; root `ai-guidelines` are for maintaining this repo.
- In this repo, the docs-site config lives at `pagesmith.config.json5` and the root docs content lives at `docs/content/`.
- Repo diagrams are rendered with `diagramkit` using `diagramkit.config.json5`.
- Canonical browser URLs should be slashless while remaining GitHub Pages-friendly.

## Verification

- Search for stale package paths or old renderer terminology.
- Run `npm run render:diagrams` when diagram sources changed.
- Run targeted tests for changed behavior.
- Run `vp run validate:examples` when example output or example content changed.
