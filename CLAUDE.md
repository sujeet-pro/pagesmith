# Pagesmith

Repo-level maintainer context for the Pagesmith monorepo.

## Guidance Surfaces

- **Use this file, `AGENTS.md`, root `ai-guidelines/`, and `.claude/skills/`** when maintaining this repository.
- **Use `packages/core/ai-guidelines/`, `packages/docs/ai-guidelines/`, and `packages/docs/schemas/`** when updating the published package contract for library users.
- **Use `docs/content/` plus the repo-root `pagesmith.config.json5`** for the latest docs site that documents current main-branch behavior.

## What matters most

- **`@pagesmith/core`** (`packages/core/`) — content layer, markdown pipeline, JSX runtime, CSS/runtime exports, Vite plugins, and core MCP server.
- **`@pagesmith/docs`** (`packages/docs/`) — config-driven docs site, CLI (`init|dev|build|preview|mcp`), default theme, Pagefind integration, schema generation, and docs-specific MCP server.
- **Root docs site** — config lives at `pagesmith.config.json5`; content lives in `docs/content/`.
- **Examples** — `examples/blog-site/`, `examples/doc-site/`, and `examples/with-*` are part of the contract and must stay behaviorally aligned with the packages and docs.
- **AI installer** — `packages/core/src/ai/` generates project memory files and skills; those generated references must track the published package paths under `node_modules/@pagesmith/*/ai-guidelines/` and `node_modules/@pagesmith/docs/schemas/`.

## Locked principles

1. Filesystem-first source of truth.
2. Strict package boundaries.
3. Validation before render/runtime use.
4. Vite-native execution.
5. Progressive enhancement.
6. Configuration before customization.
7. Docs, examples, and published AI guidance change together.

## Package user contract

These files are part of the published package surface and must stay version-matched with each release:

- `packages/core/ai-guidelines/*.md`
- `packages/core/ai-guidelines/llms*.txt`
- `packages/core/README.md`
- `packages/core/REFERENCE.md`
- `packages/docs/ai-guidelines/*.md`
- `packages/docs/ai-guidelines/llms*.txt`
- `packages/docs/schemas/*.schema.json`
- `packages/docs/README.md`
- `packages/docs/REFERENCE.md`

For consuming projects, the installed package paths should look like:

- `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/markdown-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
- `node_modules/@pagesmith/docs/ai-guidelines/markdown-guidelines.md`
- `node_modules/@pagesmith/docs/ai-guidelines/usage.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`

## Maintainer workflow

When behavior changes:

- Update implementation first in `packages/core/src/**` or `packages/docs/src/**`.
- Update published package guidance in `packages/*/ai-guidelines/**`, package READMEs/REFERENCE docs, and `packages/docs/schemas/**` when relevant.
- Update generated AI artifact references under `packages/core/src/ai/**`.
- Update the root docs site under `docs/content/**`.
- Update all affected examples under `examples/**`.
- Update tests and validation checks.

## High-risk drift areas

- Markdown/code renderer facts versus docs/examples/package `markdown-guidelines.md`
- Docs frontmatter/meta/schema rules versus `packages/docs/schemas/*.schema.json`
- Docs hosting behavior versus `packages/docs/src/build.ts`, `packages/docs/src/server.ts`, and deployment docs
- Example content versus the root docs site and package AI guidance

## Repo-specific rules

- Keep slashless URLs as the canonical browser form while preserving GitHub Pages compatibility.
- Keep the preview server serving current files from disk after rebuilds.
- Keep asset passthrough first-class for files like `llms.txt`, `llms-full.txt`, prompts, and schemas.
- Never treat root `ai-guidelines/` as the published package contract; those files are for maintaining this repo.

## Project skills

- `.claude/skills/update-content/`
- `.claude/skills/examples-parity/`
- `.claude/skills/sync-package-ai-guidelines/`
- `.claude/skills/pagesmith-review/`

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
