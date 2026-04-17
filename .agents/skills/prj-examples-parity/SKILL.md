---
name: prj-examples-parity
description: Keep Pagesmith examples aligned with the root docs site, published package behavior, and diagram conventions. Use when a feature, markdown capability, config rule, docs workflow, or deployment behavior changes.
---
# Project Examples Parity

## Scope

Check these example surfaces when behavior changes:

- `examples/blog-site/`
- `examples/doc-site/`
- `examples/with-react/`
- `examples/with-nextjs/`
- `examples/with-solid/`
- `examples/with-svelte/`
- `examples/with-vanilla-ejs/`
- `examples/with-vanilla-hbs/`

## Workflow

1. Read the "Markdown Parity" and "Diagrams" sections of `AGENTS.md`, follow `prj-docs-diagrams` for diagram work, and read the relevant `packages/*/skills/pagesmith-*-setup/references/` files for the consumer surface.
2. Identify the canonical behavior in `packages/core/src/**` or `packages/docs/src/**`.
3. Compare the affected example pages, README files, runtime files, config files, and diagram usage against that behavior.
4. Update every example that advertises the feature, not just the first one you find.
5. Keep wording aligned with the root docs site under `docs-site/content/`.
6. When examples include diagrams, keep source files plus rendered `-light.svg` / `-dark.svg` outputs together and rerun `npm run render:diagrams`.
7. Run `vp run validate:examples` after parity edits.

## What To Watch

- Markdown/code-block feature pages
- Docs frontmatter and `meta.json5` rules
- Asset passthrough and hosted file behavior
- GitHub Pages / basePath / slashless URL behavior
- Diagram placement, embedding pattern, and rendered outputs
