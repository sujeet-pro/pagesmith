---
title: About This Example
description: A Pagesmith custom-site integration using @pagesmith/site
---

# Pagesmith + Built-In JSX Runtime

This example builds a static site with no UI framework. The SSR entry uses **`createContentLayer`** and, for each Markdown file, **`await entry.render()`** to produce HTML, headings, and read time. The site shell is rendered with **`@pagesmith/site/jsx-runtime`**, and the same package also re-exports the content-layer APIs used by the example.

It showcases:

- Content loading through **`createContentLayer`** and per-entry **`entry.render()`** (not hand-rolled `processMarkdown` in application code)
- Server-side rendering with `@pagesmith/site/jsx-runtime` (`h()`, `Fragment`, `innerHTML`)
- The `pagesmithSsg(...)` Vite plugin for route generation and Pagefind indexing
- CSS built from `@pagesmith/site/css/standalone` plus custom layout styles in `src/theme.css`
- No virtual modules — collections are configured in `src/content.ts`

The result is a fully static site with progressive enhancement: JSX emits HTML during SSG, the shared standalone runtime handles the site chrome behavior in the browser, and the example adds one tiny sidebar auto-scroll enhancement of its own.
