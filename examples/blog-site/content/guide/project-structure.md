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

The blog-site example follows the same content layout as the framework examples but uses `@pagesmith/core` directly for rendering.

## Directory overview

```text
examples/blog-site/
  content/
    features/          Markdown feature showcase (shared with other examples)
    guide/             How this example works (this section)
    pages/             Standalone pages (about)
  public/
    favicon.svg        Static assets copied to output
  src/
    entry-server.tsx   SSR entry -- core JSX components rendered to HTML
    runtime.ts         Client-side JS (TOC highlighting, search, sidebar)
    theme.css          Complete site stylesheet
  client.js            Client entry -- imports theme.css and runtime.ts
  vite.config.ts       Vite config with Pagesmith plugins
  package.json         Dependencies and scripts
  tsconfig.json        TypeScript configuration
```

## Key differences from React

### No `content.config.ts`

Framework examples define collections in `content.config.ts` and import them via virtual modules. This example defines collections inline in `entry-server.tsx` using `createContentLayer`.

### No virtual modules

Instead of `import guideCollection from 'virtual:content/guide'`, this example calls `layer.getCollection('guide')` at render time.

### Core JSX runtime

The TSX files use `@pagesmith/core/jsx-runtime` as the JSX import source. Components use `class` instead of `className`, and raw HTML is injected via the `innerHTML` prop (not `dangerouslySetInnerHTML`).

```tsx
// React: <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
// Core:  <div class="prose" innerHTML={html} />
```

### Single CSS file

The stylesheet imports `@pagesmith/core/css/content` for prose styling, then adds the same layout CSS used by all examples (header, sidebar, grid, TOC, search, hero, footer).
