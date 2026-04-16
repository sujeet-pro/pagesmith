# Repo Markdown Parity Guide

Repo-maintainer guidance for keeping Pagesmith markdown behavior documented consistently.

## Source Of Truth

- Pipeline: `packages/core/src/markdown/pipeline.ts`
- Renderer: `packages/core/src/markdown/code/**`
- Markdown validation: `packages/core/src/validation/code-block-validator.ts`, `packages/core/src/validation/heading-validator.ts`, `packages/core/src/validation/link-validator.ts`
- Published package guidance:
  - `packages/core/ai-guidelines/markdown-guidelines.md`
  - `packages/docs/ai-guidelines/markdown-guidelines.md`
- Root docs pages and examples:
  - `docs-site/content/guide/code-blocks/README.md`
  - `docs-site/content/guide/markdown-features/README.md`
  - `examples/**/content/features/*.md`
  - `tests/integration/markdown.test.ts`

## Maintainer Rules

- The current renderer is the built-in Pagesmith renderer on top of Shiki.
- Do not leave stale references to Expressive Code or any other renderer if the implementation no longer uses it.
- Keep supported code block meta syntax synchronized across implementation, tests, docs, examples, and package AI guidance.
- Keep frontmatter/meta examples aligned with the published schemas.
- When markdown behavior changes, update root docs, examples, package `ai-guidelines`, and tests in the same branch.

## High-Drift Areas

- Code block feature pages across all examples
- Root docs reference pages versus package `markdown-guidelines.md`
- AI installer markdown hints versus package markdown guidance
- Frontmatter examples using old field names or outdated ordering rules

## Verification

- Search the repo for stale terminology after edits.
- Re-run markdown and docs-related tests.
- Build or validate examples when markdown rendering behavior changes.