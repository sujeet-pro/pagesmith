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

The Handlebars example follows a conventional layout where content, templates, and rendering logic are clearly separated.

## Directory overview

```text
examples/with-vanilla-hbs/
  content/
    features/           Markdown articles for the features collection
    guide/              Markdown articles for the guide collection (this section)
    pages/              Standalone pages (e.g., about)
  public/
    favicon.svg         Static assets copied directly to the output
  templates/
    layout.hbs          Main HTML shell -- wraps every page via partials
    article.hbs         Article page template (guide and feature entries)
    index.hbs           Home page template
    about.hbs           About page template
  src/
    entry-server.tsx    SSR entry -- content loading, routing, helpers, and Handlebars rendering
    theme.css           Complete site stylesheet (reset, tokens, layout, prose)
  client.js             Client entry -- imports theme.css
  content.config.mjs    Collection definitions with Zod schemas
  vite.config.ts        Vite config with Pagesmith plugins
  package.json          Dependencies and scripts
  tsconfig.json         TypeScript configuration
```

## Key files explained

### `templates/layout.hbs`

The main HTML shell that wraps every page. Handlebars uses a partial-based composition model -- page templates extend the layout by defining an inline `body` partial that gets injected via `{{> body}}`:

```hbs title="templates/layout.hbs (excerpt)"
{{#if isHome}}
<main class="doc-home">
  <div class="doc-home-content" data-pagefind-body>
    {{> body}}
  </div>
</main>
{{else}}
<div class="doc-layout">
  <main class="doc-main" data-pagefind-body>
    {{> body}}
  </main>
</div>
{{/if}}
```

The layout also defines a reusable `sidebarContent` inline partial that renders navigation in both the desktop sidebar and the mobile drawer.

Handlebars uses `{{expression}}` for escaped output and `{{{expression}}}` for unescaped HTML (triple-stash):

```hbs title="templates/layout.hbs (excerpt)"
<title>{{title}}</title>
<style>{{{css}}}</style>
```

### `templates/article.hbs`

Renders guide and feature pages. Extends the layout via partial blocks:

```hbs title="templates/article.hbs (excerpt)"
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

The `{{#> layout}}...{{/layout}}` syntax invokes the layout partial, and `{{#*inline "body"}}` defines the content that replaces `{{> body}}` inside the layout.

### `templates/index.hbs` and `templates/about.hbs`

The home page template renders a hero section with feature cards and guide listings using Handlebars iteration (`{{#each}}`). The about template is minimal -- just a prose wrapper around the rendered markdown content.

### `src/entry-server.tsx`

The heart of the rendering pipeline. This file registers custom Handlebars helpers, uses `createContentLayer` to load content at build time, defines helper functions for sorting and grouping, then exports `getRoutes()` and `render()` functions that the SSG plugin calls. Each route is rendered by compiling the appropriate template with `Handlebars.compile()` and passing in template data.

### `content.config.mjs`

Defines three content collections -- `guide`, `features`, and `pages` -- each backed by a directory of markdown files and validated with a Zod schema. Uses `.mjs` extension for plain ESM compatibility with `createContentLayer`.

### `src/theme.css`

A self-contained stylesheet providing CSS reset, design tokens, layout grid (header, sidebar, main, aside), prose typography, table of contents styles, search modal, and responsive breakpoints. The example maintains its own complete stylesheet.
