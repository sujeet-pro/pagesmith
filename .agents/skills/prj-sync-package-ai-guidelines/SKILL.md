---
name: prj-sync-package-ai-guidelines
description: Update published package ai-guidelines, schemas, installer references, and docs/diagram guidance after public Pagesmith behavior changes. Use when package APIs, markdown behavior, docs workflow, or hosting behavior changes.
---
# Project Sync Package AI Guidelines

## Quick Start

1. Read the repo-maintainer guides in `ai-guidelines/`.
2. Read the published package files under:
   - `packages/core/ai-guidelines/`
   - `packages/docs/ai-guidelines/`
   - `packages/docs/schemas/`
3. Read the AI installer sources in `packages/core/src/ai/`.

## Workflow

1. Update the package-facing markdown files first.
2. Update `packages/docs/schemas/*.schema.json` when docs config/frontmatter/meta rules changed.
3. Update package `README.md` / `REFERENCE.md` files for user-facing changes.
4. Keep package docs-writing and diagram instructions aligned with the repo-level guidance in `ai-guidelines/docs-guidelines.md` and `ai-guidelines/diagram-guidelines.md`, without leaking monorepo-only details into package guidance.
5. Update `packages/core/src/ai/**` so generated assistant files reference the new package guidance correctly.
6. Verify the installed-package paths under `node_modules/@pagesmith/*/...` would be valid after publish.

## Rules

- Keep package guidance consumer-facing, not monorepo-internal.
- Use direct `node_modules/@pagesmith/...` paths when writing instructions for consumers.
- Keep the docs package setup prompt, docs guidelines, markdown guidelines, schemas, and diagram guidance aligned.
