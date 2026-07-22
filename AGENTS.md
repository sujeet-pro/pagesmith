# Pagesmith — AI Contributor Guide

Single source of truth for AI agents working **inside** the Pagesmith monorepo. If you are maintaining, extending, or reviewing this repository, read this file top to bottom.

`CLAUDE.md` uses Claude Code's native `@AGENTS.md` import as its first line, so this file loads automatically as memory — do not duplicate guidance there beyond a small Claude-specific addendum below the import. `.claude/settings.json` pre-approves `Bash(npm run *)`, `Bash(npx pagesmith *)`, and `Bash(npx diagramkit *)` for Claude Code. **Contributor** Agent Skills are canonical under [`.agents/skills/`](./.agents/skills/) only; [`.claude/skills/`](./.claude/skills/) and [`.cursor/skills/`](./.cursor/skills/) are **reference-only mirrors** (same folder names, each `SKILL.md` points at the matching canonical file). Never treat `.claude/skills/` or `.cursor/skills/` as the place to author or edit skill bodies.

## Scope Split

This repo has **two audiences** for AI guidance. Do not mix them up.

| Audience                                 | Where guidance lives                                                                                                                                                             | Who reads it                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Contributors** (maintaining Pagesmith) | `AGENTS.md`, `CLAUDE.md`, `.agents/skills/` (canonical `prj-*` skills), `.claude/skills/` + `.cursor/skills/` (wrappers only — must mirror `.agents/skills/`)                    | Agents working in the monorepo itself                  |
| **Consumers** (using `@pagesmith/*`)     | Each package's `packages/<pkg>/skills/pagesmith-<pkg>-<action>/`, each `packages/<pkg>/REFERENCE.md`, each package's root `llms.txt` / `llms-full.txt`, `packages/docs/schemas/` | Agents working in a project that installed the package |

Published consumer surface ships inside the npm tarballs:

- `node_modules/@pagesmith/core/` — `REFERENCE.md`, `llms.txt`, `llms-full.txt`, `skills/pagesmith-core-*/`
- `node_modules/@pagesmith/site/` — `REFERENCE.md`, `llms.txt`, `llms-full.txt`, `skills/pagesmith-site-*/`
- `node_modules/@pagesmith/docs/` — `REFERENCE.md`, `llms.txt`, `llms-full.txt`, `skills/pagesmith-docs-*/`, `schemas/`

