---
title: Layouts & Rendering
description: Solid SSR for static HTML, the document shell, and how the browser bundle differs.
date: 2026-03-17
tags:
  - solid
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

This example uses **`renderToString`** from `solid-js/web` at **build time** only. There is no client-side Solid tree: the shipped JS is plain `client.js` → CSS, `@pagesmith/site/runtime/content`, and `src/runtime.ts`.

## SSG entry contract

`pagesmithSsg` loads `src/entry-server.tsx` as a Node module and expects:

```ts
export async function getRoutes(): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

`getRoutes()` returns `/`, `/404`, every guide URL derived from the virtual collections, plus `/about` when that page exists. `render(url, config)` returns a **full HTML document string** for one URL.

`config` includes `base`, hashed `cssPath` / `jsPath` for the client bundle, `searchEnabled`, and `isDev`. The same Solid code paths run in dev and build; branching (e.g. search markup) uses `config` rather than ad-hoc `process.env` checks in this file.

## Solid inside `render()`

For each route, the entry:

1. Normalizes `url` against `config.base`.
2. Looks up the matching collection entry (or home / 404).
3. Calls `renderToString` on layout components (`HomeBody`, `PageBody`, `SidebarNav` for the mobile dialog, etc.).
4. Passes the resulting fragment HTML into **`renderDocument()`**, which concatenates the outer document: charset, title, FOUC inline script, stylesheet links, optional Pagefind tags, `bodyHtml`, optional sidebar `<dialog>`, deferred `jsPath` script.

Markdown body strings come from the virtual modules as **`html`**; the article uses Solid’s `innerHTML` prop on a wrapper `<div class="prose">` so the pipeline’s HTML is injected without escaping.

## Why a string document shell

`renderDocument()` builds `<html>…</html>` as a template string so the SSG plugin can write `index.html` files without running a second framework root for the shell. Solid is reserved for the **repeatable layout** pieces you want to express as components; the shell stays easy to audit for SEO, Pagefind, and asset URLs.

## Related guides

- [Vite Configuration](./vite-config) — plugin order and `pagesmithSsg` options.
- [Search Integration](./search-integration) — Pagefind indexing and dev vs build.
