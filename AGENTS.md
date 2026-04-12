# Pagesmith Maintainer Guide

Use this file when working inside the Pagesmith monorepo.

## Scope Split

- **Repo-maintainer guidance**: this file, `CLAUDE.md`, root `ai-guidelines/`, and `.claude/skills/`.
- **Published user guidance**: `packages/core/ai-guidelines/`, `packages/docs/ai-guidelines/`, and `packages/docs/schemas/`.
- **Latest-project docs**: `docs/content/` plus the repo-root `pagesmith.config.json5` describe the current main-branch behavior.
- **Installed-package contract**: anything under `node_modules/@pagesmith/*/ai-guidelines/` and `node_modules/@pagesmith/docs/schemas/` must stay version-matched with the package release.

## Architecture Snapshot

Pagesmith ships two public packages under the `@pagesmith/` scope:

- `@pagesmith/core` (`packages/core/`) for the content layer, markdown pipeline, JSX runtime, CSS/runtime exports, Vite plugins, and the core MCP server.
- `@pagesmith/docs` (`packages/docs/`) for the config-driven docs site, build/dev/preview/MCP CLI, navigation generation, default theme, Pagefind integration, schema generation, and docs-specific runtime helpers.

Dependency graph:

```text
@pagesmith/core -> standalone
@pagesmith/docs -> @pagesmith/core
```

## Locked Principles

1. Filesystem-first source of truth.
2. Strict package boundaries: shared primitives in `@pagesmith/core`, docs conventions in `@pagesmith/docs`.
3. Validation at content boundaries before render/runtime use.
4. Vite-native execution model.
5. Progressive enhancement over JS-heavy runtime.
6. Configuration before customization.
7. Docs, examples, and published AI guidance must move together when behavior changes.

## Source Of Truth

### `@pagesmith/core`

- Implementation: `packages/core/src/**`
- Markdown pipeline: `packages/core/src/markdown/pipeline.ts`, `packages/core/src/markdown/code/**`
- Runtime/CSS/Vite exports: `packages/core/src/runtime/**`, `packages/core/src/styles/**`, `packages/core/src/vite/**`
- Published user guidance: `packages/core/ai-guidelines/**`, `packages/core/README.md`, `packages/core/REFERENCE.md`
- AI installer strings: `packages/core/src/ai/**`

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
- Keep parity across docs and all examples for advertised markdown features, config/frontmatter rules, asset passthrough, and deployment behavior.
- Canonical browser URLs should be slashless while remaining GitHub Pages-friendly (`.nojekyll`, root `404.html`, fs-backed preview, direct asset passthrough).
- The preview server must continue serving directly from disk so rebuilds do not require server restarts.

## Repo Skills

Use the project skills in `.claude/skills/` when relevant:

- `update-content` — refresh root docs, examples, and package AI guidance together
- `examples-parity` — keep examples aligned with docs/package behavior
- `sync-package-ai-guidelines` — update published package AI guidance and schemas
- `pagesmith-review` — review diffs for behavior, parity, and release readiness

## Commands

```bash
vp install
vp check
vp test
vp run build
vp run build:docs
vp run build:examples
vp run validate:examples
npm run validate
```
