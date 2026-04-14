---
title: Search Integration
description: How Pagefind fits this Solid SSG example — build-time indexing, UI wiring, and dev vs production.
date: 2026-03-15
tags:
  - search
  - pagefind
series: Framework Integration
seriesOrder: 3
---

# Search Integration

Search uses [Pagefind](https://pagefind.app/) with **Component UI** web components. The `pagesmithSsg` plugin runs Pagefind’s indexer **after** static HTML is written on `vite build`, producing a `pagefind/` directory next to the site output.

## What gets indexed

Pagefind walks the generated HTML and indexes content inside elements with `data-pagefind-body`. In `src/entry-server.tsx` this example sets that attribute in two places, matching the layout:

- **Home** — on the primary `<main class="doc-home" …>` (hero + listings live inside that main).
- **Guide and standalone pages** — on the inner `<article …>` inside `<main class="doc-main">`, so chrome such as the desktop TOC aside and outer main wrapper stay outside the indexed subtree unless you move the attribute.

Navigation, header, footer, and the sidebar dialog markup are outside those nodes, so they do not dominate search snippets.

## Component UI wiring

When `config.searchEnabled` is true, `renderDocument()` adds the Component UI stylesheet and module in `<head>`, and appends the `<pagefind-modal>…</pagefind-modal>` tree before `</body>`. The header renders `<pagefind-modal-trigger>` only in that mode (`SearchTrigger` inside `SiteHeader`).

Opening the modal, **Cmd+K** / **Ctrl+K**, and result rendering are handled by Pagefind’s scripts — `src/runtime.ts` only adjusts trigger layout on small viewports and does not bootstrap search itself.

## Development vs production

Behavior comes from `@pagesmith/site`’s SSG integration:

- **`vite build`** — `render()` receives `searchEnabled: true`. The HTML includes Pagefind tags, and the plugin runs the indexer on the output directory, so `pagefind/` exists for `vite preview` or static hosting.
- **`vite dev`** — the dev middleware calls `render()` with **`searchEnabled: false`**, so Pagefind link/script tags and the modal markup are **not** emitted. There is nothing to index in dev, and the UI would point at assets that are only guaranteed after a build.

So: treat search as a **production-build** feature; use `npm run build` (or the monorepo’s example build) plus preview or deploy to verify search end-to-end.
