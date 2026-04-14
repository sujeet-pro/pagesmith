---
title: Project Structure
description: Where content, SSR entry, client bundle, and config live in this example
date: 2026-03-19
tags:
  - architecture
series: Getting Started
seriesOrder: 2
---

# Project Structure

```text
examples/with-solid/
  content/
    guide/             This guide series, including `kitchen-sink.md`
    pages/             `pages` collection (e.g. about)
  public/              Copied to output as-is (favicon, etc.)
  src/
    entry-server.tsx   Exports `getRoutes` / `render` — Solid → HTML strings + `renderDocument` shell
    runtime.ts         Browser-only progressive enhancement (TOC, sidebar, theme, search trigger)
    theme.css            Site layout and design tokens
    pagesmith-content.d.ts   Generated types for `virtual:content/*` (do not hand-edit)
    env.d.ts
  client.js              Vite client entry: theme + core runtime CSS/JS for code blocks + `runtime.ts`
  content.config.ts      `defineCollection` / `defineCollections` — source of virtual module shape
  vite.config.ts         Plugins: shared assets, Solid SSR, pagesmithContent, pagesmithSsg
  llms.txt               Example-local agent notes (integration seams, Pagefind, dev vs build)
  package.json
  tsconfig.json
```

## How the pieces connect

1. **`content.config.ts`** defines collection names and Zod schemas.
2. **`pagesmithContent`** turns each collection into **`virtual:content/<name>`** consumed in **`entry-server.tsx`**.
3. **`pagesmithSsg`** invokes that module’s **`getRoutes`** and **`render`** during `vite build`, and SSR middleware during `vite dev`.
4. **`client.js`** is the deferred script referenced from the generated HTML; it is **not** Solid — it loads global styles, shared code-block runtime from `@pagesmith/site`, then **`runtime.ts`** for UX on top of static markup.
