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

The EJS example follows a conventional layout where content, templates, and rendering logic are clearly separated.

## Directory overview

```text
examples/frameworks/with-vanilla-ejs/
  content/
    guide/              Markdown articles for the guide collection, including `kitchen-sink.md`
    pages/              Standalone pages (e.g., about)
  public/
    favicon.svg         Static assets copied directly to the output
  templates/
    layout.ejs          Main HTML shell -- wraps every page
    article.ejs         Article page template (guide and feature entries)
    index.ejs           Home page template
    about.ejs           About page template
  src/
    entry-server.tsx    SSR entry -- content loading, routing, and EJS rendering
    theme.css           Complete site stylesheet (reset, tokens, layout, prose)
  client.js             Client entry -- imports theme.css
  content.config.mjs    Collection definitions with Zod schemas
  vite.config.ts        Vite config with Pagesmith plugins
  package.json          Dependencies and scripts
  tsconfig.json         TypeScript configuration
  llms.txt              Agent-oriented notes for this example (not loaded at runtime)
```

## Key files explained

### `templates/layout.ejs`

The main HTML shell that wraps every page. It receives variables such as `title`, `basePath`, `cssPath`, `jsPath`, `body`, `sidebar`, `activePath`, `isHome`, **`searchEnabled`**, and **`isDev`**. The layout handles:

- The document `<head>` with font CSS, hashed theme CSS via `cssPath`, and Pagefind assets when `searchEnabled` is true
- A top navigation header and optional Pagefind trigger
- Conditional rendering: home uses a single `<main>`; inner pages use the sidebar + `<main class="doc-main">` + aside grid
- A reusable `renderSidebarContent()` function defined inline so the desktop sidebar and mobile drawer stay identical

```ejs title="templates/layout.ejs (excerpt)"
<title><%= title %></title>
<% if (typeof cssPath !== 'undefined' && cssPath) { %>
<link rel="stylesheet" href="<%= cssPath %>" />
<% } %>
```

### `templates/article.ejs`

Renders guide and standalone markdown pages. Receives `content` (rendered HTML), `headings`, `date`, `readTime`, and `tags`. Includes a mobile table of contents using `<details>` and displays article metadata:

```ejs title="templates/article.ejs (excerpt)"
<article id="doc-main-content" tabindex="-1" data-pagefind-body>
  <div class="prose">
    <%- content %>
  </div>
</article>
```

### `templates/index.ejs` and `templates/about.ejs`

The home page template renders a hero section with feature cards and guide listings. The about template wraps markdown in an `<article data-pagefind-body>` so Pagefind indexes the about page the same way as guides.

### `client.js`

Vite client entry referenced from the built `index.html` / injected `jsPath`. Imports `src/theme.css` and `@pagesmith/site/runtime/content` for progressive markdown-related behavior, plus a small viewport tweak for Pagefind triggers. **Not** where routing or EJS runs — keep SSR logic in `entry-server.tsx`.

### `src/entry-server.tsx`

The heart of the rendering pipeline. This file uses `createContentLayer` to load content at build time, defines helper functions for sorting, grouping, and date formatting, then exports `getRoutes()` and `render()` functions that the SSG plugin calls. Each route is rendered by loading the appropriate EJS template, rendering it with `ejs.render()`, and wrapping the result in the layout template via `renderWithLayout()`.

### `content.config.mjs`

Defines two content collections -- `guide` and `pages` -- each backed by a directory of markdown files and validated with a Zod schema. The markdown showcase now lives at `content/guide/kitchen-sink.md`. Uses `.mjs` extension for plain ESM compatibility with `createContentLayer`.

### `src/theme.css`

A self-contained stylesheet providing CSS reset, design tokens, layout grid (header, sidebar, main, aside), prose typography, table of contents styles, search modal, and responsive breakpoints. The example maintains its own complete stylesheet.
