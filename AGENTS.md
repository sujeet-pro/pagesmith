# Pagesmith — AI Contributor Guide

Single source of truth for AI agents working **inside** the Pagesmith monorepo. If you are maintaining, extending, or reviewing this repository, read this file top to bottom.

Other agent-config files (`CLAUDE.md`, `.claude/skills/`, `.cursor/skills/`) are thin wrappers that point here.

## Scope Split

This repo has **two audiences** for AI guidance. Do not mix them up.

| Audience | Where guidance lives | Who reads it |
| --- | --- | --- |
| **Contributors** (maintaining Pagesmith) | `AGENTS.md`, `CLAUDE.md`, `.agents/skills/prj-*`, `.claude/skills/prj-*`, `.cursor/skills/prj-*` | Agents working in the monorepo itself |
| **Consumers** (using `@pagesmith/*`) | Each package's `packages/<pkg>/skills/pagesmith-<pkg>-<action>/`, each `packages/<pkg>/REFERENCE.md`, each package's root `llms.txt` / `llms-full.txt`, `packages/docs/schemas/` | Agents working in a project that installed the package |

Published consumer surface ships inside the npm tarballs:

- `node_modules/@pagesmith/core/` — `REFERENCE.md`, `llms.txt`, `llms-full.txt`, `skills/pagesmith-core-*/`
- `node_modules/@pagesmith/site/` — `REFERENCE.md`, `llms.txt`, `llms-full.txt`, `skills/pagesmith-site-*/`
- `node_modules/@pagesmith/docs/` — `REFERENCE.md`, `llms.txt`, `llms-full.txt`, `skills/pagesmith-docs-*/`, `schemas/`

