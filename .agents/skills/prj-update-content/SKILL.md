---
name: prj-update-content
description: Update the Pagesmith monorepo docs site, examples, published per-package `skills/` and `llms*.txt` files, and related diagrams to match current implementation. Use when public behavior, markdown features, docs workflow, or examples change.
---
# Project Update Content

## Quick Start

1. Read `AGENTS.md` for repo-wide rules (markdown parity, hosting/routing, sync expectations) and follow `prj-docs-diagrams` for diagram work.
2. Read the published package guidance that consumers receive:
   - `packages/core/skills/pagesmith-core-setup/references/core-guidelines.md`
   - `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`
   - `packages/core/skills/pagesmith-core-setup/references/usage.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/usage.md`
   - `packages/docs/schemas/*.schema.json`

## Workflow

1. Audit the implementation that changed.
2. Update the root docs under `docs-site/content/` and the repo docs config at `pagesmith.config.json5` when docs-package behavior changed.
3. Add or refresh diagrams wherever they materially simplify explanations. Keep source plus rendered outputs in sibling `diagrams/` folders and rerun `npm run render:diagrams` after source changes.
4. Update all affected example content and READMEs under `examples/`.
5. Update the published package guidance under `packages/core/skills/pagesmith-core-setup/references/` and `packages/docs/skills/pagesmith-docs-setup/references/`.
6. Update package `README.md` / `REFERENCE.md` files when user-facing behavior changed.
7. Update `packages/core/src/ai/**` when generated assistant artifacts or packaged guidance paths changed.
8. Verify no stale terminology, stale diagram references, or missing rendered assets remain.

## Key Facts

- The current markdown/code story is the built-in Pagesmith renderer on top of Shiki.
- Contributor guidance lives in `AGENTS.md` and `.agents/skills/prj-*`. Each `packages/*/skills/pagesmith-*-setup/references/` folder is consumer-facing and ships in the npm tarball.
- In this repo, the docs-site config lives at `pagesmith.config.json5` and the root docs content lives at `docs-site/content/`.
- Repo diagrams are rendered with `diagramkit` using `diagramkit.config.json5`.
- Canonical browser URLs should be slashless while remaining GitHub Pages-friendly.

## Verification

- Search for stale package paths or old renderer terminology.
- Run `npm run render:diagrams` when diagram sources changed.
- Run targeted tests for changed behavior.
- Run `npm run validate:examples` when example output or example content
  changed.
- Run `npm run validate:pagesmith` (or `validate:pagesmith:full` for the
  strict opt-in checks) after any docs/content edits. It validates both the
  markdown source under `docs-site/content/` and the built `gh-pages/`
  output, including:
  - Per-collection frontmatter (auto-loaded from `content.config.ts` if
    present; this repo does not have one and falls back to the structural
    rules).
  - Internal link / image existence (resolved against `contentDir`,
    `publicDir`, `pagesmith.config.json5#assets` mappings, and the existing
    build output).
  - `<picture>` theme variants, raw `<img>` outside `<picture>`, alt text,
    adjacent `-light/-dark` image pairing.
  - Build-output anchors, asset hashes, SVG renderability, and the
    required-files list (favicon, sitemap, robots, llms.txt, llms-full.txt).
  - The repo-specific check that every `pagesmith.config.json5#assets`
    source path actually exists on disk.
- For doc consumers (v5.sujeet.pro / sujeet-pro.github.io / diagramkit) the
  same validators are reachable via `@pagesmith/docs` (`validateDocs`) or
  the lower-level helpers re-exported by `@pagesmith/site`
  (`validateContent`, `validateBuildOutput`, `loadContentSchemaMap`,
  `formatContentValidationReport`). Each consumer keeps a thin
  `scripts/validate-pagesmith.ts` (or equivalent) that wires those
  validators with project-specific cross-reference checks.
