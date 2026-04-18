# Pagesmith

Pagesmith is a filesystem-first content toolkit organized as a multi-package workspace under the `@pagesmith/` npm scope. The site-building toolchain is Vite-native, while `@pagesmith/core` can also power headless markdown rendering inside framework apps.

Three main user-facing packages:

- `@pagesmith/core` for the headless content layer: collections, loaders, markdown with a built-in Shiki-backed code renderer, validation, schemas, assets helpers, and the `pagesmithContent` Vite plugin
- `@pagesmith/site` for site-building: the `pagesmith-site` CLI (`pagesmith` remains a compatibility alias), re-exported content-layer APIs, preset loading, JSX runtime, shared CSS/runtime behavior, Vite SSG helpers, and shared SSG utilities
- `@pagesmith/docs` for convention-based documentation on top of the site/content stack: docs preset, default docs theme, navigation from `content/`, bundled Pagefind search, schemas, and docs MCP support

Use `@pagesmith/docs` when you want a batteries-included docs site from `pagesmith.config.json5`. Use `@pagesmith/site` when you want a custom site, a framework integration (React, Solid, Svelte, Next.js, EJS, Handlebars), or full control over layouts and rendering from one Pagesmith package. Use `@pagesmith/core` directly when you only need the headless content layer.

## 1.0 Architecture Principles

- Filesystem-first content and assets
- Strict `@pagesmith/core` vs `@pagesmith/site` vs `@pagesmith/docs` boundaries
- Validation before rendering
- Vite-native toolchain and plugins
- Static-first output with progressive enhancement

See `docs/content/reference/architecture/README.md` for the full architecture and rationale.

## Install

Docs-first install:

```bash
npm add @pagesmith/docs
```

That is enough for the default docs flow. `@pagesmith/docs` is the only Pagesmith package docs users need for the preset, theme, CLI flow, and search integration.

Custom site install:

```bash
npm add @pagesmith/site
```

## Pre-1.0 Migration

Pagesmith is pre-1.0 and minor releases may include breaking changes while APIs are being finalized.

Use `MIGRATING.md` for the current upgrade checklist and import-path/script migration guidance.

## Quick Start

### Docs site (interactive setup)

```bash
npm add @pagesmith/docs
npx pagesmith-docs init
```

The interactive init prompts for project name, title, base path, content directory, search, and AI integrations — with smart defaults detected from your git remote and `package.json`. Press Enter to accept defaults or type a new value. Use `-y` to skip prompts.

### AI-first docs setup (recommended)

```bash
npx pagesmith-docs init --ai
```

This installs assistant memory files, skills/commands, markdown guidelines, and `llms*.txt` context files so agents can set up docs and keep them in sync with implementation.

Then start the dev server:

```bash
npx pagesmith-docs dev
```

### Vite site (site-first)

```ts
import { defineCollection, defineCollections, z } from "@pagesmith/site";
import { pagesmithContent, pagesmithSsg } from "@pagesmith/site/vite";
import { defineConfig } from "vite";

const content = defineCollections({
  posts: defineCollection({
    loader: "markdown",
    directory: "content/posts",
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
    }),
  }),
});

export default defineConfig({
  plugins: [
    pagesmithContent({ collections: content }),
    pagesmithSsg({ entry: "./src/entry-server.tsx" }),
  ],
});
```

### Framework host (content layer only)

```ts
import { createContentLayer, defineConfig } from "@pagesmith/core";
import collections from "./content.config";

const layer = createContentLayer(defineConfig({ collections }));
const entry = await layer.getEntry("posts", "hello-world");
const rendered = await entry?.render();
```

If your app already owns routing and build tooling (for example Next.js), render markdown through `createContentLayer()` and `entry.render()`. Add `@pagesmith/site/css/content` plus `@pagesmith/site/runtime/content` only when you want the shipped prose/code-block presentation layer.

## Packages

| Package                             | Description                                                                        | README                                             | AI Reference                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `[@pagesmith/core](packages/core/)` | Headless content layer, markdown pipeline, schemas, validation, `pagesmithContent` | [packages/core/README.md](packages/core/README.md) | [packages/core/REFERENCE.md](packages/core/REFERENCE.md) |
| `[@pagesmith/site](packages/site/)` | CLI, JSX runtime, CSS/runtime bundles, Vite SSG, shared site helpers               | [packages/site/README.md](packages/site/README.md) | [packages/site/REFERENCE.md](packages/site/REFERENCE.md) |
| `[@pagesmith/docs](packages/docs/)` | Convention-based docs preset, theme, search, navigation, schemas                   | [packages/docs/README.md](packages/docs/README.md) | [packages/docs/REFERENCE.md](packages/docs/REFERENCE.md) |

## Examples