Each `skills/pagesmith-<pkg>-<action>/` folder is a self-contained Agent Skill with a `SKILL.md` and a sibling `references/` folder. Every reference a skill needs is duplicated inside its own `references/` folder so the skill is self-contained. Consumers invoke a skill directly from its installed path (for example, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/`) or copy the folder into their project's `.agents/skills/` tree.

## Repository Layout

```
pagesmith/
├── AGENTS.md                 # this file (contributor guide)
├── CLAUDE.md                 # thin pointer → AGENTS.md
├── README.md
├── MIGRATING.md
├── LICENSE
├── package.json              # monorepo workspaces
├── pagesmith.config.json5    # root docs config
├── diagramkit.config.json5   # root diagramkit config
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
├── llms.txt, llms-full.txt   # llms-friendly repo indexes
│
├── .agents/skills/prj-*/     # canonical contributor skills
├── .claude/skills/prj-*/     # thin wrappers → .agents/skills/prj-*
├── .cursor/skills/prj-*/     # thin wrappers → .agents/skills/prj-*
├── .github/                  # workflows, templates
├── .gitignore
├── .temp/                    # scratch workspace (git-ignored)
├── .vite-hooks/              # local git hook glue
│
├── packages/
│   ├── core/                 # @pagesmith/core
│   │   ├── src/              # implementation
│   │   ├── skills/           # consumer Agent Skills (pagesmith-core-*) — each skill has its own references/
│   │   ├── llms.txt          # compact, package-scoped AI index (published)
│   │   ├── llms-full.txt     # full AI context for this package (published)
│   │   ├── REFERENCE.md      # published API reference
│   │   ├── README.md
│   │   └── package.json
│   ├── site/                 # @pagesmith/site (same shape as core, skills named pagesmith-site-*)
│   └── docs/                 # @pagesmith/docs (adds schemas/, theme/; skills named pagesmith-docs-*)
│
├── docs/content/        # root docs site content (uses @pagesmith/docs)
├── examples/                 # example consumer projects
│   ├── blog-site/
│   ├── doc-site/
│   └── frameworks/with-*/
├── scripts/                  # monorepo scripts (build, render, validate)
└── tests/                    # integration + e2e
```

Keep folder nesting shallow (max 3–4 levels from the repo root for any source file). If a new concept would require deeper nesting, add a sibling package instead.

## Scratch Space (`.temp/`)

- All exploratory or working files (plans, notes, cloned reference repos, scratch diffs) must live under `.temp/`.
- Conventions:
  - `.temp/plans/<name>.md` — implementation plans.
  - `.temp/reference-repo/<repo>/` — cloned repos you're analyzing.
  - `.temp/notes/<date>.md` — working notes.
  - `.temp/cache/` — any tool cache the agent needs between runs.
- `.temp/` is already in `.gitignore`. Never commit its contents.
- Do not scatter scratch files across the repo. If a working doc outgrows `.temp/`, promote it into `AGENTS.md`, the right `.agents/skills/prj-*/SKILL.md`, or `docs/content/` with a proper title.

## Architecture Snapshot

Three public packages under `@pagesmith/`:

- `@pagesmith/core` (`packages/core/`) — headless content layer, markdown pipeline, validation, assets helpers, `pagesmithContent`, core MCP server.
- `@pagesmith/site` (`packages/site/`) — `pagesmith-site` CLI, preset loading, JSX runtime, CSS/runtime exports, Vite SSG helpers, shared site behavior.
- `@pagesmith/docs` (`packages/docs/`) — config-driven docs preset/theme, navigation generation, listing pages, Pagefind integration, schema generation, docs-specific runtime helpers.

Dependency graph:

```text
@pagesmith/core   → standalone
@pagesmith/site   → @pagesmith/core
@pagesmith/docs   → @pagesmith/core + @pagesmith/site
```

## Locked Principles

1. Filesystem-first source of truth.
2. Strict package boundaries — content in core, site-building in site, docs conventions in docs.
3. Validation at content boundaries before render/runtime use.
4. Vite-native execution model.
5. Progressive enhancement over JS-heavy runtime.
6. Configuration before customization.
7. Docs, examples, and published AI guidance move together when behavior changes.
8. Clear modules, shallow folder nesting, no cross-module reach-arounds.

## Source Of Truth

### `@pagesmith/core`

- Implementation: `packages/core/src/**`
- Markdown pipeline: `packages/core/src/markdown/pipeline.ts`, `packages/core/src/markdown/code/**`
- Validation pipeline: `packages/core/src/store.ts`, `packages/core/src/validation/**`
- Vite content plugin: `packages/core/src/vite/**`
- Published consumer surface: `packages/core/skills/pagesmith-core-setup/references/**`, `packages/core/README.md`, `packages/core/REFERENCE.md`
- AI installer strings: `packages/core/src/ai/**`

Core behaviors to preserve when changing this package:

- Built-in Pagesmith code renderer on top of Shiki.
- Shared code-block CSS lives in the bundles published from `@pagesmith/site`.
- Vite plugin exports under `@pagesmith/core/vite`.
- MCP server resource behavior under `@pagesmith/core/mcp`.
- Zod-first schemas with validation at content boundaries.
- Filesystem-first loaders: `load(filePath) -> LoaderResult`, no IO outside `load()`.

### `@pagesmith/site`

- Implementation: `packages/site/src/**`
- CLI/preset/config flow: `packages/site/src/cli/**`, `packages/site/src/config.ts`, `packages/site/src/preset.ts`
- JSX / runtime / CSS / Vite SSG: `packages/site/src/jsx-runtime/**`, `packages/site/src/runtime/**`, `packages/site/src/css/**`, `packages/site/src/vite/**`, `packages/site/src/ssg-utils/**`
- Published consumer surface: `packages/site/skills/pagesmith-site-setup/references/**`, `packages/site/README.md`, `packages/site/REFERENCE.md`

### `@pagesmith/docs`

- Implementation: `packages/docs/src/**`, `packages/docs/theme/**`
- Config/build/render/server flow: `packages/docs/src/config/**`, `packages/docs/src/build.ts`, `packages/docs/src/render.ts`, `packages/docs/src/server.ts`, `packages/docs/src/server/shared.ts`
- Published consumer surface: `packages/docs/skills/pagesmith-docs-setup/references/**`, `packages/docs/schemas/**`, `packages/docs/README.md`, `packages/docs/REFERENCE.md`
- Schema generation: `packages/docs/src/schemas/**`, `packages/docs/scripts/generate-json-schemas.mjs`

### Monorepo Content

- Root docs site content: `docs/content/**`
- Root docs site config: `pagesmith.config.json5`
- Example sites: `examples/**`
- Release/build helpers: `scripts/**`

## Consumer Skills Contract (per-package `skills/`)

Consumer Agent Skills live inside each package and ship in the npm tarball under `node_modules/@pagesmith/<pkg>/skills/`. Rules:

- Every skill lives in `packages/<pkg>/skills/pagesmith-<pkg>-<action>/SKILL.md`, where `<pkg>` is `core`, `site`, or `docs`. The first segment of the skill name MUST match the package that owns it.
- `name` frontmatter matches the folder (Agent Skills spec: <https://agentskills.io/specification>).
- `description` is imperative, 1–2 sentences, tells the agent **when** to trigger.
- **Self-contained.** Every reference file a skill needs lives inside its own `references/` folder as a duplicated copy. Do NOT share a single `references/` across skills. If two skills need the same reference, duplicate it. If a skill needs a reference from a different package, it reads it through the dependency tree at `node_modules/@pagesmith/<other-pkg>/skills/<other-skill>/references/<file>`.
- Body stays under ~500 lines / ~5,000 tokens.
- Only cite paths the consumer's project actually has: `node_modules/@pagesmith/*/REFERENCE.md`, `node_modules/@pagesmith/*/llms.txt`, `node_modules/@pagesmith/*/skills/**/references/`, `node_modules/@pagesmith/docs/schemas/`.

When public behavior changes, update the matching `packages/<pkg>/skills/pagesmith-<pkg>-*/SKILL.md` (and their `references/`) in the same branch. Run `prj-sync-package-ai-guidelines` to keep per-package `skills/`, `schemas/`, `llms.txt`, and `llms-full.txt` version-aligned.

## Contributor Skills Contract (`.agents/skills/prj-*`)

- Canonical contributor skills live under `.agents/skills/prj-*/SKILL.md`.
- `.claude/skills/prj-*/SKILL.md` and `.cursor/skills/prj-*/SKILL.md` contain only a short pointer sentence that tells the client agent to read the canonical file at `.agents/skills/prj-<name>/SKILL.md`.
- Edit the canonical copy. Do not edit the wrappers.
- All contributor skills share the `prj-` prefix and stay self-contained so they can be cloned into other Pagesmith-like repos without modification.

## Contributor Skills

| Skill | Purpose |
| --- | --- |
| `prj-update-content` | Refresh root docs, examples, package AI guidance, and diagrams together. |
| `prj-examples-parity` | Keep examples aligned with docs/package behavior and diagram conventions. |
| `prj-sync-package-ai-guidelines` | Update published package AI guidance, schemas, and docs/diagram guidance. |
| `prj-pagesmith-review` | Review diffs for behavior, parity, diagram drift, and release readiness. |
| `prj-docs-diagrams` | Review docs pages and add diagrams with `diagramkit`. |
| `prj-release` | Publish a coordinated `@pagesmith/core` + `@pagesmith/site` + `@pagesmith/docs` release. |
| `prj-add-example` | Add a new example workspace that stays in parity with docs/packages. |
| `prj-add-loader` | Add a new content loader to `@pagesmith/core`. |
| `prj-add-markdown-plugin` | Add a remark or rehype plugin to the markdown pipeline. |
| `prj-add-preset` | Add a new `@pagesmith/site` preset. |

## Keeping AI Guidance Current

Any public behavior change updates, in the same branch:

- Implementation under `packages/<pkg>/src/**`.
- Matching package guidance under `packages/<pkg>/skills/pagesmith-<pkg>-*/references/**`, `packages/<pkg>/llms.txt`, `packages/<pkg>/llms-full.txt`, and `packages/<pkg>/REFERENCE.md`.
- Root consumer skills under `skills/pagesmith-*/SKILL.md` if the feature surfaces there.
- Root docs site content under `docs/content/**`.
- Affected examples under `examples/**`.
- AI installer content under `packages/core/src/ai/**`.
- Diagrams under sibling `diagrams/` folders (run `npm run render:diagrams`).
- Contributor skills under `.agents/skills/**` if workflow steps changed.

## Repo Rules

- Contributor guidance lives only in `AGENTS.md` and `.agents/skills/prj-*/SKILL.md`. Each `packages/*/skills/pagesmith-*-setup/references/` folder is consumer-facing and ships in the npm tarball.
- The root docs site uses `pagesmith.config.json5`; its content lives in `docs/content/`.
- Site-building behavior changes must update `packages/site/skills/pagesmith-site-setup/references/**`, `packages/site/README.md`/`REFERENCE.md`, root docs pages covering CLI/Vite/runtime/CSS/layouts, and affected custom-site examples.
- Markdown/code-renderer changes must update implementation plus `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`, root docs pages covering markdown/code, example feature pages across all examples, and markdown tests.
- Docs-package changes must update `packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md`, `docs-guidelines.md`, `schemas/*.schema.json`, root docs pages for config/frontmatter/navigation/deployment, and `examples/doc-site/`.
- When writing or updating docs, follow `prj-docs-diagrams` and add diagrams wherever they materially simplify the explanation. Keep diagram sources plus rendered light/dark SVGs in sibling `diagrams/` folders and render them with `npm run render:diagrams`.

## Hosting And Routing Rules

- Canonical browser URLs are slashless.
- Keep GitHub Pages compatibility: `.nojekyll`, root `404.html`, direct asset passthrough, and static extensionless route serving.
- The preview server must continue serving directly from the filesystem so rebuilds do not require restart.
- Keep asset passthrough first-class for files like `llms.txt`, `llms-full.txt`, prompts, and schemas.

## Markdown Parity

The single source of truth for supported markdown:

- Pipeline: `packages/core/src/markdown/pipeline.ts`
- Renderer: `packages/core/src/markdown/code/**`
- Validators: `packages/core/src/validation/code-block-validator.ts`, `heading-validator.ts`, `link-validator.ts`
- Published guidance: `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
- Root docs and examples: `docs/content/guide/code-blocks/README.md`, `docs/content/guide/markdown-features/README.md`, `examples/**/content/features/*.md`, `tests/integration/markdown.test.ts`

Maintainer rules:

- The current renderer is the built-in Pagesmith renderer on top of Shiki. Do not leave stale references to Expressive Code or any other renderer.
- Keep supported code-block meta syntax synchronized across implementation, tests, docs, examples, and package AI guidance.
- Keep frontmatter/meta examples aligned with the published schemas.
- High-drift areas to recheck on every markdown change: code-block feature pages across all examples, root docs reference pages vs. package `markdown-guidelines.md`, AI installer markdown hints in `packages/core/src/ai/**`, and frontmatter examples using old field names or outdated ordering rules.

## Diagrams

Repo defaults:

- Use `diagramkit` for diagram rendering (`diagramkit.config.json5`, `package.json` scripts).
- Put editable source files in a `diagrams/` folder next to the markdown that references them.
- Render light and dark SVG variants as direct siblings of the source file (`sameFolder: true`).
- Prefer SVG. Add PNG only when another surface explicitly needs a raster.
- Re-render from source instead of hand-editing generated images.

Embed pattern for Pagesmith-rendered docs (`docs/content/**`, `examples/**/docs/**`, any surface with the shared theme CSS):

```html
<figure>
  <img src="./diagrams/system-overview-light.svg" class="only-light" alt="...">
  <img src="./diagrams/system-overview-dark.svg" class="only-dark" alt="...">
  <figcaption>Docs build pipeline</figcaption>
</figure>
```

For simple black-and-white diagrams that don't need separate renders, use `.invert-on-dark`. For non-image content that should toggle with the color scheme, use `.show-on-light` / `.show-on-dark`.

Embed pattern for GitHub-facing markdown (package `README.md`, package `REFERENCE.md`, repo `README.md`, anything primarily consumed on GitHub):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./diagrams/system-overview-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./diagrams/system-overview-light.svg" />
  <img alt="..." src="./diagrams/system-overview-light.svg" />
</picture>
```

For full diagram authoring rules, engine selection, and the full-repo pass prompt, follow `prj-docs-diagrams`.

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
