# Pagesmith

 Pagesmith is a filesystem-first content toolkit organized as a multi-package workspace under the `@pagesmith/` npm scope. The site-building toolchain is Vite-native, while `@pagesmith/core` can also power headless markdown rendering inside framework apps.

Three main user-facing packages:

- `@pagesmith/core` for the headless content layer: collections, loaders, markdown with a built-in Shiki-backed code renderer, validation, schemas, assets helpers, and the `pagesmithContent` Vite plugin
- `@pagesmith/site` for site-building: the `pagesmith-site` CLI (`pagesmith` remains a compatibility alias), preset loading, JSX runtime, shared CSS/runtime behavior, Vite SSG helpers, and shared SSG utilities
- `@pagesmith/docs` for convention-based documentation on top of core + site: docs preset, default docs theme, navigation from `content/`, bundled Pagefind search, schemas, and docs MCP support

Use `@pagesmith/docs` when you want a batteries-included docs site from `pagesmith.config.json5`. Use `@pagesmith/core` + `@pagesmith/site` when you want a custom site, a framework integration (React, Solid, Svelte, Next.js, EJS, Handlebars), or full control over layouts and rendering.

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

That is enough for the default docs flow. `@pagesmith/docs` depends on both `@pagesmith/core` and `@pagesmith/site`, so the docs preset, theme, CLI flow, and search integration come along together.

Custom site install:

```bash
npm add @pagesmith/core @pagesmith/site
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

### Vite site (core + site)

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg } from '@pagesmith/site/vite'
import { defineConfig } from 'vite'

const content = defineCollections({
  posts: defineCollection({
    loader: 'markdown',
    directory: 'content/posts',
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
    }),
  }),
})

export default defineConfig({
  plugins: [
    pagesmithContent({ collections: content }),
    pagesmithSsg({ entry: './src/entry-server.tsx' }),
  ],
})
```

### Framework host (content layer only)

```ts
import { createContentLayer, defineConfig } from '@pagesmith/core'
import collections from './content.config'

const layer = createContentLayer(defineConfig({ collections }))
const entry = await layer.getEntry('posts', 'hello-world')
const rendered = await entry?.render()
```

If your app already owns routing and build tooling (for example Next.js), render markdown through `createContentLayer()` and `entry.render()`. Add `@pagesmith/site/css/content` plus `@pagesmith/site/runtime/content` only when you want the shipped prose/code-block presentation layer.

## Packages


| Package                             | Description                                                              | README                                             | AI Reference                                                   |
| ----------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| `[@pagesmith/core](packages/core/)` | Headless content layer, markdown pipeline, schemas, validation, `pagesmithContent` | [packages/core/README.md](packages/core/README.md) | [packages/core/REFERENCE.md](packages/core/REFERENCE.md) |
| `[@pagesmith/site](packages/site/)` | CLI, JSX runtime, CSS/runtime bundles, Vite SSG, shared site helpers | [packages/site/README.md](packages/site/README.md) | [packages/site/REFERENCE.md](packages/site/REFERENCE.md) |
| `[@pagesmith/docs](packages/docs/)` | Convention-based docs preset, theme, search, navigation, schemas | [packages/docs/README.md](packages/docs/README.md) | [packages/docs/REFERENCE.md](packages/docs/REFERENCE.md) |


## Examples


| Example                                        | Description                                                                          | README                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| [blog-site](examples/blog-site/)               | Custom site built on `@pagesmith/core` + `@pagesmith/site` with Pagesmith JSX and Vite SSG | [README](examples/blog-site/README.md) |
| [doc-site](examples/doc-site/)                 | `@pagesmith/docs` with layout overrides via `theme.layouts.*` and docs preset wiring | [README](examples/doc-site/README.md) |
| [with-react](examples/with-react/)             | `@pagesmith/core` + `@pagesmith/site` + React (react-dom/server) | [README](examples/with-react/README.md) |
| [with-solid](examples/with-solid/)             | `@pagesmith/core` + `@pagesmith/site` + SolidJS | [README](examples/with-solid/README.md) |
| [with-svelte](examples/with-svelte/)           | `@pagesmith/core` + `@pagesmith/site` + Svelte 5 | [README](examples/with-svelte/README.md) |
| [with-nextjs](examples/with-nextjs/)           | `@pagesmith/core` content loading/rendering inside Next.js, with optional shared content CSS/runtime from `@pagesmith/site` | [README](examples/with-nextjs/README.md) |
| [with-vanilla-ejs](examples/with-vanilla-ejs/) | `@pagesmith/core` + `@pagesmith/site` + EJS templates | [README](examples/with-vanilla-ejs/README.md) |
| [with-vanilla-hbs](examples/with-vanilla-hbs/) | `@pagesmith/core` + `@pagesmith/site` + Handlebars templates | [README](examples/with-vanilla-hbs/README.md) |


## Framework Support


| Framework  | Pattern                                                    | Example                      |
| ---------- | ---------------------------------------------------------- | ---------------------------- |
| React      | `pagesmithContent` from core + `pagesmithSsg` from site    | `examples/with-react/`       |
| SolidJS    | `pagesmithContent` from core + `pagesmithSsg` from site    | `examples/with-solid/`       |
| Svelte     | `pagesmithContent` from core + `pagesmithSsg` from site    | `examples/with-svelte/`      |
| Next.js    | `createContentLayer` from core + optional `@pagesmith/site/css/content` / `@pagesmith/site/runtime/content` | `examples/with-nextjs/` |
| EJS        | `createContentLayer` from core + `pagesmithSsg` from site  | `examples/with-vanilla-ejs/` |
| Handlebars | `createContentLayer` from core + `pagesmithSsg` from site  | `examples/with-vanilla-hbs/` |
| Docs       | `@pagesmith/docs` preset on the `pagesmith` site CLI       | `examples/doc-site/`         |
| Custom     | `@pagesmith/site` JSX runtime + SSG on top of core content | `examples/blog-site/`        |


