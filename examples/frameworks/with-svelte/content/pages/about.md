---
title: About This Example
description: A Pagesmith + Svelte 5 integration example
---

# Pagesmith + Svelte 5

This example demonstrates how to build a static site using **`@pagesmith/site`** as the app-facing package for typed content collections, the Vite/SSG/runtime layer, and a **Svelte 5** rendering shell.

It showcases:

- Content collections with schema validation via Zod
- Virtual modules (`virtual:content/*`) for type-safe content access in the SSR entry
- Server-side rendering with Svelte's `render()` API from `svelte/server`
- The `pagesmithContent(...)` Vite plugin for content loading
- The `pagesmithSsg(...)` Vite plugin for route generation and Pagefind indexing
- Svelte 5 components using runes such as `$props()` and `$derived(...)`
- A base-path aware static output for GitHub Pages

The result is a fully static site with progressive enhancement: Svelte renders the HTML at build time, while the runtime script adds search and table-of-contents behavior in the browser.
