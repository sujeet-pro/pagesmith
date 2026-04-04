---
title: About This Example
description: A Pagesmith + Core JSX integration example
---

# Pagesmith + Core JSX

This example demonstrates how to build a static site using **@pagesmith/core** directly -- no framework required. It uses the core JSX runtime for server-side rendering instead of React, Solid, or Svelte.

It showcases:

- Content loading via `createContentLayer` and `processMarkdown` directly
- Server-side rendering with `@pagesmith/core/jsx-runtime` (`h()`, `Fragment`, `HtmlString`)
- The `pagesmithSsg(...)` Vite plugin for route generation and Pagefind indexing
- CSS built from `@pagesmith/core/css/content` plus custom layout styles
- No virtual modules -- collections are loaded via the `createContentLayer` API

The result is a fully static site with progressive enhancement: the core JSX runtime renders HTML at build time, while a small vanilla JS runtime adds search and table-of-contents behavior in the browser.
