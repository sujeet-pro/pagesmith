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

The Svelte example follows a conventional layout where content, configuration, and rendering are clearly separated. Unlike the React and Solid examples that use a single entry file, the Svelte example splits rendering across multiple `.svelte` component files.

## Directory overview

```text
examples/with-svelte/
  content/
    features/          Markdown articles for the features collection
    guide/             Markdown articles for the guide collection (this section)
    pages/             Standalone pages (e.g., about)
  public/
    favicon.svg        Static assets copied directly to the output
  src/
    components/
      HomeBody.svelte      Landing page layout
      NotFoundBody.svelte  404 page content
      PageBody.svelte      Article page layout with sidebar and TOC
      SidebarNav.svelte    Navigation sidebar with series grouping
      SiteHeader.svelte    Top navigation bar with search trigger
    App.svelte         Root component that selects the page layout
    entry-server.ts    SSR entry -- orchestrates rendering with svelte/server
    site.ts            Shared data, types, and utility functions
    runtime.ts         Client-side JS (TOC highlighting, search, sidebar)
    theme.css          Complete site stylesheet
  client.js            Client entry -- imports theme.css and runtime.ts
  content.config.ts    Collection definitions with Zod schemas
  svelte.config.js     Svelte preprocessor configuration
  vite.config.ts       Vite config with Pagesmith plugins
  package.json         Dependencies and scripts
  tsconfig.json        TypeScript configuration
```

## Key files explained

### `src/site.ts`

Shared data and utilities extracted into a standalone module. Imports the virtual content modules, defines TypeScript types (`MarkdownEntry`, `NavEntry`, `GuideGroup`, `Heading`), and exports sorted collections and helper functions used by both the entry server and Svelte components.

### `src/App.svelte`

The root component that acts as a layout router. It receives a `pageKind` prop (`'home'`, `'page'`, or `'not-found'`) and conditionally renders the appropriate child component. It also renders the sidebar modal dialog and search modal when applicable.

### `src/components/`

Five Svelte components handle the page structure. Each uses Svelte 5's `$props()` rune for type-safe prop declarations. `PageBody.svelte` handles content pages with sidebar, TOC, and metadata. `HomeBody.svelte` renders the landing page with hero and content listings.

### `src/entry-server.ts`

The SSR entry that imports `App.svelte` and calls `render()` from `svelte/server` to produce HTML. This file is kept thin -- it builds props from the route and content data, then delegates all rendering to the Svelte component tree.

### `svelte.config.js`

Configures the Svelte preprocessor using `vitePreprocess` from the Svelte Vite plugin, enabling TypeScript support in `.svelte` files.
