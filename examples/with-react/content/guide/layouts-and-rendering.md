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

The React example uses `renderToStaticMarkup` from `react-dom/server` to convert JSX components into static HTML at build time. No React runtime ships to the browser -- the output is plain HTML enhanced by a small vanilla JS runtime.

## The SSR entry contract

The SSG plugin expects the entry file to export two functions:

```ts
export async function getRoutes(): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes()`** returns every URL the site should generate. The React example builds this list from the three content collections:

```ts title="src/entry-server.tsx (excerpt)"
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...blogEntries.map((entry) => routeFor(entry, 'blog')))

  const aboutPage = pageEntries.find((entry) => leafSlug(entry.contentSlug, 'pages') === 'about')
  if (aboutPage) {
    routes.push(routeFor(aboutPage, 'pages'))
  }

  return routes
}
```

**`render(url, config)`** receives a URL and an `SsgRenderConfig` object (containing `base`, `cssPath`, `jsPath`, and `searchEnabled`), then returns a complete HTML document string.

## Component architecture

The entry server defines several React components that compose the page structure:

### `HomeBody`

Renders the landing page with a hero section, recent blog posts, and a guide listing. Receives navigation entries as props and renders them into card-style lists.

### `PageBody`

Handles all content pages (guide articles, blog posts, standalone pages). Includes:
- A sidebar with grouped navigation (`SidebarNav`)
- An article area with optional date/read-time metadata
- A table of contents in the right aside (desktop) and a collapsible `<details>` element (mobile)
- A footer with external links

### `SiteHeader`

The top navigation bar with a logo, navigation links (Home, Guide, Blog), a mobile sidebar toggle, and an optional search trigger button.

### `SidebarNav`

A sidebar component that renders navigation sections, guide groups (organized by series), and blog entries. Highlights the currently active page based on the URL path.

## The render document function

After React components produce the body HTML, `renderDocument()` wraps it in a full HTML shell:

```ts title="src/entry-server.tsx (excerpt)"
function renderDocument(props: {
  title: string
  description?: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
  sidebarHtml?: string
}) { /* ... */ }
```

This function assembles the `<head>` (meta tags, stylesheets, Pagefind assets) and `<body>` (rendered content, sidebar modal dialog, search modal dialog, and the client JS bundle). It handles HTML escaping of dynamic values like titles and descriptions.

## How a page gets built

The full rendering flow for a single page:

1. The SSG plugin calls `render('/guide/installation', config)`
2. The function normalizes the route and looks up the matching guide entry
3. `SidebarNav` and `PageBody` are rendered with `renderToStaticMarkup`
4. `renderDocument` wraps the markup in a complete HTML document
5. The plugin writes the result to `gh-pages/examples/react/guide/installation/index.html`

The same flow applies to blog posts and standalone pages, each selecting the appropriate entry and passing it to `PageBody`.
