---
title: Installation
description: Setting up the Pagesmith EJS example
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Installation

This guide is **example-local**: it describes how to run and build `examples/with-vanilla-ejs/`. For general Markdown and package behavior, see the main Pagesmith documentation.

## Dependencies

**Content + build** — `@pagesmith/site` supplies the app-facing content layer, markdown pipeline, Vite plugins, and shared runtime/CSS used by this example. **EJS** renders templates at SSG time only. **Pagefind** is a dependency so the SSG plugin can index the generated HTML after `vite build`.

```json title="package.json (excerpt)"
{
  "dependencies": {
    "@pagesmith/site": "*",
    "ejs": "^5.0.1",
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

Run the dev server for this example:

```bash
vp run dev:eg:vanilla-ejs
```

Or from this directory:

```bash
cd examples/with-vanilla-ejs
npm run dev
```

Production build (static HTML + Pagefind index):

```bash
cd examples/with-vanilla-ejs
npm run build
```

Output goes to `../../../gh-pages/examples/vanilla-ejs/` as configured in `vite.config.ts`.

## What the Vite plugins do

1. **`sharedAssetsPlugin`** — Copies shared assets (for example fonts) from `@pagesmith/site` into the build output.
2. **`pagesmithSsg`** — Dev: SSR middleware calling `render()` from `src/entry-server.tsx`. Production: runs `getRoutes` / `render`, writes HTML, then runs Pagefind.

This example does **not** use `pagesmithContent` virtual modules. The SSR entry imports `content.config.mjs` and calls `createContentLayer()` from `@pagesmith/site` directly so templates stay decoupled from any framework loader.
