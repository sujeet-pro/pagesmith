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
examples/with-vanilla-ejs/
  content/
    features/           Markdown articles for the features collection
    guide/              Markdown articles for the guide collection (this section)
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
```

## Key files explained

### `templates/layout.ejs`

The main HTML shell that wraps every page. It receives variables like `title`, `basePath`, `css`, `body`, `sidebar`, `activePath`, and `isHome`. The layout handles:

- The document `<head>` with inlined CSS, font references, and Pagefind assets
- A top navigation header with search trigger
- Conditional rendering: home pages get a single-column layout, while article pages get a three-column layout with sidebar and table of contents
- A reusable `renderSidebarContent()` function defined inline to render navigation in both the desktop sidebar and the mobile drawer

EJS uses `<%= %>` for escaped output and `<%- %>` for unescaped HTML (used for the body content and CSS):

```ejs title="templates/layout.ejs (excerpt)"
<title><%= title %></title>
<style><%- css %></style>
```

### `templates/article.ejs`

Renders guide and feature pages. Receives `content` (rendered HTML), `headings`, `date`, `readTime`, and `tags`. Includes a mobile table of contents using `<details>` and displays article metadata:

```ejs title="templates/article.ejs (excerpt)"
<div class="prose">
  <%- content %>
</div>
```

### `templates/index.ejs` and `templates/about.ejs`

The home page template renders a hero section with feature cards and guide listings. The about template is minimal -- just a prose wrapper around the rendered markdown content.

### `src/entry-server.tsx`

The heart of the rendering pipeline. This file uses `createContentLayer` to load content at build time, defines helper functions for sorting, grouping, and date formatting, then exports `getRoutes()` and `render()` functions that the SSG plugin calls. Each route is rendered by loading the appropriate EJS template, rendering it with `ejs.render()`, and wrapping the result in the layout template via `renderWithLayout()`.

### `content.config.mjs`

Defines three content collections -- `guide`, `features`, and `pages` -- each backed by a directory of markdown files and validated with a Zod schema. Uses `.mjs` extension for plain ESM compatibility with `createContentLayer`.

### `src/theme.css`

A self-contained stylesheet providing CSS reset, design tokens, layout grid (header, sidebar, main, aside), prose typography, table of contents styles, search modal, and responsive breakpoints. The example maintains its own complete stylesheet.
