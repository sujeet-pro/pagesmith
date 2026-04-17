---
name: prj-sync-package-ai-guidelines
description: Update published per-package `skills/`, schemas, installer references, `llms.txt`/`llms-full.txt`, and docs/diagram guidance after public Pagesmith behavior changes. Use when package APIs, markdown behavior, docs workflow, or hosting behavior changes.
---
# Project Sync Package AI Guidelines

## Quick Start

1. Read `AGENTS.md` for repo-wide rules (markdown parity, hosting/routing, sync expectations) and follow `prj-docs-diagrams` for diagram work.
2. Read the published package files under:
   - `packages/core/skills/pagesmith-core-setup/references/`, `packages/core/REFERENCE.md`
   - `packages/site/skills/pagesmith-site-setup/references/`, `packages/site/REFERENCE.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/`, `packages/docs/REFERENCE.md`, `packages/docs/schemas/`
3. Read the consumer Agent Skills under `skills/pagesmith-*/SKILL.md` and the index at `skills/README.md`.
4. Read the AI installer sources in `packages/core/src/ai/`.

## Workflow

1. Update the package-facing markdown files first (`skills/`, `REFERENCE.md`, `README.md`).
2. Update `packages/docs/schemas/*.schema.json` when docs config/frontmatter/meta rules changed.
3. Update the matching consumer skill(s) under `skills/pagesmith-*/SKILL.md` for any behavior surfaced to end users. Add a new skill when a new user-facing workflow lands, remove it when a workflow is retired.
4. Keep `skills/README.md` in sync with the current skill set (`pagesmith-*` folders + one-line description).
5. Keep package docs-writing and diagram instructions aligned with the repo-level rules in `AGENTS.md` and `prj-docs-diagrams` without leaking monorepo-internal details into consumer-facing files.
6. Update `packages/core/src/ai/**` so generated assistant files reference the new package guidance correctly.
7. Verify the installed-package paths under `node_modules/@pagesmith/*/...` would be valid after publish (REFERENCE.md, skills/**, schemas/**).

## Rules

- Keep package guidance consumer-facing, not monorepo-internal.
- Use direct `node_modules/@pagesmith/...` paths when writing instructions for consumers.
- Consumer skills live **only** at the repo root under `skills/pagesmith-*`. Do not re-add `packages/*/skills/` folders.
- Every consumer-surface change must touch: per-package `skills/pagesmith-<pkg>-*/SKILL.md` + their `references/`, `REFERENCE.md`, `llms.txt`, `llms-full.txt`, and (if schemas moved) `packages/docs/schemas/*`.
- Keep the docs package setup prompt, docs guidelines, markdown guidelines, schemas, and diagram guidance aligned with the matching `skills/pagesmith-docs-*` files.
