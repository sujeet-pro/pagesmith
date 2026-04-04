---
title: Layouts & Rendering
description: How Handlebars templates render pages to static HTML
date: 2026-03-17
tags:
  - handlebars
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

The Handlebars example uses `Handlebars.compile()` to convert templates into render functions at build time. No template engine runs in the browser -- the output is plain HTML enhanced by a small vanilla JS runtime for search, sidebar, and TOC highlighting.

## The SSR entry contract

The SSG plugin expects the entry file to export two functions:

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes()`** returns every URL the site should generate. The Handlebars example builds this list from the three content collections:

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

## Custom Handlebars helpers

The entry server registers several custom helpers before any template rendering occurs:

```ts title="src/entry-server.tsx (excerpt)"
Handlebars.registerHelper('formatDate', (value) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})
Handlebars.registerHelper('eq', (left, right) => left === right)
Handlebars.registerHelper('startsWith', (str, prefix) =>
  typeof str === 'string' && str.startsWith(prefix))
Handlebars.registerHelper('or', function (...args) {
  args.pop() // Remove Handlebars options object
  return args.some(Boolean)
})
Handlebars.registerHelper('concat', function (...args) {
  args.pop() // Remove Handlebars options object
  return args.join('')
})
```

These helpers compensate for Handlebars' intentionally limited expression syntax. Without `eq`, `startsWith`, and `concat`, the templates could not implement active-state highlighting for sidebar navigation.

## Template compilation and partials

Templates are loaded from the `templates/` directory and compiled into render functions:

```ts title="src/entry-server.tsx (excerpt)"
function loadTemplate(root: string, name: string) {
  return readFileSync(join(root, 'templates', `${name}.hbs`), 'utf-8')
}

// Register the layout as a partial so page templates can extend it
Handlebars.registerPartial('layout', loadTemplate(root, 'layout'))

const articleTemplate = Handlebars.compile(loadTemplate(root, 'article'))
const indexTemplate = Handlebars.compile(loadTemplate(root, 'index'))
```

The layout is registered as a **partial** rather than compiled as a standalone template. Page templates extend it using partial blocks.

## Partial block composition

Handlebars uses a partial-based composition model for layout inheritance. Page templates extend the layout by defining an inline `body` partial:

```hbs title="templates/article.hbs"
{{#> layout}}
  {{#*inline "body"}}
    <article>
      <div class="prose">
        {{{content}}}
      </div>
    </article>
  {{/inline}}
{{/layout}}
```

Inside the layout template, `{{> body}}` is replaced with the content defined by the inline partial. This is Handlebars' equivalent of template inheritance in other engines.

## Handlebars template syntax

Handlebars uses three expression types in these templates:

- **`{{expr}}`** -- Outputs the escaped value of an expression (safe for user-facing text)
- **`{{{expr}}}`** -- Outputs the unescaped value with triple-stash (used for rendered HTML content and CSS)
- **`{{#if}}`, `{{#each}}`, `{{#unless}}`** -- Block helpers for conditionals and iteration

The layout template demonstrates all three patterns:

```hbs title="templates/layout.hbs (excerpt)"
<title>{{title}}</title>
<style>{{{css}}}</style>

{{#each sidebar.guideGroups}}
  <span class="doc-sidebar-link">{{this.series}}</span>
  {{#each this.items}}
    <a href="{{../../basePath}}guide/{{this.slug}}/">{{this.title}}</a>
  {{/each}}
{{/each}}
```

Note the `../../basePath` path traversal -- Handlebars scopes data to the current `{{#each}}` block, so accessing parent context requires `../` prefixes.

## Sidebar reuse via inline partials

The layout defines a reusable `sidebarContent` inline partial to render navigation in both the desktop sidebar and the mobile drawer:

```hbs title="templates/layout.hbs (excerpt)"
{{#*inline "sidebarContent"}}
  <div class="doc-sidebar-section">
    <!-- Navigation links using custom helpers -->
    <li class="doc-sidebar-item{{#if (eq activePath '/')}} active{{/if}}">
      <a href="{{basePath}}" class="doc-sidebar-link">Home</a>
    </li>
  </div>
{{/inline}}

<!-- Desktop sidebar -->
<aside class="doc-sidebar">
  <nav class="doc-sidebar-nav">
    {{> sidebarContent}}
  </nav>
</aside>

<!-- Mobile sidebar modal -->
<dialog class="doc-sidebar-modal" id="sidebar-modal">
  <nav class="doc-sidebar-nav">
    {{> sidebarContent}}
  </nav>
</dialog>
```

## How a page gets built

The full rendering flow for a single page:

1. The SSG plugin calls `render('/guide/installation', config)`
2. The function normalizes the route and loads content via `createContentLayer`
3. The matching guide entry is found and its rendered HTML is retrieved
4. The compiled article template is called with the entry data, which invokes the layout partial internally
5. The plugin writes the output to `gh-pages/examples/vanilla-hbs/guide/installation/index.html`

The same flow applies to feature pages, the home page, and the about page, each using the appropriate compiled template.
