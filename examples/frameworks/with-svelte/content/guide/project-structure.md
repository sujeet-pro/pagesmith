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

Content, Vite config, and SSG entry are separated so the **integration path** stays obvious: collections → virtual imports in `site.ts` → `entry-server.ts` → `renderDocumentShell` → disk.

## Directory overview

```text
examples/with-svelte/
  content/
    guide/             How this example is wired, including `kitchen-sink.md`
    pages/             Standalone pages (about)
  public/
    favicon.svg
  src/
    components/        Layout pieces (header, bodies, nav)
    App.svelte         Route-level layout; sidebar dialog only (no Pagefind modal)
    entry-server.ts    getRoutes + render → HTML string
    site.ts            virtual:content imports, nav, types
    runtime.ts         Browser-only behavior (not Svelte)
    theme.css
  client.js            Vite client entry (CSS + core content runtime + runtime.ts)
  content.config.ts    defineCollection / defineCollections
  vite.config.ts
  package.json
  llms.txt             Agent-oriented summary of this example
```

## Key files

### `src/site.ts`

Single place that imports `virtual:content/*`, sorts entries, builds nav structures, and exports helpers (`routeFor`, `groupBySeries`, …). Keeps `entry-server.ts` thin.

### `src/App.svelte`

Root layout router (`pageKind`). Renders the mobile navigation dialog. Search **trigger** only lives in `SiteHeader.svelte`; the Pagefind **modal** comes from `renderDocumentShell` when search is enabled.

### `src/entry-server.ts`

Maps `url` + `SsgRenderConfig` to props, calls `render` from `svelte/server`, then `renderDocumentShell({ …, bodyHtml, searchEnabled })`.

### `client.js` and `src/runtime.ts`

`client.js` is the Vite multi-page client entry. `runtime.ts` holds example-specific DOM code; it intentionally does not implement global search shortcuts (Pagefind does).
