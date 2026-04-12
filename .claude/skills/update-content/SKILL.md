---
name: update-content
description: Update the Pagesmith monorepo docs site, examples, and published package ai-guidelines to match current implementation. Use when public behavior, markdown features, CLI/config rules, or examples change.
---
# Update Content

## Quick Start

1. Read the repo-maintainer guides first:
   - `ai-guidelines/core-guidelines.md`
   - `ai-guidelines/docs-guidelines.md`
   - `ai-guidelines/markdown-guidelines.md`
2. Read the published package guidance that consumers will actually receive:
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
2. Update the root docs site under `docs/content/` and the repo docs config at `pagesmith.config.json5` if docs-package behavior changed.
3. Update all affected example content and READMEs under `examples/`.
4. Update the published package guidance under `packages/core/ai-guidelines/` and `packages/docs/ai-guidelines/`.
5. Update package READMEs / REFERENCE docs when user-facing behavior changed.
6. Update `packages/core/src/ai/**` when generated assistant artifacts or packaged guidance paths changed.
7. Verify no stale terminology remains.

## Key Facts

- The current markdown/code story is the built-in Pagesmith renderer on top of Shiki.
- Package `ai-guidelines` are for library users; root `ai-guidelines` are for maintaining this repo.
- In this repo, the docs-site config lives at `pagesmith.config.json5` and the root docs content lives at `docs/content/`.
- Canonical browser URLs should be slashless while remaining GitHub Pages-friendly.

## Verification

- Search for stale package paths or old renderer terminology.
- Run targeted tests for changed behavior.
- Run `vp run validate:examples` when example output or example content changed.
