---
title: Layouts & Rendering
description: How React renders pages to static HTML
date: 2026-03-17
tags:
  - react
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

This example uses **`renderToStaticMarkup`** from `react-dom/server` at **build time only**. The browser never hydrates a React tree; it receives static HTML plus a small **`src/runtime.ts`** bundle for TOC, sidebar, and theme controls.

## The SSG entry contract

`pagesmithSsg` loads `./src/entry-server.tsx` and expects:

```ts
export async function getRoutes(): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes()`** lists every URL to emit. This example derives routes from the guide collection plus `/`, `/404`, and `pages` (e.g. `/about`):

```ts title="src/entry-server.tsx (excerpt)"
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))

  const aboutPage = pageEntries.find((entry) => leafSlug(entry.contentSlug, 'pages') === 'about')
  if (aboutPage) {
    routes.push(routeFor(aboutPage, 'pages'))
  }

  return routes
}
```

**`render(url, config)`** normalizes the path, picks the matching entry (guide or pages), builds layout markup with **`renderToStaticMarkup`**, then wraps the result in a full HTML document.

## Document shell (`renderDocumentShell`)

Body fragments from React are **strings**. The complete document — `<html>`, `<head>` (CSS, optional Pagefind Component UI assets), skip links, sidebar dialog, and the script tag for **`client.js`** — comes from **`renderDocumentShell`** in `@pagesmith/core/ssg-utils`. This file assigns `const renderDocument = renderDocumentShell` and passes **`bodyHtml`**, optional **`sidebarHtml`**, **`config.base`**, **`cssPath`**, **`jsPath`**, and **`searchEnabled`** so the shell stays consistent with other framework examples.

## Component roles

- **`HomeBody`** — Landing page: hero, kitchen-sink CTA, guide links.
- **`PageBody`** — Shared article chrome for guide and standalone pages: optional TOC, prose HTML via **`dangerouslySetInnerHTML`**, prev/next, footer.
- **`SiteHeader`** — Top nav (Home, Guide) and optional **`<pagefind-modal-trigger>`** when `searchEnabled` is true.
- **`SidebarNav`** — Desktop sidebar: primary links plus guide groups (`series`).

## Render pipeline (one URL)

1. SSG plugin calls `render('/guide/installation', config)`.
2. Entry resolves the guide entry, builds props from `html` / `headings` / frontmatter.
3. **`renderToStaticMarkup`** runs for `PageBody` (and sometimes a standalone `SidebarNav` string for the shell’s sidebar slot).
4. **`renderDocumentShell`** merges those strings into a full HTML page.
5. Output is written under `gh-pages/examples/react/…` per `vite.config.ts` `build.outDir`.

The same pattern applies to `/guide/kitchen-sink` and `/about`, swapping which entry supplies `html` and metadata.
