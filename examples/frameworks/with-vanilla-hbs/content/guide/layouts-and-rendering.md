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

Handlebars turns each request into a **complete HTML document** at SSR time. The browser receives static HTML plus optional scripts (`client.js`, Pagefind, inline layout scripts).

## The SSR entry contract

`pagesmithSsg` loads `src/entry-server.tsx` and uses:

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

`getRoutes()` returns every path to generate. `render(url, config)` returns one HTML string per path. `config` includes `base`, `root`, asset paths, and flags such as `searchEnabled`.

## Partials vs one-time setup

**Helpers** (`formatDate`, `eq`, `startsWith`, `or`, `concat`) are registered once when the entry module loads.

**The `layout` partial** is different: `Handlebars.registerPartial('layout', loadTemplate(root, 'layout'))` runs at the **start of each `render()`** call. That is deliberate so edits to `templates/layout.hbs` are picked up on the next dev request without restarting Vite. Page templates (`article`, `index`, `about`) are recompiled each render for the same reason.

**The content layer** is cached separately (`getLayer` keeps a single `createContentLayer` instance per `root`) so markdown is not re-read from disk on every partial tweak unless content watchers invalidate it through normal dev reload behavior.

## Template composition

Page templates use the layout as a partial and supply a `body` inline partial:

```hbs title="templates/article.hbs"
{{#> layout}}
  {{#*inline "body"}}
    <article id="doc-main-content" tabindex="-1" data-pagefind-body>
      ...
      <div class="prose">
        {{{content}}}
      </div>
    </article>
  {{/inline}}
{{/layout}}
```

Inside `layout.hbs`, `{{> body}}` is where that inline partial is injected. Shared chrome (header, sidebar shell, Pagefind modal) lives in the layout once.

## Data and escaping

- `{{title}}` — HTML-escaped text.
- `{{{content}}}` — Raw HTML from `entry.render()` (trusted markdown output).

Nested `{{#each}}` blocks change Handlebars scope; parent fields need `../` (see the sidebar links in `templates/layout.hbs`).

## End-to-end page build

1. SSG calls `render('/guide/installation', config)`.
2. Entry normalizes the URL (strips `config.base`), loads collections via the content layer, finds the guide entry.
3. Compiled `article.hbs` runs with template data; the layout partial fills the shell.
4. Plugin writes `guide/installation/index.html` under the configured `outDir`.

The same pipeline applies to `guide/kitchen-sink`, the home route (`index.hbs`), and `/about` (`about.hbs`).