| Example                                                   | Description                                                                             | README                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [blog-site](examples/blog-site/)                          | Custom site built on `@pagesmith/site` with Pagesmith JSX and Vite SSG                  | [README](examples/blog-site/README.md)                   |
| [doc-site](examples/doc-site/)                            | `@pagesmith/docs` with layout overrides via `theme.layouts.*` and docs preset wiring    | [README](examples/doc-site/README.md)                    |
| [with-react](examples/frameworks/with-react/)             | `@pagesmith/site` + React (react-dom/server)                                            | [README](examples/frameworks/with-react/README.md)       |
| [with-solid](examples/frameworks/with-solid/)             | `@pagesmith/site` + SolidJS                                                             | [README](examples/frameworks/with-solid/README.md)       |
| [with-svelte](examples/frameworks/with-svelte/)           | `@pagesmith/site` + Svelte 5                                                            | [README](examples/frameworks/with-svelte/README.md)      |
| [with-nextjs](examples/frameworks/with-nextjs/)           | `@pagesmith/site` content APIs inside Next.js, with optional shared content CSS/runtime | [README](examples/frameworks/with-nextjs/README.md)      |
| [with-vanilla-ejs](examples/frameworks/with-vanilla-ejs/) | `@pagesmith/site` + EJS templates                                                       | [README](examples/frameworks/with-vanilla-ejs/README.md) |
| [with-vanilla-hbs](examples/frameworks/with-vanilla-hbs/) | `@pagesmith/site` + Handlebars templates                                                | [README](examples/frameworks/with-vanilla-hbs/README.md) |

## Framework Support

| Framework  | Pattern                                                                                                                  | Example                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| React      | `pagesmithContent` + `pagesmithSsg` from `@pagesmith/site/vite`                                                          | `examples/frameworks/with-react/`       |
| SolidJS    | `pagesmithContent` + `pagesmithSsg` from `@pagesmith/site/vite`                                                          | `examples/frameworks/with-solid/`       |
| Svelte     | `pagesmithContent` + `pagesmithSsg` from `@pagesmith/site/vite`                                                          | `examples/frameworks/with-svelte/`      |
| Next.js    | `createContentLayer` from `@pagesmith/site` + optional `@pagesmith/site/css/content` / `@pagesmith/site/runtime/content` | `examples/frameworks/with-nextjs/`      |
| EJS        | `createContentLayer` from `@pagesmith/site` + `pagesmithSsg` from `@pagesmith/site/vite`                                 | `examples/frameworks/with-vanilla-ejs/` |
| Handlebars | `createContentLayer` from `@pagesmith/site` + `pagesmithSsg` from `@pagesmith/site/vite`                                 | `examples/frameworks/with-vanilla-hbs/` |
| Docs       | `@pagesmith/docs` preset on the `pagesmith-docs` CLI                                                                     | `examples/doc-site/`                    |
| Custom     | `@pagesmith/site` JSX runtime + Vite SSG on top of its re-exported content APIs                                          | `examples/blog-site/`                   |

## CSS Exports

| Import                           | Contents                           |
| -------------------------------- | ---------------------------------- |
| `@pagesmith/site/css/content`    | Prose typography + inline code     |
| `@pagesmith/site/css/standalone` | Full layout + prose + TOC          |
| `@pagesmith/site/css/viewport`   | Responsive viewport base           |
| `@pagesmith/site/css/fonts`      | Bundled Open Sans + JetBrains Mono |

Code block styling ships in the shared Pagesmith CSS bundles, while syntax token colors and copy/collapse runtime hooks are injected during markdown processing.

## Import Map

| I want to...                                                  | Import from                      |
| ------------------------------------------------------------- | -------------------------------- |
| Define collections and schemas in a custom site               | `@pagesmith/site`                |
| Define collections and schemas in a headless-only integration | `@pagesmith/core`                |
| Use the content Vite plugin in a custom site                  | `@pagesmith/site/vite`           |
| Use the content Vite plugin in a core-only integration        | `@pagesmith/core/vite`           |
| Use SSG / shared asset Vite helpers                           | `@pagesmith/site/vite`           |
| Write JSX layouts                                             | `@pagesmith/site/jsx-runtime`    |
| Add content CSS                                               | `@pagesmith/site/css/content`    |
| Add full layout CSS                                           | `@pagesmith/site/css/standalone` |
| Process markdown directly                                     | `@pagesmith/core/markdown`       |
| Use built-in loaders                                          | `@pagesmith/core/loaders`        |
| Access runtime CSS/JS paths                                   | `@pagesmith/site/runtime`        |
| Use shared SSG helpers                                        | `@pagesmith/site/ssg-utils`      |
| MCP server (core)                                             | `@pagesmith/core/mcp`            |
| MCP server (docs)                                             | `@pagesmith/docs/mcp`            |
| Use docs theme exports                                        | `@pagesmith/docs/theme`          |

## AI-Assisted Setup

The primary way to set up AI integrations is through the CLI:

```bash
npx pagesmith-docs init --ai
```

This generates:

- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` with Pagesmith context (references package usage + reference files)
- `.pagesmith/markdown-guidelines.md` with authoring rules for content
- `.claude/skills/update-docs/SKILL.md` — an `/update-docs` skill that reads the implementation and updates docs content
- `.claude/skills/ps-update-all-docs/SKILL.md` — a `/ps-update-all-docs` skill for full-repo docs regeneration, navigation checks, and skill alignment
- `.claude/skills/pagesmith/SKILL.md` — a `/pagesmith` skill for Pagesmith-specific help
- `llms.txt` and `llms-full.txt` (cover both core and docs packages)

### Set up docs via an AI assistant

Point your AI assistant at the package-shipped setup prompt:

> Add documentation to this repo using @pagesmith/docs. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` first and follow it exactly. Use `npx pagesmith-docs init --yes --ai` when it fits the repo, keep `pagesmith.config.json5` at the root, preserve useful existing docs content, and update the project memory files to point at the installed package guidance.

### Set up core via an AI assistant

> Add content collections to this repo using @pagesmith/core. Read `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` first and follow it exactly. Keep the work focused on collections, validation, markdown rendering, and either `pagesmithContent` or direct `createContentLayer()` usage.

### Reference files in npm packages

The packages ship `REFERENCE.md`, agent guidance files, and `llms*.txt` inside the npm package. After installing, link to them from your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For @pagesmith/docs usage and prompts, read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md
For the full @pagesmith/docs reference, see node_modules/@pagesmith/docs/REFERENCE.md
For @pagesmith/site usage and prompts, read node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md
For the full @pagesmith/site reference, see node_modules/@pagesmith/site/REFERENCE.md
For @pagesmith/core usage and prompts, read node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md
For the full @pagesmith/core API reference, see node_modules/@pagesmith/core/REFERENCE.md
```

Or copy the AGENTS.md template from the package:

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/AGENTS.md.template`
- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/AGENTS.md.template`
- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/AGENTS.md.template`

### Install consumer Agent Skills with `pagesmith-core skills`

Each Pagesmith package ships its own `skills/` folder inside the npm tarball (they are not separate npm packages). The bundled installer copies them into the project:

```bash
npx pagesmith-core skills
```

By default this scans `@pagesmith/core`, `@pagesmith/site`, and `@pagesmith/docs` for `skills/<name>/SKILL.md` files, writes the canonical copy at `.agents/skills/<name>/SKILL.md`, and adds thin wrappers at `.claude/skills/<name>/SKILL.md` and `.cursor/skills/<name>/SKILL.md` that point at the canonical file. Pass `--package <pkg>` (repeatable) to limit the install, `--cwd <dir>` to install into a different project, `--dry-run` to preview, or `--no-overwrite` to leave existing canonical skills untouched.

Each skill reads `node_modules/@pagesmith/<pkg>/REFERENCE.md` first so the CLI flags and config schema match the version actually installed in the project, not a globally cached one.

Browse the full set in [`packages/<pkg>/skills/`](packages/) or pick the subset that matches the package you installed.

### AI guidance files in each package

Each package ships these files under `node_modules/@pagesmith/<pkg>/`:

| File                                            | Purpose                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `REFERENCE.md`                                  | Complete reference (config, API, markdown, layouts, deployment)                                              |
| `README.md`                                     | User-facing quick start and API overview                                                                     |
| `llms.txt`                                      | Compact, package-scoped AI context index                                                                     |
| `llms-full.txt`                                 | Full AI context with all file pointers for this package                                                      |
| `skills/pagesmith-<pkg>-<action>/SKILL.md`      | Self-contained Agent Skill for a specific task (setup, add-loader, configure-nav, deploy-gh-pages, …)        |
| `skills/pagesmith-<pkg>-<action>/references/**` | Reference files that the sibling `SKILL.md` depends on, duplicated per-skill so each skill is self-contained |

The canonical home for per-package consumer guidance (setup prompts, package rules, markdown rules, usage, recipes, errors, migration, AGENTS template) is `skills/pagesmith-<pkg>-setup/references/**` inside the tarball.

## Docs

The repo uses both packages in different ways:

- `[docs/](docs/)` uses `@pagesmith/docs` with the default docs configuration
- `[examples/doc-site/](examples/doc-site/)` shows layout overrides through `theme.layouts.*` in `pagesmith.config.json5`
- `[examples/blog-site/](examples/blog-site/)` is a custom site built on `@pagesmith/site` with its own layouts and a Vite-powered asset build
- The framework examples in `[examples/](examples/)` use `@pagesmith/site` as the app-facing package across React, Solid, Svelte, Next.js, EJS, and Handlebars rendering flows

## Repo Development

Use Vite+ commands in this repo:

```bash
vp install
vp check
vp test
vp run build
```

Pagesmith uses the Vite+ toolchain here, so prefer `vp` and its built-in OXC-based tooling over direct `npm`, `eslint`, or `prettier` workflows.
