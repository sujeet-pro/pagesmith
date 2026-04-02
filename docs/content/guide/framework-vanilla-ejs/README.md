---
title: Vanilla EJS with Pagesmith
description: Build a content-driven static site using EJS templates and Pagesmith's content layer API.
---

# Vanilla EJS with Pagesmith

## Overview

This pattern uses `@pagesmith/core` with plain EJS templates instead of a component framework. The entry server creates a Pagesmith content layer via `createContentLayer`, renders markdown entries to HTML, and passes that HTML into EJS templates for the final page shell. The result is a fully static site with sidebar navigation, table-of-contents, Pagefind search, and multiple content collections -- all without shipping a framework runtime to the browser.

Unlike the React, Solid, and Svelte examples that use virtual content modules (`virtual:content/*`), the vanilla examples use the programmatic `createContentLayer` API directly.

Source: [`examples/with-vanilla-ejs/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-vanilla-ejs) | Output: <a href="/pagesmith/examples/vanilla-ejs/" target="_blank" rel="noopener noreferrer">Live Demo</a>

## Prerequisites

- Node.js 20+
- [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) (the `vp` CLI)

> [!NOTE]
> `vp` is the `vite-plus` CLI, a thin wrapper around Vite for monorepo workflows. For standalone projects, standard `vite` / `npx vite` commands work identically -- just replace `vp dev` with `vite dev`, `vp build` with `vite build`, etc.

## Project Setup

### package.json

```json
{
  "name": "example-with-vanilla-ejs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check"
  },
  "dependencies": {
    "@pagesmith/core": "*",
    "ejs": "^3.1.10",
    "pagefind": "^1.3.0"
  },
  "devDependencies": {
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
with-vanilla-ejs/
  content/
    blog/           # Blog posts (markdown with frontmatter)
    guide/          # Guide articles (markdown, supports series grouping)
    pages/          # Standalone pages like About
  src/
    entry-server.tsx    # SSR entry: content loading + EJS rendering
    theme.css           # Full site stylesheet
  templates/
    layout.ejs      # Outer HTML shell (head, header, sidebar, footer)
    index.ejs       # Home page body
    article.ejs     # Guide/blog article body
    about.ejs       # About page body
  content.config.mjs  # Collection definitions with Zod schemas
  vite.config.ts      # Vite + pagesmithSsg plugin config
  index.html          # Minimal HTML entry point
  client.js           # Client-side script entry
```

### content.config.mjs

Collections are defined in `.mjs` (not `.ts`) since the vanilla examples use `createContentLayer` directly rather than the `pagesmithContent` Vite plugin:

```js
import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const guide = defineCollection({
  loader: 'markdown',
  directory: './content/guide',
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
  directory: './content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export const pages = defineCollection({
  loader: 'markdown',
  directory: './content/pages',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export default defineCollections({ guide, blog, pages })
```

### vite.config.ts

The vanilla EJS example uses only `pagesmithSsg` (no `pagesmithContent` since it uses `createContentLayer` directly):

```ts
import { defineConfig } from 'vite-plus'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/my-site/',
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: '@pagesmith/core',
    },
  },
})
```

- **`sharedAssetsPlugin()`** copies shared assets (bundled web fonts, `fonts.css`) from `@pagesmith/core`.
- **`pagesmithSsg({ entry, contentDirs })`** handles SSG, dev middleware, and Pagefind indexing.
- **`oxc.jsx`** uses `@pagesmith/core` as the JSX import source. This is configured but the EJS example primarily uses template strings rather than JSX for rendering.

### index.html

Minimal -- it only loads the client-side script:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Pagesmith + EJS</title>
  </head>
  <body>
    <script type="module" src="/client.js"></script>
  </body>
</html>
```

## Content Structure

```text
content/
  guide/
    installation.md
    collections.md
    rendering.md
  blog/
    building-with-pagesmith.md
    content-modeling.md
  pages/
    about.md
```

## Entry Server

The entry server (`src/entry-server.tsx`) ties together the content layer and EJS templates.

### Creating the Content Layer

The content layer is created once and reused across renders using `createContentLayer`:

```ts
import { createContentLayer } from '@pagesmith/core'
import ejs from 'ejs'
import { readFileSync } from 'fs'
import { join } from 'path'
import contentConfig from '../content.config.mjs'
import type { SsgRenderConfig } from '@pagesmith/core/vite'

const { guide, blog, pages } = contentConfig

let layer: ReturnType<typeof createContentLayer>
let layerRoot: string
function getLayer(root: string) {
  if (!layer || layerRoot !== root) {
    layerRoot = root
    layer = createContentLayer({ collections: { guide, blog, pages }, root })
  }
  return layer
}
```

### Loading and Sorting Content

All collections are loaded, rendered, and sorted. Guide entries sort by series order then date; blog entries sort by date descending:

```ts
async function loadContent(root: string) {
  const l = getLayer(root)
  const allGuide = await l.getCollection('guide')
  const allBlog = await l.getCollection('blog')
  const allPages = await l.getCollection('pages')

  async function renderAll(entries: any[]): Promise<RenderedEntry[]> {
    const results: RenderedEntry[] = []
    for (const entry of entries) {
      const rendered = await entry.render()
      results.push({ entry, ...rendered })
    }
    return results
  }

  const renderedGuide = await renderAll(allGuide)
  const sortedGuide = [...renderedGuide].sort((a, b) => {
    const so = (a.entry.data.seriesOrder ?? 99) - (b.entry.data.seriesOrder ?? 99)
    if (so !== 0) return so
    return a.entry.data.date.getTime() - b.entry.data.date.getTime()
  })

  const sortedBlog = [...renderedBlog].sort(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime(),
  )

  return { sortedGuide, sortedBlog, renderedPages }
}
```

