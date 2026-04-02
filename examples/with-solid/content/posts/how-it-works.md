---
title: How It Works
description: The Vite+ and Pagesmith SSG pipeline explained
date: 2026-03-10
tags: ["architecture", "ssr"]
order: 2
---

## The build pipeline

`vp build` produces the Solid example in three layers:

1. **Client assets** — Vite+ emits the shared CSS bundle plus the lightweight runtime script used for search, code-copy, and table-of-contents behavior.
2. **SSR bundle** — `pagesmithSsg(...)` asks Vite+ to compile `src/entry-server.tsx` for the server. That file imports `virtual:content/*` modules and uses `renderToString` from `solid-js/web`.
3. **Static generation** — Pagesmith calls `getRoutes()` and `render(url, config)` from the SSR bundle, writes one HTML file per route, copies content assets, and then runs Pagefind.

## Route generation

Routes are derived directly from the loaded collections. The server entry turns the guide, blog, and page collections into URLs, which means new markdown files automatically create new pages without a separate routing table.

## Base URL handling

The server entry normalizes incoming URLs against the configured `base` path, and the final HTML uses that same base for stylesheet, script, favicon, and Pagefind links. That keeps the example deployable under `/pagesmith/examples/solid/` on GitHub Pages.
