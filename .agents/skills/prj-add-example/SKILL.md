---
name: prj-add-example
description: Add a new example workspace under examples/ that stays in parity with docs and published package behavior. Use when introducing a new framework integration, template variant, or end-to-end demonstration.
---

# Project Add Example

## Quick Start

1. Read `.agents/skills/prj-examples-parity/SKILL.md` first — every new example has to start in parity.
2. Read the closest existing example (`examples/with-react/`, `examples/blog-site/`, etc.) for conventions.
3. Read `packages/site/ai-guidelines/recipes.md` or `packages/docs/ai-guidelines/recipes.md` as the spec for the new variant.

## Workflow

1. Pick the correct folder:
   - Framework integrations → `examples/frameworks/with-<framework>/`
   - Complete solutions → `examples/<name>-site/` (e.g. `examples/blog-site/`, `examples/doc-site/`)
2. Scaffold:
   - `package.json` with `name` `@pagesmith/example-<name>`, `private: true`, `type: module`, and scripts `dev`, `build`, `preview`, `check`, `test` (where applicable).
   - `tsconfig.json` extending the repo root `tsconfig.json`.
   - `vite.config.ts` using `vite-plus` and the relevant `@pagesmith/*` integrations.
   - Content under `content/` with at least two entries so collection behavior is visible.
   - A `README.md` that links to the matching root docs section.
3. Register the workspace:
   - Add the example path to the root `package.json` `workspaces` array.
   - Add `build:<example>`, `dev:<example>`, and `preview:<example>` scripts in root `package.json`.
4. Wire it into validation:
   - Ensure `npm run validate:examples` includes the new folder (see `scripts/validate-examples.ts`).
   - Add fixture references to `tests/integration/` when behavior is non-trivial.
5. Update root docs under `docs-site/content/guide/` (e.g. the frameworks series) with a new page that uses the "With an agent / Manual" two-track pattern.
6. Run `npm run cicd` (or the minimal subset) to confirm everything passes.

## Rules

- Do not add example-only dependencies that are not installed in root `node_modules/`; let npm workspaces hoist shared deps.
- Keep example content in parity with docs and other examples for advertised features (markdown, code blocks, alerts, math).
- Cross-link the new example from `README.md` and any relevant guide page.