### Route Generation

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { sortedGuide, sortedBlog, renderedPages } = await loadContent(config.root)
  const routes = ['/']
  for (const item of sortedGuide) routes.push(`/guide/${item.entry.slug}`)
  for (const item of sortedBlog) routes.push(`/blog/${item.entry.slug}`)
  if (renderedPages.find((p) => p.entry.slug === 'about')) routes.push('/about')
  return routes
}
```

### Rendering with EJS

Templates are loaded from disk and rendered with `ejs.render()`. A layout wrapper composes the outer HTML shell:

```ts
function loadTemplate(root: string, name: string) {
  return readFileSync(join(root, 'templates', `${name}.ejs`), 'utf-8')
}

function renderWithLayout(root: string, body: string, vars: Record<string, any>) {
  const layout = loadTemplate(root, 'layout')
  return ejs.render(layout, { ...vars, body })
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  const { sortedGuide, sortedBlog, renderedPages } = await loadContent(config.root)

  // Match URL to guide, blog, about, or home
  const articleTemplate = loadTemplate(config.root, 'article')
  const body = ejs.render(articleTemplate, {
    title: item.entry.data.title,
    content: item.html,
    headings: item.headings,
    date: item.entry.data.date,
    readTime: item.readTime,
    formatDate,
  })
  return renderWithLayout(config.root, body, {
    title: item.entry.data.title,
    basePath,
    css,
    sidebar: sidebarData,
    aside: renderTocAside(item.headings),
    isHome: false,
  })
}
```

## Templates

### Layout Template (layout.ejs)

The outer HTML shell shared by all pages. Key patterns:

- CSS is referenced via the `sharedAssetsPlugin` fonts path and the bundled theme CSS
- Sidebar content is defined as a reusable block for both desktop and mobile navigation
- The layout conditionally renders either a home layout or a three-column doc layout
- Pagefind search integration with a dialog and keyboard shortcut

### Article Template (article.ejs)

Renders guide and blog entries:

```ejs
<article>
  <% if (headings && headings.length > 0) { %>
    <% const tocItems = headings.filter(h => h.depth >= 2 && h.depth <= 3) %>
    <% if (tocItems.length > 0) { %>
      <details class="doc-toc-mobile">
        <summary>On this page</summary>
        <nav class="doc-toc">
          <ul class="doc-toc-list">
            <% for (const h of tocItems) { %>
              <li class="doc-toc-item depth-<%= h.depth %>">
                <a href="#<%= h.slug %>"><%= h.text %></a>
              </li>
            <% } %>
          </ul>
        </nav>
      </details>
    <% } %>
  <% } %>

  <% if (date) { %>
    <p class="doc-page-meta">
      <time><%= formatDate(date) %></time>
      <% if (readTime) { %> &middot; <%= readTime %> min read <% } %>
    </p>
  <% } %>

  <div class="prose"><%- content %></div>
</article>
```

Note the `<%-` syntax for unescaped output (rendered markdown HTML) vs `<%=` for escaped output.

### Index Template (index.ejs)

Renders the home page with a hero section, recent blog posts, and guide entries.

## CSS and Styling

The EJS example reads `src/theme.css` at build time and inlines it into the layout template. The theme CSS can import from `@pagesmith/core`:

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

The `sharedAssetsPlugin()` copies font files and `fonts.css` into the build output. Reference it in the layout template with `<link rel="stylesheet" href="${basePath}assets/fonts.css" />`.

The client entry imports the theme for Vite's CSS extraction:

```js
// client.js
import './src/theme.css'
```

## Pagefind Search

Pagefind runs automatically after the production build. Add `data-pagefind-body` to content areas in your layout template:

```ejs
<main class="doc-main" data-pagefind-body>
  <%- body %>
</main>
```

Conditionally include Pagefind assets in the layout head and add a search modal dialog. Initialize `PagefindUI` from runtime JavaScript.

## Development and Building

```bash
# Start the dev server with hot reload
vp dev

# Build the static site (runs SSG + Pagefind indexing)
vp build

# Type-check the project
vp check
```

During development, the `pagesmithSsg` plugin watches the `content/` directory and re-renders pages when markdown files change.

## Key Concepts

- **`createContentLayer`** is the programmatic API for loading content -- no virtual modules needed.
- **`entry.render()`** processes markdown through the pipeline and returns `{ html, headings, readTime }`.
- **`getCollection(name)`** returns all entries in a collection, validated against the Zod schema.
- **EJS templates** use `<%-` for unescaped HTML output and `<%=` for escaped text.
- **No `pagesmithContent` plugin** -- content is loaded at render time via the content layer API.
- **`pagesmithSsg`** still handles SSG, dev middleware, and Pagefind indexing.
- **Zero framework runtime** -- the site ships no JavaScript framework to the browser.
- **CSS imports** from `@pagesmith/core` provide the design system, or you can write your own.
