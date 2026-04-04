# Pagesmith

Pagesmith is a filesystem-first content toolkit organized as a multi-package workspace under the `@pagesmith/` npm scope. Everything is Vite-native.

Two main user-facing packages:

- `@pagesmith/core` for the shared content layer: collections, loaders, markdown (Expressive Code syntax highlighting), validation, JSX/runtime utilities, and Vite plugins (`pagesmithContent`, `pagesmithSsg`) exposed from `@pagesmith/core/vite`
- `@pagesmith/docs` for convention-based documentation on top of core: default layouts, navigation from `content/`, bundled Pagefind search, and the `pagesmith` docs CLI for `dev`, `build`, and `preview`

Use `@pagesmith/docs` when you want a batteries-included docs site from `pagesmith.config.json5`. Use `@pagesmith/core` when you want a custom site, a framework integration (React, Solid, Svelte, EJS, Handlebars), or full control over layouts and rendering.

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

## Quick Start

### Docs site (interactive setup)

```bash
npm add @pagesmith/docs
npx pagesmith init
```

The interactive init prompts for project name, title, base path, content directory, search, and AI integrations — with smart defaults detected from your git remote and `package.json`. Press Enter to accept defaults or type a new value. Use `-y` to skip prompts.

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

| Package | Description | README |
|---|---|---|
| [`@pagesmith/core`](packages/core/) | Content layer, markdown pipeline, JSX runtime, CSS builder, Vite plugins | [packages/core/README.md](packages/core/README.md) |
| [`@pagesmith/docs`](packages/docs/) | Convention-based docs site with theme, search, navigation, CLI | [packages/docs/README.md](packages/docs/README.md) |

## Examples

| Example | Description | README |
|---|---|---|
| [blog-site](examples/blog-site/) | Custom site built on `@pagesmith/core` with own layouts and Vite-powered asset build | [README](examples/blog-site/README.md) |
| [doc-site](examples/doc-site/) | `@pagesmith/docs` with layout overrides via `theme.layouts.*` | [README](examples/doc-site/README.md) |
| [shared-content](examples/shared-content/) | Content layer example with shared collections | [README](examples/shared-content/README.md) |
| [with-react](examples/with-react/) | `@pagesmith/core` + React (react-dom/server) | [README](examples/with-react/README.md) |
| [with-solid](examples/with-solid/) | `@pagesmith/core` + SolidJS | [README](examples/with-solid/README.md) |
| [with-svelte](examples/with-svelte/) | `@pagesmith/core` + Svelte 5 | [README](examples/with-svelte/README.md) |
| [with-vanilla-ejs](examples/with-vanilla-ejs/) | `@pagesmith/core` + EJS templates | [README](examples/with-vanilla-ejs/README.md) |
| [with-vanilla-hbs](examples/with-vanilla-hbs/) | `@pagesmith/core` + Handlebars templates | [README](examples/with-vanilla-hbs/README.md) |

## Framework Support

| Framework | Pattern | Example |
|---|---|---|
| React | `pagesmithContent` + `pagesmithSsg` | `examples/with-react/` |
| SolidJS | `pagesmithContent` + `pagesmithSsg` | `examples/with-solid/` |
| Svelte | `pagesmithContent` + `pagesmithSsg` | `examples/with-svelte/` |
| EJS | `createContentLayer` + `pagesmithSsg` | `examples/with-vanilla-ejs/` |
| Handlebars | `createContentLayer` + `pagesmithSsg` | `examples/with-vanilla-hbs/` |
| Docs | `@pagesmith/docs` CLI | `examples/doc-site/` |
| Custom | `@pagesmith/core` JSX runtime | `examples/blog-site/` |

## CSS Exports

| Import | Contents |
|---|---|
| `@pagesmith/core/css/content` | Prose typography + inline code |
| `@pagesmith/core/css/standalone` | Full layout + prose + TOC |
| `@pagesmith/core/css/viewport` | Responsive viewport base |
| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |

