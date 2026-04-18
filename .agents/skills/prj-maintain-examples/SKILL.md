---
name: prj-maintain-examples
description: Keep Pagesmith examples aligned with implementation and root docs — update existing examples when behavior changes, or add a new example workspace with correct scaffolding, validation, and cross-links. Use when features, markdown, config, deployment, or framework integrations change, or when adding an end-to-end demo.
---

# Project Maintain Examples

Covers **parity updates** across all example workspaces and **adding** a new example. Read `AGENTS.md` (Markdown Parity, Diagrams). For diagram embedding and rendering in examples, follow [`prj-maintain-docs`](../prj-maintain-docs/SKILL.md) (diagram sections) and the `prj-diagramkit-*` skills.

## Example surfaces

- `examples/blog-site/`
- `examples/doc-site/`
- `examples/frameworks/with-react/`
- `examples/frameworks/with-nextjs/`
- `examples/frameworks/with-solid/`
- `examples/frameworks/with-svelte/`
- `examples/frameworks/with-vanilla-ejs/`
- `examples/frameworks/with-vanilla-hbs/`

## Parity workflow (existing examples)

1. Read the relevant `packages/*/skills/pagesmith-*-setup/references/` files for the user-facing contract.
2. Identify canonical behavior in `packages/core/src/**` or `packages/docs/src/**`.
3. Compare affected example pages, READMEs, configs, runtime files, and diagrams; update **every** example that advertises the feature.
4. Keep wording aligned with `docs/content/`.
5. Diagrams: sibling `diagrams/` folders, sources + rendered `-light.svg` / `-dark.svg`, then `npm run render:diagrams`.
6. Run `npm run validate:examples` after edits.

### What to watch

Markdown/code-block demos, frontmatter and `meta.json5`, asset passthrough, GitHub Pages / basePath / slashless URLs, diagram placement and embeds.

## Add a new example workspace

1. Use the closest existing example (`examples/frameworks/with-react/`, `examples/blog-site/`, etc.) for conventions.
2. Read `packages/site/skills/pagesmith-site-setup/references/recipes.md` or `packages/docs/skills/pagesmith-docs-setup/references/recipes.md` for the variant you are introducing.
3. **Folder:** framework integrations → `examples/frameworks/with-<framework>/`; full sites → `examples/<name>-site/`.
4. **Scaffold:** `package.json` (`name` `@pagesmith/example-<name>`, `private`, `type: module`, scripts `dev`, `build`, `preview`, `check`, `test` as needed), `tsconfig.json` extending root, `vite.config.ts` with `vite-plus` and the right `@pagesmith/*` plugins, `content/` with at least two entries, `README.md` linking to the matching `docs/content/guide/` section.
5. **Register:** add workspace to root `package.json` `workspaces`; add `build:<ex>`, `dev:<ex>`, `preview:<ex>` scripts.
6. **Validation:** ensure `scripts/validate-examples.ts` includes the new path; add `tests/integration/` fixtures when behavior is non-trivial.
7. **Docs:** add or update `docs/content/guide/` (e.g. frameworks series) using the “With an agent / Manual” two-track pattern where applicable.
8. Run `npm run cicd` or the minimal subset to confirm green.

## Rules

- No example-only dependencies outside hoisted root `node_modules/` workspaces.
- Feature parity with docs and sibling examples for advertised capabilities.
- Cross-link from root `README.md` and relevant guides.

## Verification

`npm run validate:examples` (required after parity or scaffold changes). When root docs or package guidance also changed, coordinate with [`prj-maintain-docs`](../prj-maintain-docs/SKILL.md).
