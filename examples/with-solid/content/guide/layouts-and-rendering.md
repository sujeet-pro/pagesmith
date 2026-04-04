---
title: Layouts & Rendering
description: How Solid renders pages to static HTML
date: 2026-03-17
tags:
  - solid
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

The Solid example uses `renderToString` from `solid-js/web` to convert JSX components into static HTML at build time. No Solid runtime ships to the browser -- the output is plain HTML enhanced by a small vanilla JS runtime.

## The SSR entry contract

The SSG plugin expects the entry file to export two functions:

```ts
export async function getRoutes(): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes()`** returns every URL the site should generate. The Solid example builds this list from the three content collections:

```tsx title="src/entry-server.tsx (excerpt)"
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...featuresEntries.map((entry) => routeFor(entry, 'features')))

  const aboutPage = pageEntries.find((entry) => leafSlug(entry.contentSlug, 'pages') === 'about')
  if (aboutPage) {
    routes.push(routeFor(aboutPage, 'pages'))
  }

  return routes
}
```

**`render(url, config)`** receives a URL and an `SsgRenderConfig` object (containing `base`, `cssPath`, `jsPath`, and `searchEnabled`), then returns a complete HTML document string.

## Component architecture

All components are defined directly in `entry-server.tsx` as Solid functional components:

### `HomeBody`

Renders the landing page with a hero section, feature listings, and a guide listing. Uses Solid's `<For>` component to iterate over navigation entries and `<Show>` for conditional rendering.

### `PageBody`

Handles all content pages (guide articles, feature posts, standalone pages). Includes:
- A sidebar with grouped navigation (`SidebarNav`)
- An article area with optional date/read-time metadata
- A table of contents in the right aside (desktop) and a collapsible `<details>` element (mobile)
- A footer with external links

### `SiteHeader`

The top navigation bar with a logo, navigation links (Home, Guide, Features), a mobile sidebar toggle, and an optional search trigger button rendered with `<Show>`.

### `SidebarNav`

A sidebar component that renders navigation sections and guide groups organized by series. Uses nested `<For>` loops to render series groups and their entries, highlighting the currently active page.

## Solid-specific patterns

The entry server uses two key Solid primitives for templating:

- **`<For each={items}>`** -- Efficient list rendering. Used throughout for navigation entries, headings, and content listings.
- **`<Show when={condition}>`** -- Conditional rendering. Used for optional elements like search triggers, dates, and descriptions.

Raw HTML content from the markdown pipeline is injected using Solid's `innerHTML` prop:

```tsx title="src/entry-server.tsx (excerpt)"
<div class="prose" innerHTML={content} />
```

## How a page gets built

The full rendering flow for a single page:

1. The SSG plugin calls `render('/guide/installation', config)`
2. The function normalizes the route and looks up the matching guide entry
3. `SidebarNav` and `PageBody` are rendered with `renderToString`
4. `renderDocument` wraps the markup in a complete HTML document
5. The plugin writes the result to `gh-pages/examples/solid/guide/installation/index.html`
