---
name: prj-add-markdown-plugin
description: Add a remark or rehype plugin to the @pagesmith/core markdown pipeline. Use when introducing a new markdown feature, HAST transform, or shared markdown behavior across all Pagesmith packages.
---

# Project Add Markdown Plugin

## Quick Start

1. Read `packages/core/src/markdown/pipeline.ts` — this is the single source of truth for plugin order.
2. Read `ai-guidelines/markdown-guidelines.md` and `packages/core/ai-guidelines/markdown-guidelines.md`.
3. Decide:
   - First-party plugin (goes in `packages/core/src/markdown/plugins/`)
   - Third-party plugin (consumed only; no source in this repo)
   - User-facing extension point (belongs in `MarkdownConfig.remarkPlugins` / `rehypePlugins`)

## Workflow

1. If writing a first-party plugin:
   - Create `packages/core/src/markdown/plugins/<name>.ts` using `unified`'s plugin type.
   - Walk the tree with `unist-util-visit` or equivalent.
   - Add unit tests under `packages/core/src/__tests__/`.
2. Wire it into the pipeline:
   - Decide insertion point carefully. Document it in the comment at the top of `pipeline.ts`.
   - Respect ordering constraints (frontmatter before GFM transforms, rehype-stringify last, etc.).
3. Update documentation:
   - `packages/core/CLAUDE.md` markdown-pipeline section.
   - `packages/core/ai-guidelines/markdown-guidelines.md`.
   - `packages/docs/ai-guidelines/markdown-guidelines.md` if docs consumers need to know.
   - Root docs under `docs-site/content/guide/markdown/` and `docs-site/content/reference/core/markdown-reference/`.
   - Example pages demonstrating the new syntax in at least `examples/blog-site/` and `examples/doc-site/`.
4. Validation:
   - Add markdown snapshot / HTML assertions in `packages/core/src/__tests__/markdown.test.ts`.
   - Add a validator (or extend an existing one) in `packages/core/src/validation/` if misuse needs to warn.
5. Run `npm run cicd` or at least `vp test run packages/core` and `npm run validate:examples`.

## Rules

- Never re-order existing plugins without a test proving the output is unchanged for the default path.
- Keep plugin options tiny and strongly typed; avoid free-form maps unless necessary.
- If the plugin depends on theme / CSS classes, add the CSS in `packages/site/src/styles/` alongside a runtime if needed.
