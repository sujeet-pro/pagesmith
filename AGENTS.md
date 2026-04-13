# Pagesmith Maintainer Guide

Use this file when working inside the Pagesmith monorepo.

## Scope Split

- **Repo-maintainer guidance**: this file, `CLAUDE.md`, root `ai-guidelines/` (especially `docs-guidelines.md`, `markdown-guidelines.md`, `diagram-guidelines.md`, and `docs-diagram-pass-prompt.md`), and `.claude/skills/`.
- **Published user guidance**: `packages/core/ai-guidelines/`, `packages/site/ai-guidelines/`, `packages/docs/ai-guidelines/`, and `packages/docs/schemas/`.
- **Latest-project docs**: `docs/content/` plus the repo-root `pagesmith.config.json5` describe the current main-branch behavior.
- **Installed-package contract**: anything under `node_modules/@pagesmith/*/ai-guidelines/` and `node_modules/@pagesmith/docs/schemas/` must stay version-matched with the package release.

## Architecture Snapshot

Pagesmith ships three public packages under the `@pagesmith/` scope:

- `@pagesmith/core` (`packages/core/`) for the headless content layer, markdown pipeline, validation, assets helpers, `pagesmithContent`, and the core MCP server.
- `@pagesmith/site` (`packages/site/`) for the `pagesmith-site` CLI, preset loading, JSX runtime, CSS/runtime exports, Vite SSG helpers, and shared site behavior.
- `@pagesmith/docs` (`packages/docs/`) for the config-driven docs preset/theme, navigation generation, listing pages, Pagefind integration, schema generation, and docs-specific runtime helpers.

Dependency graph:

```text
@pagesmith/core -> standalone
@pagesmith/site -> @pagesmith/core
@pagesmith/docs -> @pagesmith/core + @pagesmith/site
```

## Locked Principles

1. Filesystem-first source of truth.
2. Strict package boundaries: content in `@pagesmith/core`, site-building in `@pagesmith/site`, docs conventions in `@pagesmith/docs`.
3. Validation at content boundaries before render/runtime use.
4. Vite-native execution model.
5. Progressive enhancement over JS-heavy runtime.
6. Configuration before customization.
7. Docs, examples, and published AI guidance must move together when behavior changes.

## Source Of Truth

### `@pagesmith/core`

- Implementation: `packages/core/src/**`
- Markdown pipeline: `packages/core/src/markdown/pipeline.ts`, `packages/core/src/markdown/code/**`
- Vite content plugin: `packages/core/src/vite/**`
- Published user guidance: `packages/core/ai-guidelines/**`, `packages/core/README.md`, `packages/core/REFERENCE.md`
- AI installer strings: `packages/core/src/ai/**`

### `@pagesmith/site`

- Implementation: `packages/site/src/**`
- CLI/preset/config flow: `packages/site/src/cli/**`, `packages/site/src/config.ts`, `packages/site/src/preset.ts`
- JSX/runtime/CSS/Vite SSG: `packages/site/src/jsx-runtime/**`, `packages/site/src/runtime/**`, `packages/site/src/css/**`, `packages/site/src/vite/**`, `packages/site/src/ssg-utils/**`
- Published user guidance: `packages/site/ai-guidelines/**`, `packages/site/README.md`, `packages/site/REFERENCE.md`

### `@pagesmith/docs`

- Implementation: `packages/docs/src/**`, `packages/docs/theme/**`
- Config/build/render/server flow: `packages/docs/src/config/**`, `packages/docs/src/build.ts`, `packages/docs/src/render.ts`, `packages/docs/src/server.ts`, `packages/docs/src/server/shared.ts`
- Published user guidance: `packages/docs/ai-guidelines/**`, `packages/docs/schemas/**`, `packages/docs/README.md`, `packages/docs/REFERENCE.md`
- Schema generation: `packages/docs/src/schemas/**`, `packages/docs/scripts/generate-json-schemas.mjs`

### Monorepo Docs And Examples

- Root docs site content: `docs/content/**`
- Root docs site config: `pagesmith.config.json5`
- Example sites: `examples/**`
- Release/build helpers: `scripts/**`

## Repo Rules

- Package `ai-guidelines` are for library users. Root `ai-guidelines` are for maintaining this repo.
- The repo docs site uses the repo-root `pagesmith.config.json5`; in this repo the docs content lives in `docs/content/`.
- Public behavior changes must update, in the same branch:
  - package `ai-guidelines`
  - package `README.md` / `REFERENCE.md`
  - root docs site content under `docs/content/`
  - affected examples under `examples/`
  - AI installer references under `packages/core/src/ai/`
- Site-building behavior changes must update:
  - `packages/site/ai-guidelines/**`
  - `packages/site/README.md` / `packages/site/REFERENCE.md`
  - root docs pages for CLI, Vite, runtime, CSS, and layout/runtime behavior
  - affected custom-site examples under `examples/**`
- Markdown/code-renderer changes must update the implementation plus:
  - `packages/core/ai-guidelines/markdown-guidelines.md`
  - `packages/docs/ai-guidelines/markdown-guidelines.md`
  - root docs pages covering markdown/code blocks
  - example feature pages across all examples
  - markdown-related tests and validations
- Docs-package behavior changes must update:
  - `packages/docs/ai-guidelines/setup-docs.md`
  - `packages/docs/ai-guidelines/docs-guidelines.md`
  - `packages/docs/schemas/*.schema.json`
  - root docs pages for config/frontmatter/navigation/deployment
  - `examples/doc-site/`
- When writing or updating docs, read `ai-guidelines/diagram-guidelines.md` and create diagrams wherever they materially simplify the explanation.
- Keep diagram source files plus rendered light/dark SVG outputs in sibling `diagrams/` folders, and render them with `npm run render:diagrams`.
- Keep parity across docs and all examples for advertised markdown features, config/frontmatter rules, asset passthrough, and deployment behavior.
- Canonical browser URLs should be slashless while remaining GitHub Pages-friendly (`.nojekyll`, root `404.html`, fs-backed preview, direct asset passthrough).
- The preview server must continue serving directly from disk so rebuilds do not require server restarts.

## Repo Skills

Use the project skills in `.claude/skills/` when relevant:

- `prj-update-content` — refresh root docs, examples, package AI guidance, and diagrams together
- `prj-examples-parity` — keep examples aligned with docs/package behavior and diagram conventions
- `prj-sync-package-ai-guidelines` — update published package AI guidance, schemas, and docs/diagram guidance
- `prj-pagesmith-review` — review diffs for behavior, parity, diagram drift, and release readiness
- `prj-docs-diagrams` — review docs pages and add diagrams with `diagramkit`

## Repo Prompts

- `ai-guidelines/docs-diagram-pass-prompt.md` — copy-paste prompt for a full repo docs review that adds diagrams and updates markdown embeds

## Commands

```bash
vp install
vp check
vp test
vp run build
vp run build:docs
vp run build:examples
vp run validate:examples
npm run diagramkit:warmup
npm run render:diagrams
npm run validate
```

