---
title: Installation
description: Setting up the Pagesmith Handlebars example
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Installation

This example is a **best-practice `@pagesmith/site` + Vite + Handlebars** static site: markdown collections validated at build time, SSR that returns HTML strings, and a thin browser entry for progressive enhancement. It does **not** use `@pagesmith/docs`; you own routing, templates, and layout.

## How the pieces connect

1. **`content.config.mjs`** — Declares collections (`guide`, `pages`) with `@pagesmith/site` Zod schemas. This file is imported by the SSR entry so the same definitions drive validation and loading. The markdown showcase now lives at `content/guide/kitchen-sink.md`.

2. **`createContentLayer`** — In `src/entry-server.tsx`, the entry builds a content layer from that config and `root`, then loads collections with `getCollection()` and renders markdown with `entry.render()`. There are no virtual `virtual:content/*` modules.

3. **SSR contract** — `pagesmithSsg` expects `getRoutes()` and `render()` exported from the entry module. You return a list of URL paths and a full HTML document per path. Handlebars compiles templates in that entry; nothing template-related ships to the client.

4. **Vite** — `vite.config.ts` wires `sharedAssetsPlugin()` and `...pagesmithSsg({ entry, contentDirs })`. Dev middleware calls `render()` for previews; production build walks routes and writes files, then runs Pagefind.

5. **Client** — `client.js` imports site CSS and `@pagesmith/site/runtime/content` for small runtime behaviors on top of already-generated HTML (see [Search integration](./search-integration) for Pagefind UI).

6. **Agent notes** — The example root includes `llms.txt` (repository path `examples/with-vanilla-hbs/llms.txt`) for a compact integration checklist. It is meant for tooling and clones, not linked from the generated site navigation.

## Dependencies

```json title="package.json (excerpt)"
{
  "dependencies": {
    "@pagesmith/site": "*",
    "handlebars": "^4.7.9",
    "pagefind": "^1.5.0"
  }
}
```

## Quick start

From the monorepo root:

```bash
git clone https://github.com/sujeet-pro/pagesmith.git
cd pagesmith
vp install
```

Run the dev server for **this** example:

```bash
vp run dev:eg:vanilla-hbs
```

That runs `npm run dev` in the workspace package (`vite dev`).

Production build from the repo root:

```bash
npm run build:eg:vanilla-hbs
```

Or from `examples/with-vanilla-hbs/`:

```bash
npm run build
```

Output is written to `gh-pages/examples/vanilla-hbs/` (see `build.outDir` in `vite.config.ts`).

## What the Vite plugins do

- **`pagesmithSsg`** — Invokes your SSR entry for route discovery and HTML generation, watches `contentDirs` in dev, and runs Pagefind after a production build.

- **`sharedAssetsPlugin`** — Copies shared assets (for example fonts) from `@pagesmith/site` into the build output.

Guide order in the sidebar comes from each file’s frontmatter (`series`, `seriesOrder`, `date`), grouped in `src/entry-server.tsx` — not from a separate meta file.
