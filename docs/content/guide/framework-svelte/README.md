---
title: Svelte with Pagesmith
description: Build a content-driven static site using Svelte 5 SSR and Pagesmith's Vite content plugin.
---

# Svelte with Pagesmith

## Overview

This pattern uses `@pagesmith/core` as the content layer and Svelte 5 as the component framework to produce a fully static site. You define content collections with validated schemas, write Svelte components for your pages, and Pagesmith's Vite plugins handle markdown processing, virtual content modules, static site generation, and Pagefind search indexing.

Use this when you want full control over page layout and rendering with Svelte components while letting Pagesmith manage content loading, markdown processing, and the build pipeline.

Source: [`examples/with-svelte/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-svelte) | Output: <a href="/pagesmith/examples/svelte/" target="_blank" rel="noopener noreferrer">Live Demo</a>

## Prerequisites

- Node.js 20+
- [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) (the `vp` CLI)

> [!NOTE]
> `vp` is the `vite-plus` CLI, a thin wrapper around Vite for monorepo workflows. For standalone projects, standard `vite` / `npx vite` commands work identically -- just replace `vp dev` with `vite dev`, `vp build` with `vite build`, etc.

## Project Setup

### package.json

```json
{
  "name": "example-with-svelte",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check"
  },
  "dependencies": {
    "@pagesmith/core": "*",
    "pagefind": "^1.3.0",
    "svelte": "^5.55.1"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^7.0.0",
    "typescript": "^5.7.0",
    "vite": "npm:@voidzero-dev/vite-plus-core@^0.1.13",
    "vite-plus": "^0.1.13"
  }
}
```

Install with:

```bash
vp install
```

### Project Structure

```text
with-svelte/
  content/
    blog/             # Blog posts (markdown with frontmatter)
    guide/            # Guide articles (markdown with frontmatter)
    pages/            # Standalone pages (about, etc.)
  public/
    favicon.svg
  src/
    entry-server.ts   # SSG entry: getRoutes() + render()
    site.ts           # Shared data helpers and virtual content imports
    App.svelte        # Root Svelte component
    components/       # Svelte sub-components (header, sidebar, etc.)
    theme.css         # Full site stylesheet
    pagesmith-content.d.ts  # Generated type declarations for virtual modules
  content.config.ts   # Collection definitions with Zod schemas
  client.js           # Client entry point
  index.html          # Vite HTML entry
  svelte.config.js    # Svelte preprocessor configuration
  vite.config.ts      # Vite + Pagesmith plugin configuration
  tsconfig.json
```

### content.config.ts

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const guide = defineCollection({
  loader: 'markdown',
  directory: 'content/guide',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
})

export const blog = defineCollection({
  loader: 'markdown',
  directory: 'content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export const pages = defineCollection({
  loader: 'markdown',
  directory: 'content/pages',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export default defineCollections({ guide, blog, pages })
```

### vite.config.ts

The Svelte integration uses `@sveltejs/vite-plugin-svelte` alongside the Pagesmith plugins:

```ts
import { defineConfig } from 'vite-plus'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import collections from './content.config'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/my-site/',
  plugins: [
    sharedAssetsPlugin(),
    svelte(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.ts', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
```

- **`sharedAssetsPlugin()`** copies shared assets (bundled web fonts, `fonts.css`) from `@pagesmith/core` into the build output.
- **`svelte()`** enables the Svelte compiler and Vite integration. It reads its configuration from `svelte.config.js`.
- **`pagesmithContent({ collections })`** processes your content directories and exposes them as `virtual:content/*` modules.
- **`pagesmithSsg({ entry, contentDirs })`** handles static site generation, Pagefind indexing, and dev-mode middleware.

Note that the SSG entry is `./src/entry-server.ts` (not `.tsx`) since Svelte uses `.svelte` files for components rather than JSX.

### svelte.config.js

