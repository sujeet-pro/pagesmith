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

Layout matches other Pagesmith examples (`content/`, `public/`, `src/`) but rendering is **core JSX + `createContentLayer`** instead of a framework app shell.

## Directory overview

```text
examples/blog-site/
  llms.txt             Agent-oriented notes for this example (repo-local)
  content/
    guide/             How this example works, including `kitchen-sink.md`
    pages/             Standalone pages (about)
  public/
    favicon.svg        Static assets copied to output root
  src/
    entry-server.tsx   SSR entry: layer, getRoutes/render, JSX layouts
    runtime.ts         Client JS (TOC, sidebar, theme, search affordances)
    theme.css          Imports @pagesmith/site/css/content + layout rules
  client.js            Client entry: imports theme.css + runtime.ts
  vite.config.ts       Vite + pagesmithSsg (no pagesmithContent)
  package.json
  tsconfig.json
```

## Differences vs framework examples

### No `content.config.ts` at the example root

Collections are declared beside `createContentLayer` in `src/entry-server.tsx` so a single module owns config + rendering.

### No `virtual:content/*` imports

Use `await layer.getCollection('guide')` (and similar), then `await entry.render()` for HTML.

### Core JSX runtime

TSX uses `@pagesmith/core` as JSX import source. Prefer DOM attribute names (`class`, `for`); inject rendered Markdown with **`innerHTML={html}`** on a wrapper inside the article shell.

```tsx
// React: <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
// Core:  <div class="prose" innerHTML={html} />
```

### Single CSS entry

`src/theme.css` imports `@pagesmith/site/css/content` for prose + code chrome, then adds layout matching the other examples’ doc shell.
