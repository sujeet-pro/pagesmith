---
title: Vanilla Handlebars with Pagesmith
description: Build a content-driven static site using Handlebars templates and Pagesmith's content layer API.
---

# Vanilla Handlebars with Pagesmith

## Overview

This pattern uses `@pagesmith/core` with Handlebars templates instead of a component framework. Like the EJS example, it creates a Pagesmith content layer via `createContentLayer`, renders markdown to HTML, and passes that HTML into Handlebars templates for the final output. Handlebars brings its own conventions -- partials, inline partials, block helpers, and custom helpers -- which map well to content-driven sites. The result is a fully static site with sidebar navigation, table-of-contents, Pagefind search, and multiple content collections.

Source: [`examples/with-vanilla-hbs/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-vanilla-hbs) | Output: <a href="/pagesmith/examples/vanilla-hbs/" target="_blank" rel="noopener noreferrer">Live Demo</a>

## Prerequisites

- Node.js 20+
- [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) (the `vp` CLI)

## Project Setup

### package.json

```json
{
  "name": "example-with-vanilla-hbs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check"
  },
  "dependencies": {
    "@pagesmith/core": "*",
    "handlebars": "^4.7.8",
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
with-vanilla-hbs/
  content/
    blog/           # Blog posts (markdown with frontmatter)
    guide/          # Guide articles (markdown, supports series grouping)
    pages/          # Standalone pages like About
  src/
    entry-server.tsx    # SSR entry: content loading + Handlebars rendering
    theme.css           # Full site stylesheet
  templates/
    layout.hbs      # Outer HTML shell with inline partials for sidebar
    index.hbs       # Home page (uses layout partial)
    article.hbs     # Guide/blog article (uses layout partial)
    about.hbs       # About page (uses layout partial)
  content.config.mjs  # Collection definitions with Zod schemas
  vite.config.ts      # Vite + pagesmithSsg plugin config
  index.html          # Minimal HTML entry point
  client.js           # Client-side script entry
```

### content.config.mjs

Collections are identical to the EJS example:

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

Mirrors the EJS example -- `pagesmithSsg` only, no `pagesmithContent`:

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

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Pagesmith + Handlebars</title>
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
  blog/
    building-with-pagesmith.md
    content-modeling.md
  pages/
    about.md
```

## Entry Server

The entry server (`src/entry-server.tsx`) follows the same `createContentLayer` pattern as the EJS example but uses Handlebars APIs.

### Registering Handlebars Helpers

Custom helpers are registered once at module scope:

```ts
import { createContentLayer } from '@pagesmith/core'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
import contentConfig from '../content.config.mjs'
import type { SsgRenderConfig } from '@pagesmith/core/vite'

const { guide, blog, pages } = contentConfig

Handlebars.registerHelper('formatDate', (value: any) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
Handlebars.registerHelper('eq', (left: any, right: any) => left === right)
Handlebars.registerHelper(
  'startsWith',
  (str: any, prefix: any) => typeof str === 'string' && str.startsWith(prefix),
)
Handlebars.registerHelper('or', function (...args: any[]) {
  args.pop() // Last arg is the Handlebars options object
  return args.some(Boolean)
})
Handlebars.registerHelper('concat', function (...args: any[]) {
  args.pop()
  return args.join('')
})
```

These helpers provide date formatting, equality checks, string prefix matching, boolean OR, and string concatenation -- used within templates for navigation active states and date display.

### Content Layer

Same as the EJS example -- `createContentLayer` is created once and reused:

```ts
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

### Rendering with Handlebars

The layout partial is re-registered on each render call so template changes are picked up during development:

```ts
export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  // Register the layout as a partial
  Handlebars.registerPartial('layout', loadTemplate(root, 'layout'))

  const articleTemplate = Handlebars.compile(loadTemplate(root, 'article'))
  const indexTemplate = Handlebars.compile(loadTemplate(root, 'index'))

  // Home page
  if (routePath === '/') {
    return indexTemplate({ ...shared, title: 'Pagesmith + Handlebars', sortedGuide, sortedBlog })
  }

  // Article pages
  return articleTemplate({
    ...shared,
    title: item.entry.data.title,
    content: item.html,
    headings: item.headings,
    tocHeadings,
    date: item.entry.data.date,
    readTime: item.readTime,
  })
}
```

## Templates

### Layout Template with Inline Partials (layout.hbs)

Handlebars uses inline partials for reusable blocks like the sidebar:

```handlebars
{{!-- Define sidebar as an inline partial --}}
{{#*inline "sidebarContent"}}
  <div class="doc-sidebar-section">
    <span class="doc-sidebar-heading">Guide</span>
    <ul class="doc-sidebar-list">
      {{#each sidebar.guideGroups}}
        <li class="doc-sidebar-item expanded">
          <span class="doc-sidebar-link">{{this.series}}</span>
          <ul class="doc-sidebar-nested">
            {{#each this.items}}
              <li class="doc-sidebar-item{{#if (eq ../../activePath (concat '/guide/' this.slug))}} active{{/if}}">
                <a href="{{../../basePath}}guide/{{this.slug}}/" class="doc-sidebar-link">{{this.title}}</a>
              </li>
            {{/each}}
          </ul>
        </li>
      {{/each}}
    </ul>
  </div>
{{/inline}}
```

Note the use of the `eq` and `concat` helpers for active-state detection, and the `../../` path traversal to access parent context inside nested `{{#each}}` blocks.

### Article Template with Partial Blocks (article.hbs)

Child templates use the `{{#> layout}}` partial block syntax to inject content into the layout:

```handlebars
{{#> layout}}
  {{#*inline "body"}}
    <article>
      {{#if tocHeadings.length}}
        <details class="doc-toc-mobile">
          <summary>On this page</summary>
          <nav class="doc-toc">
            <ul class="doc-toc-list">
              {{#each tocHeadings}}
                <li class="doc-toc-item depth-{{this.depth}}">
                  <a href="#{{this.slug}}">{{this.text}}</a>
                </li>
              {{/each}}
            </ul>
          </nav>
        </details>
      {{/if}}

      {{#if date}}
        <p class="doc-page-meta">
          <time>{{formatDate date}}</time>
          {{#if readTime}} &middot; {{readTime}} min read {{/if}}
        </p>
      {{/if}}

      <div class="prose">{{{content}}}</div>
    </article>
  {{/inline}}
{{/layout}}
```

The triple-brace `{{{content}}}` syntax outputs raw HTML without escaping -- necessary for rendered markdown. Double-brace `{{title}}` escapes by default.

## CSS and Styling

All styles live in `src/theme.css` and can import from `@pagesmith/core`:

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

The `sharedAssetsPlugin()` copies font files and `fonts.css` into the build output. The client entry imports the CSS for Vite's extraction:

```js
// client.js
import './src/theme.css'
```

## Pagefind Search

Pagefind runs automatically after the production build. Add `data-pagefind-body` in your layout template:

```handlebars
<main class="doc-main" data-pagefind-body>
  {{> @partial-block}}
</main>
```

Include Pagefind assets conditionally in the layout head and add a search modal dialog. Initialize `PagefindUI` in runtime JavaScript.

## Development and Building

```bash
# Start the dev server with hot reload
vp dev

# Build the static site (runs SSG + Pagefind indexing)
vp build

# Type-check the project
vp check
```

The layout partial is re-registered on each render call during development so template changes are picked up without restarting the server.

## Key Concepts

- **`createContentLayer`** is the programmatic API for loading content -- no virtual modules needed.
- **`entry.render()`** processes markdown through the pipeline and returns `{ html, headings, readTime }`.
- **Handlebars helpers** (`formatDate`, `eq`, `startsWith`, `or`, `concat`) are registered once and reused across all templates.
- **Partial block syntax** (`{{#> layout}}...{{/layout}}`) composes child content into the layout shell.
- **`{{{triple-braces}}}`** output raw HTML (rendered markdown); `{{double-braces}}` escape by default.
- **Inline partials** (`{{#*inline "name"}}`) define reusable blocks within templates (e.g., sidebar content shared between desktop and mobile).
- **No `pagesmithContent` plugin** -- content is loaded at render time via the content layer API.
- **`pagesmithSsg`** handles SSG, dev middleware, and Pagefind indexing.
- **Zero framework runtime** -- no JavaScript framework shipped to the browser.
