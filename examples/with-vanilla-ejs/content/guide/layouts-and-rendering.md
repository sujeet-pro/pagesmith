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

The EJS example uses `ejs.render()` to evaluate templates with data at build time. No template engine runs in the browser -- the output is plain HTML enhanced by a small vanilla JS runtime for search, sidebar, and TOC highlighting.

## The SSR entry contract

The SSG plugin expects the entry file to export two functions:

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes()`** returns every URL the site should generate. The EJS example builds this list from the three content collections:

```ts title="src/entry-server.tsx (excerpt)"
export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { sortedGuide, sortedFeatures, renderedPages } = await loadContent(config.root)
  const routes = ['/']
  for (const item of sortedGuide) routes.push(`/guide/${item.entry.slug}`)
  for (const item of sortedFeatures) routes.push(`/features/${item.entry.slug}`)
  if (renderedPages.find((p) => p.entry.slug === 'about')) routes.push('/about')
  return routes
}
```

**`render(url, config)`** receives a URL and an `SsgRenderConfig` object (containing `base`, `root`, `cssPath`, `jsPath`, and `searchEnabled`), then returns a complete HTML document string.

## Template loading and rendering

Templates are loaded from the `templates/` directory using `readFileSync` and rendered with `ejs.render()`:

```ts title="src/entry-server.tsx (excerpt)"
function loadTemplate(root: string, name: string) {
  return readFileSync(join(root, 'templates', `${name}.ejs`), 'utf-8')
}

function renderWithLayout(root: string, body: string, vars: Record<string, any>) {
  const layout = loadTemplate(root, 'layout')
  return ejs.render(layout, { ...vars, body })
}
```

The two-step pattern is central to how pages are built:

1. Render the page-specific template (article, index, or about) to produce a body HTML fragment
2. Pass that fragment into the layout template as the `body` variable

For example, rendering a guide page:

```ts title="src/entry-server.tsx (excerpt)"
const body = ejs.render(articleTemplate, {
  title: item.entry.data.title,
  date: item.entry.data.date,
  tags: item.entry.data.tags,
  description: item.entry.data.description,
  content: item.html,
  headings: item.headings,
  readTime: item.readTime,
  basePath,
  formatDate,
})
return renderWithLayout(root, body, {
  ...shared,
  title: item.entry.data.title,
  activePath: `/guide/${item.entry.slug}`,
  aside: renderTocAside(item.headings),
  isHome: false,
})
```

## EJS template syntax

EJS uses three tag types in these templates:

- **`<%= expr %>`** -- Outputs the escaped value of an expression (safe for user-facing text)
- **`<%- expr %>`** -- Outputs the unescaped value (used for rendered HTML content and CSS)
- **`<% code %>`** -- Executes JavaScript without outputting (used for loops and conditionals)

The layout template demonstrates all three:

```ejs title="templates/layout.ejs (excerpt)"
<title><%= title %></title>
<style><%- css %></style>

<% for (const group of sidebar.guideGroups) { %>
  <span class="doc-sidebar-link"><%= group.series %></span>
  <% for (const item of group.items) { %>
    <a href="<%= basePath %>guide/<%= item.slug %>/"><%= item.title %></a>
  <% } %>
<% } %>
```

## Sidebar reuse via inline function

The layout defines a JavaScript function inside an EJS scriptlet to render sidebar content, then calls it in two places -- the desktop sidebar and the mobile drawer:

```ejs title="templates/layout.ejs (excerpt)"
<%
  function renderSidebarContent() {
%>
  <div class="doc-sidebar-section">
    <!-- Navigation links -->
  </div>
<% } %>

<!-- Desktop sidebar -->
<aside class="doc-sidebar">
  <nav class="doc-sidebar-nav">
    <% renderSidebarContent() %>
  </nav>
</aside>

<!-- Mobile sidebar modal -->
<dialog class="doc-sidebar-modal" id="sidebar-modal">
  <nav class="doc-sidebar-nav">
    <% renderSidebarContent() %>
  </nav>
</dialog>
```

This pattern avoids duplicating the sidebar markup while keeping everything in a single template file.

## How a page gets built

The full rendering flow for a single page:

1. The SSG plugin calls `render('/guide/installation', config)`
2. The function normalizes the route and loads content via `createContentLayer`
3. The matching guide entry is found and its rendered HTML is retrieved
4. `ejs.render()` evaluates the article template with the entry data
5. `renderWithLayout()` wraps the result in the layout template
6. The plugin writes the output to `gh-pages/examples/vanilla-ejs/guide/installation/index.html`

The same flow applies to feature pages, the home page, and the about page, each selecting the appropriate template and data.
