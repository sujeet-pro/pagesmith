# Pagesmith

Repo-level maintainer context for the Pagesmith monorepo.

## Guidance Surfaces

- **Use this file, `AGENTS.md`, root `ai-guidelines/` (especially `docs-guidelines.md`, `markdown-guidelines.md`, `diagram-guidelines.md`, and `docs-diagram-pass-prompt.md`), and `.agents/skills/`** when maintaining this repository.
- `.claude/skills/` and `.cursor/skills/` contain thin wrappers that forward to `.agents/skills/`. Edit the canonical copy under `.agents/skills/` only.
- **Use `packages/core/ai-guidelines/`, `packages/site/ai-guidelines/`, `packages/docs/ai-guidelines/`, `packages/*/skills/`, and `packages/docs/schemas/`** when updating the published package contract for library users.
- **Use `docs-site/content/` plus the repo-root `pagesmith.config.json5`** for the latest docs site that documents current main-branch behavior.

## Scratch Space

- All exploratory or working files (plans, notes, cloned reference repos, scratch diffs) must live under `.temp/`. Examples:
  - `.temp/plans/<name>.md`
  - `.temp/reference-repo/<repo-name>/`
  - `.temp/notes/<date>.md`
- `.temp/` is already in `.gitignore`. Never commit its contents.
- Do not scatter scratch files across the repo; if a working doc outgrows `.temp/`, promote it to `ai-guidelines/` or `docs-site/content/` with a proper title.

## Keeping AI Guidance Current

When code, architecture, public behavior, folder layout, or philosophy changes, update in the same branch:

- Root `ai-guidelines/**` for repo-maintainer guidance.
- Per-package `packages/*/ai-guidelines/**`, `packages/*/skills/**`, `packages/*/README.md`, `packages/*/REFERENCE.md` for consumer-facing guidance.
- Generated AI installer content under `packages/core/src/ai/**`.
- Affected project skills under `.agents/skills/**` (and refresh the thin `.claude/skills/**` and `.cursor/skills/**` wrappers if the skill name or description changes).
- Root docs site under `docs-site/content/**` and affected examples under `examples/**`.

## What matters most

- `**@pagesmith/core**` (`packages/core/`) — headless content layer, markdown pipeline, validation, assets helpers, `pagesmithContent`, and the core MCP server.
- `**@pagesmith/site**` (`packages/site/`) — `pagesmith-site` CLI, preset loading, JSX runtime, CSS/runtime exports, Vite SSG helpers, and shared assets/runtime behavior.
- `**@pagesmith/docs**` (`packages/docs/`) — config-driven docs preset/theme built on top of core + site, Pagefind integration, schema generation, listing pages, and docs-specific MCP server.
- **Root docs site** — config lives at `pagesmith.config.json5`; content lives in `docs-site/content/`.
- **Examples** — `examples/blog-site/`, `examples/doc-site/`, and `examples/with-*` are part of the contract and must stay behaviorally aligned with the packages and docs.
- **AI installer** — `packages/core/src/ai/` generates project memory files and skills; those generated references must track the published package paths under `node_modules/@pagesmith/*/ai-guidelines/` and `node_modules/@pagesmith/docs/schemas/`.
- **Diagram workflow** — repo docs visuals use `diagramkit` with `diagramkit.config.json5`, page-local `diagrams/` folders, and light/dark SVG renders as siblings of each source diagram file.

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
- `packages/site/ai-guidelines/*.md`
- `packages/site/ai-guidelines/llms*.txt`
- `packages/site/README.md`
- `packages/site/REFERENCE.md`
- `packages/docs/ai-guidelines/*.md`
- `packages/docs/ai-guidelines/llms*.txt`
- `packages/docs/schemas/*.schema.json`
- `packages/docs/README.md`
- `packages/docs/REFERENCE.md`

For consuming projects, the installed package paths should look like:

- `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/markdown-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- `node_modules/@pagesmith/site/ai-guidelines/site-guidelines.md`
- `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- `node_modules/@pagesmith/site/ai-guidelines/recipes.md`
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
- `node_modules/@pagesmith/docs/ai-guidelines/markdown-guidelines.md`
- `node_modules/@pagesmith/docs/ai-guidelines/usage.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`

## Maintainer workflow

When behavior changes:

- Update implementation first in `packages/core/src/`**, `packages/site/src/**`, or `packages/docs/src/**`.
- Update published package guidance in `packages/*/ai-guidelines/**`, package READMEs/REFERENCE docs, and `packages/docs/schemas/**` when relevant.
- Update generated AI artifact references under `packages/core/src/ai/**`.
- Update the root docs site under `docs-site/content/**`.
- Update all affected examples under `examples/**`.
- Update diagrams when they materially simplify docs, README, REFERENCE, or AI-guidance explanations.
- Update tests and validation checks.

## High-risk drift areas

- Markdown/code renderer facts versus docs/examples/package `markdown-guidelines.md`
- Site-building ownership drift between `packages/core/**`, `packages/site/**`, and the published guidance
- Docs frontmatter/meta/schema rules versus `packages/docs/schemas/*.schema.json`
- Docs hosting behavior versus `packages/docs/src/build.ts`, `packages/docs/src/server.ts`, and deployment docs
- Example content versus the root docs site and package AI guidance

## Repo-specific rules

- Keep slashless URLs as the canonical browser form while preserving GitHub Pages compatibility.
- Keep the preview server serving current files from disk after rebuilds.
- Keep asset passthrough first-class for files like `llms.txt`, `llms-full.txt`, prompts, and schemas.
- Never treat root `ai-guidelines/` as the published package contract; those files are for maintaining this repo.
- Keep diagram source files plus rendered light/dark SVG outputs together in sibling `diagrams/` folders.
- Render repo diagrams with `npm run render:diagrams` and do not hand-edit generated SVG outputs.

## Project skills

Canonical copies live under `.agents/skills/`; Claude and Cursor discover them via thin wrappers at `.claude/skills/<name>/SKILL.md` and `.cursor/skills/<name>/SKILL.md`.

- `.agents/skills/prj-update-content/`
- `.agents/skills/prj-examples-parity/`
- `.agents/skills/prj-sync-package-ai-guidelines/`
- `.agents/skills/prj-pagesmith-review/`
- `.agents/skills/prj-docs-diagrams/`
- `.agents/skills/prj-release/`
- `.agents/skills/prj-add-example/`
- `.agents/skills/prj-add-loader/`
- `.agents/skills/prj-add-markdown-plugin/`
- `.agents/skills/prj-add-preset/`

## Project prompts

- `ai-guidelines/docs-diagram-pass-prompt.md`

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

