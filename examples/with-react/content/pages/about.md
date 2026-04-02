---
title: About This Example
description: A Pagesmith + React integration example
---

# Pagesmith + React

This example demonstrates how to build a static site using **@pagesmith/core** with **React** as the rendering framework.

It showcases:

- Content collections with schema validation via Zod
- Virtual modules (`virtual:content/*`) for type-safe content access in the SSR entry
- Server-side rendering with `react-dom/server`
- The `pagesmithContent(...)` Vite plugin for content loading
- The `pagesmithSsg(...)` Vite plugin for route generation and Pagefind indexing
- A base-path aware static output for GitHub Pages

The result is a fully static site with progressive enhancement: React renders the HTML at build time, while the runtime script adds search, code-copy, and table-of-contents behavior in the browser.
