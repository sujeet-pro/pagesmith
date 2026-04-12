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

Content, SSR TypeScript, and Handlebars templates are separated so each layer has one job.

## Directory overview

```text
examples/with-vanilla-hbs/
  content/
    guide/              Markdown for the guide collection, including `kitchen-sink.md`
    pages/              Standalone pages (about)
  public/
    favicon.svg         Copied to the site root by Vite
  templates/
    layout.hbs          HTML shell, sidebar chrome, Pagefind UI
    article.hbs         Guide + standalone markdown article body
    index.hbs           Home body (still uses layout partial)
    about.hbs           About page body
  src/
    entry-server.tsx    createContentLayer, routing, Handlebars render
    theme.css           Site styles
  client.js             Browser entry (CSS + core runtime)
  content.config.mjs    Collection definitions (Zod)
  vite.config.ts        Vite + pagesmithSsg
  llms.txt              Agent-oriented integration notes (not part of the build graph)
  package.json
  tsconfig.json
```

## Key files

### `templates/layout.hbs`

Shell shared by every page: head, header, sidebar, footer, Pagefind modal, theme scripts. The home branch wraps the home body in a `doc-home-content` container (this is where `data-pagefind-body` lives for the index route). Inner pages use a `doc-layout` grid: sidebar column, `<main class="doc-main">` for `{{> body}}`, then aside for TOC. Article-specific `data-pagefind-body` is on the `<article>` in `article.hbs` / `about.hbs`, not on that outer `<main>`.

### `templates/article.hbs` / `about.hbs`

Partial-block wrappers around `{{{content}}}`. They define the inline `body` partial consumed by `layout.hbs`.

### `src/entry-server.tsx`

Imports `content.config.mjs`, constructs the content layer, sorts and groups entries, registers Handlebars helpers and the layout partial, compiles page templates, implements `getRoutes` / `render`.

### `content.config.mjs`

Plain ESM so the SSR bundle can import collection definitions without compiling the config through a separate step.

### `client.js`

Imports `src/theme.css` and `@pagesmith/core/runtime/content`. It does not render templates; it layers behavior on generated HTML.

### `vite.config.ts`

`pagesmithSsg` entry points at `src/entry-server.tsx` and watches `./content` for dev reloads.
