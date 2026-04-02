---
title: Framework Integrations
description: Overview of the Pagesmith framework integration matrix and how each pattern fits together.
---

# Framework Integrations

Pagesmith's content layer is framework-agnostic. Define collections once in `content.config.ts`, then consume entries through virtual imports or the programmatic content-layer API in any rendering stack.

## Two Approaches

### Virtual Content Modules (pagesmithContent)

Used by the **React**, **Solid**, and **Svelte** integrations. You define collections in `content.config.ts` and the `pagesmithContent` Vite plugin exposes them as `virtual:content/*` modules with pre-rendered HTML:

```ts
import blogCollection from 'virtual:content/blog'
```

### Programmatic Content Layer (createContentLayer)

Used by the **EJS**, **Handlebars**, and **Blog Site** integrations. You create a content layer directly and call `getCollection()` / `entry.render()` at render time:

```ts
const layer = createContentLayer({ collections: { guide, blog, pages }, root })
const entries = await layer.getCollection('guide')
const rendered = await entries[0].render()
```

### Convention-Based (@pagesmith/docs)

Used by the **Doc Site** integration. You write markdown in a `content/` tree and configure the site in `pagesmith.config.json5`. No Vite config or entry server needed.

## Example Matrix

The repo includes a full example matrix. Each example is self-contained with its own `package.json`, content, styles, and build configuration.

| Example | Package | Renderer | Content Access | Demo |
|---|---|---|---|---|
| [React](/guide/framework-react) | `@pagesmith/core` | `react-dom/server` | `virtual:content/*` | <a href="/pagesmith/examples/react/" target="_blank" rel="noopener noreferrer">Live</a> |
| [Solid](/guide/framework-solid) | `@pagesmith/core` | `solid-js/web` | `virtual:content/*` | <a href="/pagesmith/examples/solid/" target="_blank" rel="noopener noreferrer">Live</a> |
| [Svelte](/guide/framework-svelte) | `@pagesmith/core` | `svelte/server` | `virtual:content/*` | <a href="/pagesmith/examples/svelte/" target="_blank" rel="noopener noreferrer">Live</a> |
| [Vanilla + EJS](/guide/framework-vanilla-ejs) | `@pagesmith/core` | EJS templates | `createContentLayer` | <a href="/pagesmith/examples/vanilla-ejs/" target="_blank" rel="noopener noreferrer">Live</a> |
| [Vanilla + Handlebars](/guide/framework-vanilla-hbs) | `@pagesmith/core` | Handlebars templates | `createContentLayer` | <a href="/pagesmith/examples/vanilla-hbs/" target="_blank" rel="noopener noreferrer">Live</a> |
| [Doc Site](/guide/framework-doc-site) | `@pagesmith/docs` | Docs theme | Convention-based | <a href="/pagesmith/examples/doc-site/" target="_blank" rel="noopener noreferrer">Live</a> |
| [Blog Site](/guide/framework-blog-site) | `@pagesmith/core` | Custom JSX layouts | `processMarkdown` | <a href="/pagesmith/examples/blog-site/" target="_blank" rel="noopener noreferrer">Live</a> |

## Shared Vite Plugins

All examples use plugins from `@pagesmith/core/vite`:

| Plugin | Purpose | Used By |
|---|---|---|
| `sharedAssetsPlugin()` | Copies bundled fonts and `fonts.css` into the build output | All examples |
| `pagesmithContent({ collections })` | Loads content and exposes `virtual:content/*` modules | React, Solid, Svelte |
| `pagesmithSsg({ entry, contentDirs })` | SSG: dev middleware, pre-rendering, asset copying, Pagefind indexing | All except Doc Site |

## Shared Behavior

Across the examples, Pagesmith is responsible for the same core jobs:

- Loading content from markdown files
- Validating frontmatter against Zod schemas
- Processing markdown through the unified pipeline (GFM, math, syntax highlighting, heading slugs)
- Copying content companion assets into the final build
- Running Pagefind against the generated site for full-text search

## CSS Imports

All examples can use pre-built CSS from `@pagesmith/core`:

| Import path | Contents |
|---|---|
| `@pagesmith/core/css/standalone` | Full bundle (reset, tokens, prose, code, layout, TOC) |
| `@pagesmith/core/css/content` | Content-only bundle (reset, prose, code, viewport) |
| `@pagesmith/core/css/fonts` | Bundled web fonts (Open Sans, JetBrains Mono) |
| `@pagesmith/core/css/viewport` | Viewport / responsive base only |

## JSX Runtime

Two JSX runtimes are used across the examples:

- **Framework JSX** (React, Solid, Svelte) -- each framework's own JSX transform via their Vite plugin
- **`@pagesmith/core/jsx-runtime`** -- Pagesmith's lightweight server-side JSX runtime, used by the Blog Site and Doc Site layout overrides. Produces HTML strings with `h()` and `Fragment()`. Uses `class` (not `className`) and `innerHTML` (not `dangerouslySetInnerHTML`).

## Choosing a Pattern

| If you want... | Choose... |
|---|---|
| A documentation site that works from configuration alone | [Doc Site](/guide/framework-doc-site) |
| Full layout control with a specific framework (React, Solid, Svelte) | [React](/guide/framework-react), [Solid](/guide/framework-solid), or [Svelte](/guide/framework-svelte) |
| No framework runtime, simple templates | [EJS](/guide/framework-vanilla-ejs) or [Handlebars](/guide/framework-vanilla-hbs) |
| A fully custom site with its own design system | [Blog Site](/guide/framework-blog-site) |

## Read Next

- [React Integration](/guide/framework-react)
- [SolidJS Integration](/guide/framework-solid)
- [Svelte Integration](/guide/framework-svelte)
- [Vanilla EJS](/guide/framework-vanilla-ejs)
- [Vanilla Handlebars](/guide/framework-vanilla-hbs)
- [Doc Site](/guide/framework-doc-site)
- [Blog Site](/guide/framework-blog-site)
