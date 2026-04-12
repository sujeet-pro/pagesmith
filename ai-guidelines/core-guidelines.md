# Maintaining `@pagesmith/core`

Repo-maintainer guidance for evolving `@pagesmith/core` inside this monorepo.

## Scope

Use this file when changing the core package implementation, examples that depend on core, or the published `packages/core/ai-guidelines/` contract.

## Source Of Truth

- Implementation: `packages/core/src/**`
- Markdown pipeline: `packages/core/src/markdown/pipeline.ts`, `packages/core/src/markdown/code/**`
- Validation pipeline: `packages/core/src/store.ts`, `packages/core/src/validation/**`
- Vite plugins: `packages/core/src/vite/**`
- Runtime/CSS exports: `packages/core/src/runtime/**`, `packages/core/src/styles/**`
- Published user guidance: `packages/core/ai-guidelines/**`, `packages/core/README.md`, `packages/core/REFERENCE.md`
- Installed AI artifact generation: `packages/core/src/ai/**`

## Maintainer Rules

- Keep the content loading pipeline order accurate everywhere it is documented.
- Keep the markdown pipeline accurate everywhere it is documented.
- Treat `packages/core/ai-guidelines/*.md` and `llms*.txt` as consumer-facing package files, not repo notes.
- When `@pagesmith/core` behavior changes, update the generated AI installer references in `packages/core/src/ai/**` in the same branch.
- Keep examples built directly on core aligned with the package behavior:
  - `examples/blog-site/`
  - `examples/with-react/`
  - `examples/with-solid/`
  - `examples/with-svelte/`
  - `examples/with-vanilla-ejs/`
  - `examples/with-vanilla-hbs/`

## Required Sync Work

When public behavior changes, update all relevant items below:

1. `packages/core/ai-guidelines/core-guidelines.md`
2. `packages/core/ai-guidelines/markdown-guidelines.md`
3. `packages/core/ai-guidelines/usage.md`, `recipes.md`, `errors.md`, `migration.md`, `changelog-notes.md`, `llms*.txt`
4. `packages/core/README.md` and `packages/core/REFERENCE.md`
5. Root docs pages under `docs/content/`
6. Affected example content and READMEs under `examples/`
7. Tests under `packages/core/src/__tests__/` and `tests/e2e/`

## Core Behaviors To Preserve

- Built-in Pagesmith code renderer on top of Shiki
- Shared code block CSS in the shipped bundles
- Vite plugin exports under `@pagesmith/core/vite`
- MCP server resource behavior under `@pagesmith/core/mcp`
- Zod-first schemas and validation at content boundaries

## Verification

```bash
vp test
vp run validate:examples
```
