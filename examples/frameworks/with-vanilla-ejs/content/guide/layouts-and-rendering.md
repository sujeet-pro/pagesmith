---
title: Layouts & Rendering
description: How EJS templates render pages to static HTML
date: 2026-03-17
tags:
  - ejs
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

EJS runs **only** inside `src/entry-server.tsx` at SSG (and during dev SSR). The browser receives plain HTML plus optional client JS.

## The SSR entry contract

The SSG plugin loads the entry module and calls:

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

`SsgRenderConfig` includes `base`, `root`, `cssPath`, `jsPath`, **`searchEnabled`**, and **`isDev`**. This example forwards `searchEnabled` (and `isDev`) into `layout.ejs` so Pagefind assets match the environment.

**`getRoutes()`** returns pathnames (with leading `/`, no `index.html`). This example builds the list from loaded collections plus `/` and `/about` when that page exists:

```ts title="src/entry-server.tsx (excerpt)"
export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { sortedGuide, renderedPages } = await loadContent(config.root)
  const routes = ['/']
  for (const item of sortedGuide) routes.push(`/guide/${item.entry.slug}`)
  if (renderedPages.find((p) => p.entry.slug === 'about')) routes.push('/about')
  return routes
}
```

**`render(url, config)`** strips `config.base` from the request URL, loads markdown through `createContentLayer`, renders a fragment template, then wraps it with `layout.ejs`.

## Template loading

```ts title="src/entry-server.tsx (excerpt)"
function loadTemplate(root: string, name: string) {
  return readFileSync(join(root, 'templates', `${name}.ejs`), 'utf-8')
}

function renderWithLayout(root: string, body: string, vars: Record<string, any>) {
  const layout = loadTemplate(root, 'layout')
  return ejs.render(layout, { ...vars, body })
}
```

1. Render `article.ejs` / `index.ejs` / `about.ejs` to an HTML string (`body`).
2. Call `renderWithLayout()` so `layout.ejs` receives that string as `body` (escaped vs unescaped is handled in the templates).

## Layout responsibilities

`layout.ejs` is the document shell: `<head>` links (`cssPath` for the Vite client bundle, `basePath` for public assets), header, sidebar (via inline `renderSidebarContent()` used for desktop and the mobile dialog), optional TOC aside, footer, and gated Pagefind markup.

Sidebar navigation is driven by data prepared in `entry-server.tsx` (`sidebar.guideGroups`, first guide slug), not by a separate `meta.json5` file.

## EJS tag cheat sheet

- **`<%= expr %>`** — escaped text.
- **`<%- expr %>`** — raw HTML (`body`, markdown `content`).
- **`<% code %>`** — logic only.

## Output paths

For route `/guide/installation`, the plugin writes `guide/installation/index.html` under the configured `build.outDir` (this repo: `gh-pages/examples/vanilla-ejs/`).
