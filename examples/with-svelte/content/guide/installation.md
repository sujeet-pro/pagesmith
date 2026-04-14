---
title: Installation
description: Setting up the Pagesmith Svelte example
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Installation

This guide walks through a static site that uses **Svelte** only on the server (`svelte/server`) and **`@pagesmith/site`** as the app-facing package for collections, markdown processing, and the Vite/SSG/runtime layer.

## Dependencies

**Runtime / build-time packages** (see `package.json` in this folder for exact versions):

```json title="package.json (excerpt)"
{
  "dependencies": {
    "@pagesmith/site": "*",
    "pagefind": "^1.5.0",
    "svelte": "^5.55.1"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^7.0.0",
    "typescript": "^6.0.2",
    "vite": "^8.0.3",
    "vite-plus": "0.1.16"
  }
}
```

- **`@pagesmith/site`** — collection definitions, schemas, markdown processing, `pagesmithContent` / `pagesmithSsg`, `renderDocumentShell`, and the shared runtime/CSS layer.
- **`svelte`** — `render` from `svelte/server` at SSG time only.
- **`pagefind`** — indexer dependency for the SSG plugin’s post-build step.
- **`vite` + `vite-plus` + `@sveltejs/vite-plugin-svelte`** — dev server and Svelte compilation.

## Quick start

From the monorepo root:

```bash
git clone https://github.com/sujeet-pro/pagesmith.git
cd pagesmith
vp install
```

Run this example:

```bash
vp run dev:eg:svelte
```

Production build:

```bash
cd examples/with-svelte
npm run build
```

Output goes to `../../gh-pages/examples/svelte/` per `vite.config.ts`.

## Vite plugins

1. **`pagesmithContent`** — markdown → validated entries → `virtual:content/*`.
2. **`pagesmithSsg`** — `getRoutes` / `render`, dev middleware, Pagefind after build.
3. **`sharedAssetsPlugin`** — shared fonts/assets from `@pagesmith/site` into the output.
