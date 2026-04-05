# Pagesmith

Pagesmith is a filesystem-first content toolkit organized as a multi-package workspace under the `@pagesmith/` npm scope. Everything is Vite-native.

Two main user-facing packages:

- `@pagesmith/core` for the shared content layer: collections, loaders, markdown (Expressive Code syntax highlighting), validation, JSX/runtime utilities, and Vite plugins (`pagesmithContent`, `pagesmithSsg`) exposed from `@pagesmith/core/vite`
- `@pagesmith/docs` for convention-based documentation on top of core: default layouts, navigation from `content/`, bundled Pagefind search, and the `pagesmith` docs CLI for `dev`, `build`, and `preview`

Use `@pagesmith/docs` when you want a batteries-included docs site from `pagesmith.config.json5`. Use `@pagesmith/core` when you want a custom site, a framework integration (React, Solid, Svelte, EJS, Handlebars), or full control over layouts and rendering.

## 1.0 Architecture Principles

- Filesystem-first content and assets
- Strict `@pagesmith/core` vs `@pagesmith/docs` boundaries
- Validation before rendering
- Vite-native toolchain and plugins
- Static-first output with progressive enhancement

See `docs/content/reference/architecture/README.md` for the full architecture and rationale.

## Install

Docs-first install:

```bash
npm add @pagesmith/docs
```

That is enough for the basic docs flow. `@pagesmith/docs` bundles its own search integration, theme assets, and build pipeline so users do not need to add Pagefind or a separate layout package for the default experience.

Core/Vite install:

```bash
npm add @pagesmith/core
```

## Pre-1.0 Migration

Pagesmith is pre-1.0 and minor releases may include breaking changes while APIs are being finalized.

Use `MIGRATING.md` for the current upgrade checklist and import-path/script migration guidance.

## Quick Start

### Docs site (interactive setup)

```bash
npm add @pagesmith/docs
npx pagesmith init
```

The interactive init prompts for project name, title, base path, content directory, search, and AI integrations — with smart defaults detected from your git remote and `package.json`. Press Enter to accept defaults or type a new value. Use `-y` to skip prompts.

### AI-first docs setup (recommended)

```bash
npx pagesmith init --ai
```

This installs assistant memory files, skills/commands, markdown guidelines, and `llms*.txt` context files so agents can set up docs and keep them in sync with implementation.

Then start the dev server:

```bash
npx pagesmith dev
```

### Custom site (framework integration with core)

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'
import { pagesmithContent, pagesmithSsg } from '@pagesmith/core/vite'
import { defineConfig } from 'vite-plus'

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

## Packages


| Package                             | Description                                                              | README                                             | AI Reference                                                   |
| ----------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| `[@pagesmith/core](packages/core/)` | Content layer, markdown pipeline, JSX runtime, CSS builder, Vite plugins | [packages/core/README.md](packages/core/README.md) | [packages/core/REFERENCE.md](packages/core/REFERENCE.md)       |
| `[@pagesmith/docs](packages/docs/)` | Convention-based docs site with theme, search, navigation, CLI           | [packages/docs/README.md](packages/docs/README.md) | [packages/docs/REFERENCE.md](packages/docs/REFERENCE.md)       |


## Examples


| Example                                        | Description                                                                          | README                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| [blog-site](examples/blog-site/)               | Custom site built on `@pagesmith/core` with own layouts and Vite-powered asset build | [README](examples/blog-site/README.md)        |
| [doc-site](examples/doc-site/)                 | `@pagesmith/docs` with layout overrides via `theme.layouts.*`                        | [README](examples/doc-site/README.md)         |
| [with-react](examples/with-react/)             | `@pagesmith/core` + React (react-dom/server)                                         | [README](examples/with-react/README.md)       |
| [with-solid](examples/with-solid/)             | `@pagesmith/core` + SolidJS                                                          | [README](examples/with-solid/README.md)       |
| [with-svelte](examples/with-svelte/)           | `@pagesmith/core` + Svelte 5                                                         | [README](examples/with-svelte/README.md)      |
| [with-vanilla-ejs](examples/with-vanilla-ejs/) | `@pagesmith/core` + EJS templates                                                    | [README](examples/with-vanilla-ejs/README.md) |
| [with-vanilla-hbs](examples/with-vanilla-hbs/) | `@pagesmith/core` + Handlebars templates                                             | [README](examples/with-vanilla-hbs/README.md) |


## Framework Support


| Framework  | Pattern                               | Example                      |
| ---------- | ------------------------------------- | ---------------------------- |
| React      | `pagesmithContent` + `pagesmithSsg`   | `examples/with-react/`       |
| SolidJS    | `pagesmithContent` + `pagesmithSsg`   | `examples/with-solid/`       |
| Svelte     | `pagesmithContent` + `pagesmithSsg`   | `examples/with-svelte/`      |
| EJS        | `createContentLayer` + `pagesmithSsg` | `examples/with-vanilla-ejs/` |
| Handlebars | `createContentLayer` + `pagesmithSsg` | `examples/with-vanilla-hbs/` |
| Docs       | `@pagesmith/docs` CLI                 | `examples/doc-site/`         |
| Custom     | `@pagesmith/core` JSX runtime         | `examples/blog-site/`        |


## CSS Exports


