---
title: Installation
description: Dependencies and scripts for the Pagesmith + Solid example
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Installation

This example is a **static site**: Solid runs at build time via `renderToString`; the browser loads a small bundle from `client.js` (see the [layouts guide](./layouts-and-rendering)).

## Dependencies

- **`@pagesmith/site`** — the app-facing collection APIs, Zod-backed schemas, markdown pipeline, `pagesmithContent` / `pagesmithSsg` Vite plugins, and shared assets/runtime behavior used by this example.
- **`solid-js`** — SSR JSX only in `src/entry-server.tsx`.
- **`pagefind`** — CLI dependency used by `pagesmithSsg` when indexing the **production** build output (search UI is omitted in dev; see [search integration](./search-integration)).

Dev tooling includes `vite-plugin-solid`, `vite-plus`, and `typescript`. See `package.json` for pinned versions.

## Commands

From the monorepo root:

```bash
vp install
vp run dev:eg:solid
```

From this directory:

```bash
npm run dev    # vite dev — SSR preview, no Pagefind UI
npm run build  # static HTML + assets + Pagefind index
```

Build output goes to `../../../gh-pages/examples/solid` per `vite.config.ts`.

## Agent-oriented notes

This directory includes **`llms.txt`** — short, example-local guidance for tools working on the `@pagesmith/site` + Solid integration (virtual modules, SSG contract, Pagefind, client split).
