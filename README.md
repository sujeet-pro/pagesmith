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

Docs site with defaults:

```json5
{
  name: 'Acme Docs',
  title: 'Acme Docs',
  description: 'Team documentation',
  contentDir: './content',
  basePath: '/',
  search: { enabled: true },
}
```

Custom site or framework integration with core:

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