A Svelte config is required for preprocessor configuration:

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "vite.config.ts"]
}
```

- There is no `jsx` or `jsxImportSource` setting because Svelte uses `.svelte` files instead of JSX.
- **`verbatimModuleSyntax: true`** is recommended for Svelte 5 to ensure correct import/export erasure.
- The `include` array covers both `.ts` and `.svelte` files.

## Content Structure

```text
content/
  guide/
    installation.md
    collections.md
  blog/
    building-with-pagesmith.md
    content-modeling.md
  pages/
    about.md
```

## Architecture

The Svelte example splits concerns across multiple files:

- **`src/site.ts`** -- shared data module that imports virtual content and exports sorted/typed entry arrays and helper functions
- **`src/App.svelte`** -- root Svelte component that renders different page kinds (home, page, not-found)
- **`src/components/`** -- individual Svelte components (`SiteHeader.svelte`, `SidebarNav.svelte`, `PageBody.svelte`, `HomeBody.svelte`, `NotFoundBody.svelte`)
- **`src/entry-server.ts`** -- SSR entry that orchestrates rendering

### Shared Data Module (src/site.ts)

This module imports virtual content and exports typed, sorted arrays:

```ts
import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'

export type MarkdownEntry = {
  contentSlug: string
  html: string
  headings: Array<{ depth: number; slug: string; text: string }>
  frontmatter: {
    title: string
    description?: string
    date?: string | Date
    tags?: string[]
    series?: string
    seriesOrder?: number
  }
}

export const guideEntries = [...(guideCollection as MarkdownEntry[])].sort((left, right) => {
  const orderDelta = (left.frontmatter.seriesOrder ?? 99) - (right.frontmatter.seriesOrder ?? 99)
  if (orderDelta !== 0) return orderDelta
  return getTime(left.frontmatter.date) - getTime(right.frontmatter.date)
})

export const blogEntries = [...(blogCollection as MarkdownEntry[])].sort(
  (left, right) => getTime(right.frontmatter.date) - getTime(left.frontmatter.date),
)

export const pageEntries = [...(pagesCollection as MarkdownEntry[])]

// Also exports: normalizeRoute, leafSlug, routeFor, toIso,
// escapeHtml, buildNavEntries, groupBySeries, etc.
```

### Svelte Components

Svelte components receive props using Svelte 5 runes and render HTML. Raw markdown HTML is injected with `{@html}`:

```svelte
<script lang="ts">
  let { title, content, headings } = $props()
</script>

<article>
  <h1>{title}</h1>
  <div class="prose">{@html content}</div>
</article>
```

### Root App Component

The `App.svelte` component is the root that switches between page kinds:

```svelte
<script lang="ts">
  import HomeBody from './components/HomeBody.svelte'
  import NotFoundBody from './components/NotFoundBody.svelte'
  import PageBody from './components/PageBody.svelte'
  import SiteHeader from './components/SiteHeader.svelte'

  let {
    pageKind,
    pageTitle,
    pageContent,
    pageHeadings,
    currentPath,
    basePath,
    searchEnabled,
    // ...other props
  }: { pageKind: 'home' | 'page' | 'not-found'; /* ... */ } = $props()
</script>

