# Maintaining `@pagesmith/docs`

Repo-maintainer guidance for evolving `@pagesmith/docs` inside this monorepo.

## Scope

Use this file when changing docs-site behavior, schemas, hosting/deployment behavior, or the published `packages/docs/ai-guidelines/` contract.

## Source Of Truth

- Config resolution and defaults: `packages/docs/src/config/**`
- Build/render/server flow: `packages/docs/src/build.ts`, `packages/docs/src/render.ts`, `packages/docs/src/server.ts`, `packages/docs/src/server/shared.ts`
- Content/navigation rules: `packages/docs/src/content.ts`, `packages/docs/src/navigation.ts`
- Theme/runtime: `packages/docs/theme/**`
- Published user guidance: `packages/docs/ai-guidelines/**`, `packages/docs/schemas/**`, `packages/docs/README.md`, `packages/docs/REFERENCE.md`
- Root docs site: `pagesmith.config.json5`, `docs/content/**`
- Example docs site: `examples/doc-site/**`

## Maintainer Rules

- In this repo, the docs-site config lives at the repo root in `pagesmith.config.json5`.
- The root docs-site content for this repo lives in `docs/content/`.
- Keep `packages/docs/ai-guidelines/*.md` consumer-facing and version-matched with package behavior.
- Keep `packages/docs/schemas/*.schema.json` aligned with `packages/docs/src/schemas/**`.
- Update `packages/core/src/ai/**` whenever package guidance paths or setup guidance changes.

## Hosting And Routing Rules

- Canonical browser URLs should be slashless.
- Keep GitHub Pages compatibility: `.nojekyll`, root `404.html`, direct asset passthrough, and static extensionless route serving.
- The preview server must continue serving directly from the filesystem so rebuilds do not require restart.
- Keep asset passthrough first-class for files like `llms.txt`, `llms-full.txt`, prompts, and schemas.

## Required Sync Work

When public behavior changes, update all relevant items below:

1. `packages/docs/ai-guidelines/setup-docs.md`
2. `packages/docs/ai-guidelines/docs-guidelines.md`
3. `packages/docs/ai-guidelines/markdown-guidelines.md`
4. `packages/docs/ai-guidelines/usage.md`, `recipes.md`, `errors.md`, `migration.md`, `changelog-notes.md`, `llms*.txt`
5. `packages/docs/schemas/*.schema.json`
6. `packages/docs/README.md` and `packages/docs/REFERENCE.md`
7. Root docs pages under `docs/content/`
8. `examples/doc-site/`
9. Tests under `packages/docs/src/__tests__/` and `tests/e2e/`

## Verification

```bash
vp test
vp run build:docs
vp run validate:examples
```