Each `skills/pagesmith-<pkg>-<action>/` folder is a self-contained Agent Skill with a `SKILL.md` and a sibling `references/` folder. Every reference a skill needs is duplicated inside its own `references/` folder so the skill is self-contained. Consumers invoke a skill directly from its installed path (for example, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/`) or copy the folder into their project's `.agents/skills/` tree.

## Repository Layout

```
pagesmith/
├── AGENTS.md                 # this file (contributor guide)
├── CLAUDE.md                 # @AGENTS.md native import + Claude-only addendum
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
├── .agents/skills/prj-*/                # canonical contributor skills (edit here)
├── .agents/skills/prj-diagramkit-{auto,review}/  # repo-local diagramkit pointers (+ Pagesmith notes); engines → node_modules/diagramkit/skills/
├── .agents/skills/diagramkit-*/         # installer-managed stubs → node_modules/diagramkit/skills/ (regenerate: npx diagramkit skills install; checked by validate:skills — never hand-edit)
├── .claude/skills/prj-*/                # mirror: thin wrappers → read .agents/skills/prj-*
├── .claude/settings.json      # pre-approved Bash permissions (npm run *, npx pagesmith *, npx diagramkit *)
├── .cursor/skills/prj-*/                # mirror: thin wrappers → read .agents/skills/prj-*
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
- `allowed-tools` frontmatter grants only the owning package's own CLI (`Bash(npx pagesmith-core *)` under `packages/core/skills/`, `Bash(npx pagesmith-site *)` under `packages/site/skills/`, `Bash(npx pagesmith-docs *)` under `packages/docs/skills/`) so Claude Code can run it without a permission prompt.

When public behavior changes, update the matching `packages/<pkg>/skills/pagesmith-<pkg>-*/SKILL.md` (and their `references/`) in the same branch. Run `prj-maintain-docs` to keep per-package `skills/`, `schemas/`, `llms.txt`, `llms-full.txt`, root docs, and diagrams version-aligned with the implementation.

## Contributor Skills Contract (`.agents/skills/`)

- **Canonical source of truth:** `.agents/skills/<skill-name>/SKILL.md` (every contributor skill: `prj-*` and `prj-diagramkit-*`). All substantive content — workflow steps, tables, code samples, links — lives **only** there.
- **Tool mirrors:** `.claude/skills/` and `.cursor/skills/` must stay in **lockstep** with `.agents/skills/`:
  - The same set of directories (one folder per canonical skill, identical names).
  - No extra skill folders under `.claude/skills/` or `.cursor/skills/` that do not exist under `.agents/skills/`.
  - Each mirrored `SKILL.md` is a short pointer that tells the agent to read `.agents/skills/<skill-name>/SKILL.md`. Optionally duplicate canonical frontmatter `name` and `description` for discoverability in each tool — when those fields change in the canonical file, update them in both wrappers in the **same commit**.
- **Do not** edit workflow prose in `.claude/skills/` or `.cursor/skills/`. **Do not** add a skill only under a tool directory without adding the canonical `.agents/skills/<skill-name>/SKILL.md` first.
- **Whenever you add, remove, or rename** a skill under `.agents/skills/`, update `.claude/skills/` and `.cursor/skills/` in the same change (add/remove/rename matching folders and wrapper files).
- **Sanity check** (three trees must list the same directory names): `diff <(ls -1 .agents/skills | sort) <(ls -1 .cursor/skills | sort)` and `diff <(ls -1 .agents/skills | sort) <(ls -1 .claude/skills | sort)` — neither should print anything.
- All contributor skills use the `prj-` prefix (`prj-*` and `prj-diagramkit-*`) and stay self-contained where applicable so they can be cloned into other Pagesmith-like repos without modification.

## diagramkit Skills Contract (`.agents/skills/prj-diagramkit-*`)

The `diagramkit` npm package ships Agent Skills under `node_modules/diagramkit/skills/diagramkit-*/SKILL.md` (engine selection, per-engine authoring, setup, review). **Per-engine authoring** (`diagramkit-mermaid`, `diagramkit-excalidraw`, `diagramkit-draw-io`, `diagramkit-graphviz`) and **bootstrap** (`diagramkit-setup`) are read **directly** from that path — this repo does not duplicate thin wrappers for them under `.agents/skills/`.

Only two repo-local contributor skills wrap diagramkit here:

- **`prj-diagramkit-auto`** — points at `diagramkit-auto` plus Pagesmith-specific notes (sibling `diagrams/`, `npm run render:diagrams`, embed patterns).
- **`prj-diagramkit-review`** — points at `diagramkit-review` plus Pagesmith-specific audit scope and reporting paths.

- `.agents/skills/prj-diagramkit-{auto,review}/SKILL.md` — edit when Pagesmith-specific notes change; never hand-edit `node_modules/diagramkit/skills/**`.
- `.claude/skills/prj-diagramkit-*/SKILL.md` and `.cursor/skills/prj-diagramkit-*/SKILL.md` — **mirrors only** (same rules as **Contributor Skills Contract** above); folder names must match `.agents/skills/` exactly (here: only `prj-diagramkit-auto` and `prj-diagramkit-review`).
- Bump `diagramkit` to pull updated upstream skill bodies. If `diagramkit` ships a **new** skill you need often, read `node_modules/diagramkit/skills/diagramkit-<name>/SKILL.md`. Add a new `prj-diagramkit-<name>/SKILL.md` under `.agents/skills/` **only** when you must persist Pagesmith-specific notes in-repo; otherwise rely on `node_modules`.
- Pagesmith-specific docs + diagram workflow lives in `prj-maintain-docs`: prose vs code, **when** to diagram, **how** to embed, delegate engine choice to **`prj-diagramkit-auto`**, authoring to **`node_modules/diagramkit/skills/diagramkit-<engine>/`**, audits to **`prj-diagramkit-review`**.

### Repo-local diagramkit skills

| Skill                   | Purpose                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `prj-diagramkit-auto`   | Choose engine (Mermaid / Excalidraw / Draw.io / Graphviz); then follow `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`. |
| `prj-diagramkit-review` | Repo-wide audit + repair; delegates per-engine fixes via `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`.               |

Read `node_modules/diagramkit/REFERENCE.md` before running any `diagramkit` command — it's version-pinned to the installed package.

## Contributor Skills

| Skill                   | Purpose                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prj-maintain-docs`     | Align `docs/content/`, package `skills/` / `llms*.txt` / schemas, consumer `skills/pagesmith-*`, diagrams, and `packages/core/src/ai/**` with the code. |
| `prj-maintain-examples` | Update every example for behavior changes or scaffold a new `examples/` workspace with validation and guide cross-links.                                |
| `prj-review-repo`       | Review changes with repo context: boundaries, tests, docs/examples/diagram parity, validation, release readiness.                                       |
| `prj-release`           | Publish a coordinated `@pagesmith/core` + `@pagesmith/site` + `@pagesmith/docs` release.                                                                |
| `prj-extend-packages`   | Add a content loader, markdown pipeline plugin, or site preset (`@pagesmith/core` / `@pagesmith/site`).                                                 |

## Keeping AI Guidance Current

Any public behavior change updates, in the same branch:

- Implementation under `packages/<pkg>/src/**`.
- Matching package guidance under `packages/<pkg>/skills/pagesmith-<pkg>-*/references/**`, `packages/<pkg>/llms.txt`, `packages/<pkg>/llms-full.txt`, and `packages/<pkg>/REFERENCE.md`.
- Root consumer skills under `skills/pagesmith-*/SKILL.md` if the feature surfaces there.
- Root docs site content under `docs/content/**`.
- Affected examples under `examples/**`.
- AI installer content under `packages/core/src/ai/**`.
- Diagrams under sibling `diagrams/` folders (run `npm run render:diagrams`).
- Contributor skills under `.agents/skills/**` if workflow steps changed, and the matching thin wrappers under `.claude/skills/**` and `.cursor/skills/**` (same folder names; update or add wrappers when the canonical skill set changes).

## Repo Rules

- Contributor guidance lives only in `AGENTS.md` and `.agents/skills/prj-*/SKILL.md`. Each `packages/*/skills/pagesmith-*-setup/references/` folder is consumer-facing and ships in the npm tarball.
- The root docs site uses `pagesmith.config.json5`; its content lives in `docs/content/`.
- Site-building behavior changes must update `packages/site/skills/pagesmith-site-setup/references/**`, `packages/site/README.md`/`REFERENCE.md`, root docs pages covering CLI/Vite/runtime/CSS/layouts, and affected custom-site examples.
- Markdown/code-renderer changes must update implementation plus `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`, root docs pages covering markdown/code, example feature pages across all examples, and markdown tests.
- Docs-package changes must update `packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md`, `docs-guidelines.md`, `schemas/*.schema.json`, root docs pages for config/frontmatter/navigation/deployment, and `examples/doc-site/`.
- When writing or updating docs, follow `prj-maintain-docs` and add diagrams wherever they materially simplify the explanation. Keep diagram sources plus rendered light/dark SVGs in sibling `diagrams/` folders and render them with `npm run render:diagrams`.
- Every release needs a `MIGRATING.md` entry for the version being published. `npm run validate:pagesmith` gates on it (`scripts/migrating-version-gate.ts`): the top-most `## X.Y.Z (...)` heading must be at or ahead of `packages/core/package.json`'s version, so a release with no matching entry fails the check instead of shipping silently undocumented.
- Example `llms.txt` / `llms-full.txt` (per `prj-maintain-examples`) are hand-authored, not generated. `npm run validate:examples` still cross-checks every backtick-quoted file reference each one makes and fails if a referenced file no longer exists — a cheap, deterministic stand-in for full regeneration (see `scripts/llms-reference-check.ts`) that catches drift after a rename, move, or delete.

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

- Use `diagramkit` for diagram rendering (`diagramkit.config.json5`, `package.json` scripts). It lives in root `devDependencies` — it drives the docs build/validate pipeline only, and the root `package.json` is `private` and never published.
- Put editable source files in a `diagrams/` folder next to the markdown that references them.
- Render light and dark SVG variants as direct siblings of the source file (`sameFolder: true`).
- Prefer SVG. Add PNG only when another surface explicitly needs a raster.
- Re-render from source instead of hand-editing generated images.

Embed pattern for Pagesmith-rendered docs (`docs/content/**`, `examples/**/docs/**`, any surface with the shared theme CSS):

```html
<figure>
  <img src="./diagrams/system-overview-light.svg" class="only-light" alt="..." />
  <img src="./diagrams/system-overview-dark.svg" class="only-dark" alt="..." />
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

For full diagram authoring rules, engine selection, embed patterns, and the full-repo documentation pass prompt, follow `prj-maintain-docs`. It delegates engine choice to `prj-diagramkit-auto`, per-engine authoring to `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`, and repo-wide audits to `prj-diagramkit-review`.

## Commands

```bash
vp install
vp check
vp test
vp run build
vp run build:docs              # transitively runs `npm run validate:diagrams`
vp run build:examples
vp run validate:examples
npm run validate:pagesmith     # docs content/build + repo cross-refs + MIGRATING.md release gate
npm run validate:skills        # consumer skill frontmatter (name/allowed-tools) + umbrella-CLI checks
npm run diagramkit:warmup
npm run render:diagrams        # render + validate every project diagram SVG
npm run validate:diagrams      # validate-only (structure + embed-safety + WCAG 2.2 AA contrast)
npm run validate               # full suite: build + validate:{examples,pagesmith,skills,a11y} + check + test
```

`npm run validate:diagrams` is wired into `build:docs`, so any docs build fails fast on broken or low-contrast diagram SVGs. `scripts/render-diagrams.ts` is a thin wrapper over diagramkit's own CLI: it scopes both render and validate to project-owned diagrams via `diagramkit validate . --recursive --scope-dir diagrams` (skipping `gh-pages/`, `node_modules/`, and other generated/vendored locations by diagramkit's own default ignore list) and promotes fatal classes via `--fail-on`: any `severity: error`, plus `LOW_CONTRAST_TEXT`, `CONTAINS_FOREIGN_OBJECT`, `CONTAINS_SCRIPT`, and `EXTERNAL_RESOURCE` warnings — because the docs site embeds SVGs via `<img>` / `<figure>` / `<picture>`, all four silently degrade in those embeds.
