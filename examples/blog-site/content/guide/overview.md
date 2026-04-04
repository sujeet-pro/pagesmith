---
title: Overview
description: How the blog-site example differs from framework examples
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Overview

This example builds a static site using **@pagesmith/core** primitives directly -- no React, Solid, or Svelte. While the framework examples use the `pagesmithContent` Vite plugin with virtual modules, this example uses `createContentLayer` and `processMarkdown` to load and render content at build time.

## How it differs from framework examples

The React example uses three Vite plugins:

```ts title="with-react/vite.config.ts"
plugins: [
  sharedAssetsPlugin(),
  pagesmithContent({ collections }),
  ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
]
```

This example uses only two:

```ts title="blog-site/vite.config.ts"
plugins: [
  sharedAssetsPlugin(),
  ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
]
```

The `pagesmithContent` plugin is not used. Instead, `createContentLayer` loads collections directly in `entry-server.tsx`. Content is processed through `processMarkdown` -- the same pipeline that all framework examples use under the hood.

## Why use this approach?

- **No framework dependency** -- No React, Solid, or Svelte needed. The `@pagesmith/core` JSX runtime handles server-side rendering.
- **Direct API access** -- `createContentLayer` gives you full control over how content is loaded, sorted, and filtered.
- **Smaller footprint** -- Fewer dependencies, no framework-specific build configuration.
- **Same output** -- The generated HTML is structurally identical to the React example.