## CSS Exports


| Import                           | Contents                           |
| -------------------------------- | ---------------------------------- |
| `@pagesmith/site/css/content`    | Prose typography + inline code     |
| `@pagesmith/site/css/standalone` | Full layout + prose + TOC          |
| `@pagesmith/site/css/viewport`   | Responsive viewport base           |
| `@pagesmith/site/css/fonts`      | Bundled Open Sans + JetBrains Mono |


Code block styling ships in the shared Pagesmith CSS bundles, while syntax token colors and copy/collapse runtime hooks are injected during markdown processing.

## Import Map


| I want to...                   | Import from                      |
| ------------------------------ | -------------------------------- |
| Define collections and schemas | `@pagesmith/core` |
| Use the content Vite plugin | `@pagesmith/core/vite` |
| Use SSG / shared asset Vite helpers | `@pagesmith/site/vite` |
| Write JSX layouts | `@pagesmith/site/jsx-runtime` |
| Add content CSS | `@pagesmith/site/css/content` |
| Add full layout CSS | `@pagesmith/site/css/standalone` |
| Process markdown directly | `@pagesmith/core/markdown` |
| Use built-in loaders | `@pagesmith/core/loaders` |
| Access runtime CSS/JS paths | `@pagesmith/site/runtime` |
| Use shared SSG helpers | `@pagesmith/site/ssg-utils` |
| MCP server (core) | `@pagesmith/core/mcp` |
| MCP server (docs) | `@pagesmith/docs/mcp` |
| Use docs theme exports | `@pagesmith/docs/theme` |


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

> Add documentation to this repo using @pagesmith/docs. Read `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` first and follow it exactly. Use `npx pagesmith-docs init --yes --ai` when it fits the repo, keep `pagesmith.config.json5` at the root, preserve useful existing docs content, and update the project memory files to point at the installed package guidance.

### Set up core via an AI assistant

> Add content collections to this repo using @pagesmith/core. Read `node_modules/@pagesmith/core/ai-guidelines/setup-core.md` first and follow it exactly. Keep the work focused on collections, validation, markdown rendering, and either `pagesmithContent` or direct `createContentLayer()` usage.

### Reference files in npm packages

The packages ship `REFERENCE.md`, agent guidance files, and `llms*.txt` inside the npm package. After installing, link to them from your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For @pagesmith/docs usage and prompts, read node_modules/@pagesmith/docs/ai-guidelines/usage.md
For the full @pagesmith/docs reference, see node_modules/@pagesmith/docs/REFERENCE.md
For @pagesmith/site usage and prompts, read node_modules/@pagesmith/site/ai-guidelines/usage.md
For the full @pagesmith/site reference, see node_modules/@pagesmith/site/REFERENCE.md
For @pagesmith/core usage and prompts, read node_modules/@pagesmith/core/ai-guidelines/usage.md
For the full @pagesmith/core API reference, see node_modules/@pagesmith/core/REFERENCE.md
```

Or copy the AGENTS.md template from the package:
- `node_modules/@pagesmith/docs/ai-guidelines/AGENTS.md.template`
- `node_modules/@pagesmith/site/ai-guidelines/AGENTS.md.template`
- `node_modules/@pagesmith/core/ai-guidelines/AGENTS.md.template`

### AI guidance files in each package

Both packages ship these files under `node_modules/@pagesmith/<pkg>/`:

| File | Purpose |
|---|---|
| `REFERENCE.md` | Complete reference (config, API, markdown, layouts, deployment) |
| `README.md` | User-facing quick start and API overview |
| `ai-guidelines/usage.md` | Agent rules, integration shape, copy-paste prompts for common workflows |
| `ai-guidelines/recipes.md` | Step-by-step recipes for common tasks |
| `ai-guidelines/errors.md` | Error catalog with patterns and fixes |
| `ai-guidelines/migration.md` | Pre-1.0 upgrade notes |
| `ai-guidelines/changelog-notes.md` | Version highlights |
| `ai-guidelines/AGENTS.md.template` | Template for project-level AGENTS.md |
| `ai-guidelines/llms.txt` | Compact AI context index |
| `ai-guidelines/llms-full.txt` | Full AI context with all file pointers |


## Docs

The repo uses both packages in different ways:

- `[docs/](docs/)` uses `@pagesmith/docs` with the default docs configuration
- `[examples/doc-site/](examples/doc-site/)` shows layout overrides through `theme.layouts.*` in `pagesmith.config.json5`
- `[examples/blog-site/](examples/blog-site/)` is a custom site built on `@pagesmith/core` with its own layouts and a Vite-powered asset build
- The framework examples in `[examples/](examples/)` use `@pagesmith/core` with React, Solid, Svelte, Next.js, EJS, and Handlebars rendering flows

## Repo Development

Use Vite+ commands in this repo:

```bash
vp install
vp check
vp test
vp run build
```

Pagesmith uses the Vite+ toolchain here, so prefer `vp` and its built-in OXC-based tooling over direct `npm`, `eslint`, or `prettier` workflows.