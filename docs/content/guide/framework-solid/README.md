---
title: SolidJS with Pagesmith
description: Build a content-driven static site using SolidJS SSR and Pagesmith's Vite content plugin.
---

# SolidJS with Pagesmith

## Overview

This pattern uses `@pagesmith/core` as the content layer and SolidJS as the server renderer to produce a fully static site. You define content collections with validated schemas, write Solid components for your pages, and Pagesmith's Vite plugins handle markdown processing, virtual content modules, static site generation, and Pagefind search indexing.

Use this when you want full control over page layout and rendering with Solid's reactive primitives while letting Pagesmith manage content loading, markdown processing, and the build pipeline.

Source: [`examples/with-solid/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-solid) | Output: <a href="/pagesmith/examples/solid/" target="_blank" rel="noopener noreferrer">Live Demo</a>

## Prerequisites

- Node.js 20+
- [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) (the `vp` CLI)

## Project Setup

### package.json

```json
{
  "name": "example-with-solid",
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
    "solid-js": "^1.9.12"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "npm:@voidzero-dev/vite-plus-core@^0.1.13",
    "vite-plugin-solid": "^2.11.11",
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
with-solid/
  content/
    blog/             # Blog posts (markdown with frontmatter)
    guide/            # Guide articles (markdown with frontmatter)
    pages/            # Standalone pages (about, etc.)
  public/
    favicon.svg
  src/
    entry-server.tsx  # SSG entry: getRoutes() + render()
    theme.css         # Full site stylesheet
    pagesmith-content.d.ts  # Generated type declarations for virtual modules
  content.config.ts   # Collection definitions with Zod schemas
  client.js           # Client entry point
  index.html          # Vite HTML entry
  vite.config.ts      # Vite + Pagesmith plugin configuration
  tsconfig.json
```

### content.config.ts

Collections are defined identically to the React example -- `defineCollection` and `defineCollections` from `@pagesmith/core` with Zod schemas:

```ts
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

The Solid integration adds `vite-plugin-solid` with SSR enabled alongside the Pagesmith plugins:

```ts
import { defineConfig } from 'vite-plus'
import collections from './content.config'
import solid from 'vite-plugin-solid'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/my-site/',
  plugins: [
    sharedAssetsPlugin(),
    solid({ ssr: true }),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
```

- **`sharedAssetsPlugin()`** copies shared assets (bundled web fonts, `fonts.css`) from `@pagesmith/core` into the build output.
- **`solid({ ssr: true })`** enables the Solid JSX transform with server-side rendering support. This replaces the `oxc.jsx` configuration used in the React example -- no additional JSX config is needed.
- **`pagesmithContent({ collections })`** processes your content directories and exposes them as `virtual:content/*` modules.
- **`pagesmithSsg({ entry, contentDirs })`** handles static site generation, Pagefind indexing, and dev-mode middleware.

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- **`jsx: "preserve"`** tells TypeScript to leave JSX untransformed; `vite-plugin-solid` handles the actual compilation.
- **`jsxImportSource: "solid-js"`** ensures JSX types come from Solid.

## Content Structure

Content structure is identical across all framework integrations:

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

## Virtual Content Imports

The `pagesmithContent` plugin generates virtual modules for each collection:

```ts
import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'
```

Each entry provides `contentSlug`, `html`, `headings`, and `frontmatter`. Type declarations in `src/pagesmith-content.d.ts` provide full type safety.

## Entry Server

The `src/entry-server.tsx` file uses SolidJS primitives for rendering:

### Imports

```ts
import { For, Show } from 'solid-js'
import { renderToString } from 'solid-js/web'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'
```

### Solid Primitives

Solid components use `For` for list iteration and `Show` for conditional rendering:

```tsx
function BlogList(props: { entries: NavEntry[] }) {
  return (
    <ul>
      <For each={props.entries}>
        {(entry) => (
          <li>
            <a href={entry.url}>{entry.title}</a>
            <Show when={entry.description}>
              <p>{entry.description}</p>
            </Show>
          </li>
        )}
      </For>
    </ul>
  )
}
```

### Rendering with `renderToString`

The key difference from React: Solid uses `renderToString()` from `solid-js/web`, and the render call wraps the component in a function:

```ts
const bodyHtml = renderToString(() => (
  <HomeBody
    basePath={config.base}
    firstGuideUrl={firstGuideUrl}
    firstBlogUrl={firstBlogUrl}
    searchEnabled={config.searchEnabled}
    guideEntries={guideNavEntries}
    blogEntries={blogNavEntries}
  />
))
```

### Injecting Raw HTML

Solid uses `innerHTML` (not `dangerouslySetInnerHTML`) to inject rendered markdown:

```tsx
<div class="prose" innerHTML={content} />
```

### Exported Functions

```ts
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...blogEntries.map((entry) => routeFor(entry, 'blog')))
  return routes
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  // Route matching, then:
  const bodyHtml = renderToString(() => <MyComponent />)
  return renderDocument({ title, basePath: config.base, cssPath: config.cssPath, bodyHtml })
}
```

### Building the HTML Document

The document shell is built as a template string (same pattern as the React example):

```ts
function renderDocument(props: {
  title: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
}) {
  const { title, basePath, cssPath, jsPath, searchEnabled, bodyHtml } = props
  const base = basePath.replace(/\/+$/, '')

  return `<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${title}</title>
    <link rel="stylesheet" href="${base}/assets/fonts.css" />
    <link rel="stylesheet" href="${cssPath}" />
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
    <script>document.documentElement.classList.remove('no-js')</script>
    ${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
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
    <title>Pagesmith + Solid</title>
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

You can either use the built-in styles or write your own theme from scratch. During the build, Vite bundles all CSS and the `SsgRenderConfig.cssPath` gives you the hashed URL for the `<link>` tag.

## Pagefind Search

Pagefind runs automatically after the production build. To enable search:

1. Add `data-pagefind-body` to content areas:

```tsx
<main data-pagefind-body>
  <div class="prose" innerHTML={content} />
</main>
```

2. Conditionally include Pagefind assets based on `config.searchEnabled`:

```ts
${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
```

3. Add a search trigger button and dialog container in your rendered HTML.

4. Initialize `PagefindUI` in runtime JavaScript when the modal opens (same pattern as the React example).

Search is disabled during development and enabled automatically in production builds.

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

- **`vite-plugin-solid`** with `ssr: true` handles the Solid JSX transform and SSR support.
- **`renderToString`** from `solid-js/web` produces static HTML strings for SSG.
- **Solid primitives** (`For`, `Show`) work in SSR mode for list rendering and conditional display.
- **`innerHTML`** is how you inject raw HTML (rendered markdown) into Solid components -- not `dangerouslySetInnerHTML`.
- **`class`** is used instead of `className` in Solid components.
- **Virtual modules** (`virtual:content/<name>`) provide pre-rendered content at build time.
- **`pagesmithSsg`** manages the full SSG lifecycle: dev middleware, pre-rendering, asset copying, and Pagefind.
- **CSS imports** from `@pagesmith/core` provide the complete design system.