| Import                           | Contents                           |
| -------------------------------- | ---------------------------------- |
| `@pagesmith/core/css/content`    | Prose typography + inline code     |
| `@pagesmith/core/css/standalone` | Full layout + prose + TOC          |
| `@pagesmith/core/css/viewport`   | Responsive viewport base           |
| `@pagesmith/core/css/fonts`      | Bundled Open Sans + JetBrains Mono |


Code block styling is handled by Expressive Code through inline styles injected during markdown processing.

## Import Map


| I want to...                   | Import from                      |
| ------------------------------ | -------------------------------- |
| Define collections and schemas | `@pagesmith/core`                |
| Use Vite plugins               | `@pagesmith/core/vite`           |
| Write JSX layouts              | `@pagesmith/core/jsx-runtime`    |
| Add content CSS                | `@pagesmith/core/css/content`    |
| Add full layout CSS            | `@pagesmith/core/css/standalone` |
| Process markdown directly      | `@pagesmith/core/markdown`       |
| Use built-in loaders           | `@pagesmith/core/loaders`        |
| Access runtime CSS/JS paths    | `@pagesmith/core/runtime`        |
| Use shared SSG helpers         | `@pagesmith/core/ssg-utils`      |
| MCP server (core)              | `@pagesmith/core/mcp`            |
| MCP server (docs)              | `@pagesmith/docs/mcp`            |
| Use docs theme exports         | `@pagesmith/docs/theme`          |


## AI-Assisted Setup

The primary way to set up AI integrations is through the CLI:

```bash
npx pagesmith init --ai
```

This generates:

- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` with Pagesmith context (references package usage + reference files)
- `.pagesmith/markdown-guidelines.md` with authoring rules for content
- `.claude/skills/update-docs/SKILL.md` — an `/update-docs` skill that reads the implementation and updates docs content
- `.claude/skills/ps-update-all-docs/SKILL.md` — a `/ps-update-all-docs` skill for full-repo docs regeneration, navigation checks, and skill alignment
- `.claude/skills/pagesmith/SKILL.md` — a `/pagesmith` skill for Pagesmith-specific help
- `llms.txt` and `llms-full.txt` (cover both core and docs packages)

### Set up docs via an AI assistant

Point your AI assistant at the package-shipped usage guide:

> Add documentation to this repo using @pagesmith/docs. Follow `node_modules/@pagesmith/docs/docs/agents/usage.md` — install the package, run `npx pagesmith init`, set up the `content/` directory structure with a home page and initial guide section based on the project's README, add markdown guidelines, and update CLAUDE.md with the project's docs structure.

### Set up core via an AI assistant

> Add content collections to this repo using @pagesmith/core. Follow `node_modules/@pagesmith/core/docs/agents/usage.md` — install the package, create `content.config.ts`, configure Vite, add markdown guidelines, and update CLAUDE.md.

### Reference files in npm packages

Both packages ship `REFERENCE.md`, agent guidance files, and `llms*.txt` inside the npm package. After installing, link to them from your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For @pagesmith/docs usage and prompts, read node_modules/@pagesmith/docs/docs/agents/usage.md
For the full @pagesmith/docs reference, see node_modules/@pagesmith/docs/REFERENCE.md
For @pagesmith/core usage and prompts, read node_modules/@pagesmith/core/docs/agents/usage.md
For the full @pagesmith/core API reference, see node_modules/@pagesmith/core/REFERENCE.md
```

Or copy the AGENTS.md template from the package:
- `node_modules/@pagesmith/docs/docs/agents/AGENTS.md.template`
- `node_modules/@pagesmith/core/docs/agents/AGENTS.md.template`

### AI guidance files in each package

Both packages ship these files under `node_modules/@pagesmith/<pkg>/`:

| File | Purpose |
|---|---|
| `REFERENCE.md` | Complete reference (config, API, markdown, layouts, deployment) |
| `README.md` | User-facing quick start and API overview |
| `docs/agents/usage.md` | Agent rules, integration shape, copy-paste prompts for common workflows |
| `docs/agents/recipes.md` | Step-by-step recipes for common tasks |
| `docs/agents/errors.md` | Error catalog with patterns and fixes |
| `docs/agents/migration.md` | Pre-1.0 upgrade notes |
| `docs/agents/changelog-notes.md` | Version highlights |
| `docs/agents/AGENTS.md.template` | Template for project-level AGENTS.md |
| `docs/llms.txt` | Compact AI context index |
| `docs/llms-full.txt` | Full AI context with all file pointers |


## Docs

The repo uses both packages in different ways:

- `[docs/](docs/)` uses `@pagesmith/docs` with the default docs configuration
- `[examples/doc-site/](examples/doc-site/)` shows layout overrides through `theme.layouts.*` in `pagesmith.config.json5`
- `[examples/blog-site/](examples/blog-site/)` is a custom site built on `@pagesmith/core` with its own layouts and a Vite-powered asset build
- The framework examples in `[examples/](examples/)` use `@pagesmith/core` with React, Solid, Svelte, EJS, and Handlebars rendering flows

## Repo Development

Use Vite+ commands in this repo:

```bash
vp install
vp check
vp test
vp run build
```

Pagesmith uses the Vite+ toolchain here, so prefer `vp` and its built-in OXC-based tooling over direct `npm`, `eslint`, or `prettier` workflows.