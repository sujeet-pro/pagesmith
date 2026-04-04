---
title: Layouts & Rendering
description: How Svelte renders pages to static HTML
date: 2026-03-17
tags:
  - svelte
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

The Svelte example uses the `render` function from `svelte/server` to convert `.svelte` components into static HTML at build time. No Svelte runtime ships to the browser -- the output is plain HTML enhanced by a small vanilla JS runtime.

## The SSR entry contract

The SSG plugin expects the entry file to export two functions:

```ts
export async function getRoutes(): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes()`** returns every URL the site should generate. **`render(url, config)`** receives a URL and an `SsgRenderConfig` object, then returns a complete HTML document string.

## How rendering works

The entry server builds a props object based on the current route, then passes it to the root `App.svelte` component:

```ts title="src/entry-server.ts (excerpt)"
import { render as renderSvelte } from 'svelte/server'
import App from './App.svelte'

const rendered = renderSvelte(App, { props: appProps })

return renderDocument({
  title,
  description,
  headHtml: rendered.head,
  basePath: config.base,
  cssPath: config.cssPath,
  bodyHtml: rendered.body,
})
```

The `render` function from `svelte/server` returns an object with `body` (the HTML string) and `head` (any `<svelte:head>` content). Both are incorporated into the final document.

## Component architecture

Unlike the Solid example where everything lives in a single file, the Svelte example uses separate `.svelte` component files:

### `App.svelte`

The root component that acts as a layout router. It receives a `pageKind` prop and uses Svelte's `{#if}` blocks to select the appropriate child:

```svelte title="src/App.svelte (excerpt)"
{#if pageKind === 'home'}
  <HomeBody {firstGuideUrl} {firstFeaturesUrl} {guideEntries} {featuresEntries} />
{:else if pageKind === 'page'}
  <PageBody title={pageTitle} content={pageContent} headings={pageHeadings} ... />
{:else}
  <NotFoundBody />
{/if}
```

### `PageBody.svelte`

Handles all content pages with a sidebar, article area, table of contents, and footer. Uses `{@html content}` to inject the rendered markdown.

### `SidebarNav.svelte`

Renders navigation sections and guide groups organized by series. Uses `{#each}` blocks to iterate over groups and entries.

### `SiteHeader.svelte`

The top navigation bar with logo, links, mobile sidebar toggle, and conditional search trigger.

## Svelte 5 patterns

All components use Svelte 5's `$props()` rune for type-safe prop declarations:

```svelte title="src/App.svelte (excerpt)"
let {
  pageKind,
  pageTitle = '',
  currentPath,
  basePath,
  ...
}: { pageKind: 'home' | 'page' | 'not-found', ... } = $props()
```

Raw HTML from the markdown pipeline is injected using Svelte's `{@html}` tag:

```svelte
<div class="prose">{@html content}</div>
```

## How a page gets built

The full rendering flow for a single page:

1. The SSG plugin calls `render('/guide/installation', config)`
2. The entry server normalizes the route and looks up the matching content entry
3. Props are assembled and passed to `App.svelte`
4. `renderSvelte(App, { props })` produces `{ body, head }`
5. `renderDocument` wraps the output in a complete HTML document
6. The plugin writes the result to `gh-pages/examples/svelte/guide/installation/index.html`