Code block styling is handled by Expressive Code through inline styles injected during markdown processing.

## AI-Assisted Setup

Use an AI coding assistant (Claude, Codex, Gemini) to configure Pagesmith on your project. Point the assistant at one of the setup guides and it will install the package, create configuration files, set up content structure, add markdown guidelines, and update your CLAUDE.md/AGENTS.md.

### Set up docs with the CLI

After installing `@pagesmith/docs`, run the interactive init to scaffold config, content, and optionally AI integrations:

```bash
npm add @pagesmith/docs
npx pagesmith init
```

The interactive init prompts for project name, title, base path, content directory, search, and AI integrations. Use `--ai` or `-y` to skip prompts:

```bash
npx pagesmith init --ai -y
```

### Set up docs via an AI assistant

Point your AI assistant at the guidelines:

> Add documentation to this repo using @pagesmith/docs. Follow the guidelines at `ai-guidelines/docs-guidelines.md` — install the package, run `npx pagesmith init`, set up the `content/` directory structure with a home page and initial guide section based on the project's README, add markdown guidelines, and update CLAUDE.md with the project's docs structure.

### Set up core via an AI assistant

> Add content collections to this repo using @pagesmith/core. Follow the guidelines at `ai-guidelines/core-guidelines.md` — install the package, create `content.config.ts`, configure Vite, add markdown guidelines, and update CLAUDE.md.

### Reference files in npm packages

Both packages ship a `REFERENCE.md` file that AI assistants can read for the complete API and configuration reference. Link to it from your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
For @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
```

### Generate AI artifacts programmatically

Use the installer API to generate assistant context files, markdown guidelines, and the `/update-docs` Claude skill:

```ts
import { installAiArtifacts } from '@pagesmith/core/ai'

installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  profile: 'docs', // or 'default' for core-only projects
})
```

This installs:

- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` with Pagesmith context (references REFERENCE.md)
- `.pagesmith/markdown-guidelines.md` with authoring rules for content
- `.claude/skills/update-docs/SKILL.md` — an `/update-docs` skill that reads the implementation and updates docs content
- `.claude/skills/pagesmith/SKILL.md` — a `/pagesmith` skill for Pagesmith-specific help
- `llms.txt` and `llms-full.txt` (cover both core and docs packages)

Or via the init command:

```bash
npx pagesmith init --ai
```

### AI guidelines

Detailed guidelines for AI assistants working with this project:

| Guide | Description |
|---|---|
| [core-guidelines.md](ai-guidelines/core-guidelines.md) | Complete guide for `@pagesmith/core` — setup, usage, API, configuration |
| [docs-guidelines.md](ai-guidelines/docs-guidelines.md) | Complete guide for `@pagesmith/docs` — setup, usage, configuration, content structure |
| [markdown-guidelines.md](ai-guidelines/markdown-guidelines.md) | Full markdown feature reference and authoring rules |

## Assistant Artifacts

Pagesmith exposes programmatic helpers for generating checked-in assistant context such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `llms.txt`, and `llms-full.txt`:

```ts
import { installAiArtifacts } from '@pagesmith/core/ai'

installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
})
```

## Docs

The repo uses both packages in different ways:

- [`docs/`](docs/) uses `@pagesmith/docs` with the default docs configuration
- [`examples/doc-site/`](examples/doc-site/) shows layout overrides through `theme.layouts.*` in `pagesmith.config.json5`
- [`examples/blog-site/`](examples/blog-site/) is a custom site built on `@pagesmith/core` with its own layouts and a Vite-powered asset build
- The framework examples in [`examples/`](examples/) use `@pagesmith/core` with React, Solid, Svelte, EJS, and Handlebars rendering flows

## Repo Development

Use Vite+ commands in this repo:

```bash
vp install
vp check
vp test
vp run build
```

Pagesmith uses the Vite+ toolchain here, so prefer `vp` and its built-in OXC-based tooling over direct `npm`, `eslint`, or `prettier` workflows.
