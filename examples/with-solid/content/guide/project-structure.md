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

The Solid example follows a conventional layout where content, configuration, and rendering are clearly separated.

## Directory overview

```text
examples/with-solid/
  content/
    features/          Markdown articles for the features collection
    guide/             Markdown articles for the guide collection (this section)
    pages/             Standalone pages (e.g., about)
  public/
    favicon.svg        Static assets copied directly to the output
  src/
    entry-server.tsx   SSR entry -- Solid components rendered to static HTML
    runtime.ts         Client-side JS (TOC highlighting, search, sidebar)
    theme.css          Complete site stylesheet (reset, tokens, layout, prose)
  client.js            Client entry -- imports theme.css and runtime.ts
  content.config.ts    Collection definitions with Zod schemas
  vite.config.ts       Vite config with Pagesmith plugins
  package.json         Dependencies and scripts
  tsconfig.json        TypeScript configuration
```

## Key files explained

### `vite.config.ts`

The Vite configuration registers three Pagesmith plugins plus `vite-plugin-solid` for Solid's JSX transform:

```ts title="vite.config.ts"
import solid from 'vite-plugin-solid'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/pagesmith/examples/solid/',
  plugins: [
    sharedAssetsPlugin(),
    solid({ ssr: true }),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
})
```

### `content.config.ts`

Defines three content collections -- `guide`, `features`, and `pages` -- each backed by a directory of markdown files and validated with a Zod schema. Exported via `defineCollections` so the content plugin can consume them.

### `src/entry-server.tsx`

The heart of the rendering pipeline. This single file imports virtual content modules, defines Solid components for the home page, article pages, sidebar, and header, then exports `getRoutes()` and `render()` functions that the SSG plugin calls at build time. Everything -- components, helpers, and rendering logic -- lives in this one file.

### `src/theme.css`

A self-contained stylesheet providing CSS reset, design tokens, layout grid (header, sidebar, main, aside), prose typography, table of contents styles, search modal, and responsive breakpoints. No CSS imports from `@pagesmith/core` -- the example maintains its own complete stylesheet.

### `src/runtime.ts`

Client-side progressive enhancements loaded via `client.js`. Adds three features on top of the static HTML:
- **TOC highlight** -- Uses `IntersectionObserver` to highlight the current heading in the table of contents as the user scrolls.
- **Search modal** -- Initializes `PagefindUI` in a dialog and binds the keyboard shortcut.
- **Sidebar modal** -- Opens/closes the mobile navigation drawer.

### `content/`

Markdown files organized by collection. Each subdirectory maps to a collection defined in `content.config.ts`. Frontmatter in each file must satisfy the collection's Zod schema -- the content plugin validates this at build time and surfaces errors in the terminal.