{#if pageKind === 'home'}
  <HomeBody {basePath} {searchEnabled} ... />
{:else if pageKind === 'not-found'}
  <NotFoundBody {basePath} />
{:else}
  <SiteHeader {basePath} {currentPath} {searchEnabled} ... />
  <PageBody title={pageTitle} content={pageContent} headings={pageHeadings} ... />
{/if}
```

## Entry Server

The `src/entry-server.ts` imports Svelte's `render` function and the root `App` component:

```ts
import { render as renderSvelte } from 'svelte/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import App from './App.svelte'
import {
  guideEntries, blogEntries, pageEntries,
  buildNavEntries, groupBySeries, routeFor, leafSlug,
  normalizeRoute, escapeHtml, toIso, estimateReadTime,
} from './site'
```

### `getRoutes()`

```ts
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...blogEntries.map((entry) => routeFor(entry, 'blog')))

  const aboutPage = pageEntries.find(
    (entry) => leafSlug(entry.contentSlug, 'pages') === 'about'
  )
  if (aboutPage) routes.push(routeFor(aboutPage, 'pages'))

  return routes
}
```

### `render()`

Svelte's `render()` from `svelte/server` returns an object with `body` and `head` strings:

```ts
export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  // Determine page kind and build props based on URL matching
  const rendered = renderSvelte(App, {
    props: {
      pageKind: 'page',
      pageTitle: entry.frontmatter.title,
      pageContent: entry.html,
      pageHeadings: entry.headings,
      currentPath: routePath,
      basePath: config.base,
      searchEnabled: config.searchEnabled,
      // ...other props
    },
  })

  return renderDocument({
    title: `${entry.frontmatter.title} - My Site`,
    headHtml: rendered.head,
    basePath: config.base,
    cssPath: config.cssPath,
    jsPath: config.jsPath,
    searchEnabled: config.searchEnabled,
    bodyHtml: rendered.body,
  })
}
```

The `head` contains any `<svelte:head>` content from your components, and `body` contains the rendered HTML.

### Building the HTML Document

```ts
function renderDocument(props: {
  title: string
  description?: string
  headHtml?: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
}) {
  const { title, headHtml, basePath, cssPath, jsPath, searchEnabled, bodyHtml } = props
  const base = basePath.replace(/\/+$/, '')

  return `<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${base}/assets/fonts.css" />
    <link rel="stylesheet" href="${cssPath}" />
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
    <script>document.documentElement.classList.remove('no-js')</script>
    ${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
    ${headHtml ?? ''}
  </head>
  <body>
    ${bodyHtml}
    ${jsPath ? `<script src="${jsPath}" defer></script>` : ''}
  </body>
</html>`
}
```

## Index HTML and Client Entry

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pagesmith + Svelte</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/client.js"></script>
  </body>
</html>
```

```js
// client.js
import './src/theme.css'
```

## CSS and Styling

Import Pagesmith's pre-built CSS in your theme stylesheet:

```css
/* src/theme.css */
@import '@pagesmith/core/css/standalone';
```

Available CSS imports:

| Import path | Contents |
|---|---|
| `@pagesmith/core/css/standalone` | Full bundle (reset, tokens, prose, code, layout, TOC) |
| `@pagesmith/core/css/content` | Content-only bundle (reset, prose, code, viewport) |
| `@pagesmith/core/css/fonts` | Bundled web fonts (Open Sans, JetBrains Mono) |
| `@pagesmith/core/css/viewport` | Viewport / responsive base only |

The `sharedAssetsPlugin()` copies font files and `fonts.css` into the build output. Reference the fonts stylesheet in your rendered HTML with `<link rel="stylesheet" href="${base}/assets/fonts.css" />`.

## Pagefind Search

Pagefind runs automatically after the production build. Mark searchable content with `data-pagefind-body` in your Svelte components:

```svelte
<main data-pagefind-body>
  <div class="prose">{@html content}</div>
</main>
```

Include Pagefind assets conditionally in the document shell, add a search trigger button and dialog, and initialize `PagefindUI` in runtime JavaScript (same pattern as the React example). Search is disabled during development.

## Development and Building

```bash
# Start the dev server with HMR
vp dev

# Type-check
vp check

# Build for production (SSG + Pagefind)
vp build
```

## Key Concepts

- **`@sveltejs/vite-plugin-svelte`** provides Svelte compilation and SSR support.
- **`render` from `svelte/server`** produces static HTML strings -- returns `{ body, head }`.
- **`{@html content}`** is how you inject raw HTML (rendered markdown) in Svelte templates.
- **Svelte 5 runes** (`$props()`) are used for component props.
- **Separation of concerns**: data logic lives in `src/site.ts`, UI in `.svelte` components, and orchestration in the entry server.
- **Virtual modules** (`virtual:content/<name>`) provide pre-rendered content at build time.
- **`pagesmithSsg`** manages dev middleware, pre-rendering, and Pagefind indexing.
- **CSS imports** from `@pagesmith/core` provide the full design system.
