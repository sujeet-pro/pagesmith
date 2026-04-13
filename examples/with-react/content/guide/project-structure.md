---
title: Project Structure
description: Understanding the file layout
date: 2026-03-19
tags:
  - architecture
series: Getting Started
seriesOrder: 2
---

# Project Structure

The React example keeps **content**, **build config**, **SSG entry**, and **browser runtime** in separate layers.

## Directory overview

```text
examples/with-react/
  content/
    guide/            Markdown for the `guide` collection, including `kitchen-sink.md`
    pages/            Standalone pages (e.g. about)
  public/
    favicon.svg       Copied to output as static files
  src/
    entry-server.tsx  SSG entry — virtual imports, React → HTML strings, getRoutes/render
    runtime.ts        Browser-only progressive enhancement (TOC, sidebar, theme)
    theme.css         Site layout and design tokens (this example owns its CSS)
    pagesmith-content.d.ts  Generated types for virtual content modules
  client.js           Vite client entry — theme + core content CSS + runtime
  content.config.ts   `defineCollections` for guide and pages
  vite.config.ts      Vite + Pagesmith plugins
  package.json
  tsconfig.json
  llms.txt            Agent-oriented notes for this example
```

## Key files explained

### `vite.config.ts`

Registers **`sharedAssetsPlugin`**, **`pagesmithContent({ collections })`**, and the spread return of **`pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] })`**. Sets `base` and `build.outDir` for the hosted demo path.

```ts title="vite.config.ts (excerpt)"
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/pagesmith/examples/react',
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/react',
    emptyOutDir: true,
    rolldownOptions: {
      checks: { pluginTimings: false },
    },
  },
})
```

### `content.config.ts`

Two collections — **`guide`** and **`pages`** — each backed by a markdown directory and a Zod schema. The markdown showcase now lives at **`content/guide/kitchen-sink.md`**.

### `src/entry-server.tsx`

Imports **`virtual:content/*`**, defines layout components, exports **`getRoutes`** and **`render`**. Uses **`renderDocumentShell`** for the outer HTML document.

### `src/theme.css`

Local stylesheet (reset, layout, prose). Not a substitute for **`@pagesmith/site/runtime/content`** on the client — that import keeps default markdown/code presentation aligned with what the pipeline emits.

### `src/runtime.ts`

Progressive enhancement: TOC active state, mobile sidebar dialog, header/footer theme controls, responsive Pagefind trigger attributes. It does **not** construct Pagefind UI manually.

### `client.js`

Vite’s browser bundle entry:

```js title="client.js"
import './src/theme.css'
import '@pagesmith/site/runtime/content'
import './src/runtime.ts'
```

`theme.css` is site chrome; **`@pagesmith/site/runtime/content`** ships the shared prose/code styles for rendered markdown; **`runtime.ts`** is your site-specific JS.

### `content/`

Markdown per collection. Invalid frontmatter fails the build during `pagesmithContent` validation.
