---
title: Vite Configuration
description: Configuring Vite plugins for Pagesmith
date: 2026-03-16
tags:
  - vite
  - config
series: Framework Integration
seriesOrder: 2
---

# Vite Configuration

The entire build is driven by Vite with two Pagesmith plugins. No custom build scripts, no webpack -- just a standard `vite.config.ts`.

## The full config

```ts title="vite.config.ts"
import { defineConfig } from 'vite-plus'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/pagesmith/examples/vanilla-hbs/',
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/vanilla-hbs',
    emptyOutDir: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: '@pagesmith/core',
    },
  },
})
```

## Plugin breakdown

### `sharedAssetsPlugin()`

Copies shared assets (fonts, icons) from `@pagesmith/core` into the build output. This ensures that font files referenced by CSS are available in production without manual copying.

### `pagesmithSsg({ entry, contentDirs })`

The SSG plugin handles static site generation. It accepts two key options:

- **`entry`** -- Path to the SSR entry file that exports `getRoutes()` and `render()`.
- **`contentDirs`** -- Directories to watch for content changes during development.

Note that `pagesmithSsg` returns an array of plugins (hence the spread `...`), which is why it is spread into the plugins array.

**In development**, it provides middleware that calls `render()` on each request, giving you live preview with hot reload when content or templates change.

**In production**, it:
1. Calls `getRoutes()` to discover all URLs
2. Calls `render()` for each URL in parallel
3. Writes the HTML files to the output directory
4. Runs Pagefind to index the generated pages and produce a search index

## No `pagesmithContent` plugin

Unlike the React or Solid examples, this config does not include `pagesmithContent`. The Handlebars example uses `createContentLayer` directly in the SSR entry instead of relying on virtual modules. This means:

- No `virtual:content/guide` imports -- content is loaded programmatically
- No auto-generated TypeScript declarations for virtual modules
- Full control over when and how content is loaded and cached

This is the simpler approach when your templates do not need framework-specific module imports.

## Base path

```ts
base: '/pagesmith/examples/vanilla-hbs/'
```

The `base` option configures the public URL prefix for all assets. This is passed through to the `render()` function via `config.base`, where it is used to prefix all internal links and asset references. This makes the site deployable under a subdirectory (e.g., GitHub Pages).

## JSX configuration

```ts
oxc: {
  jsx: {
    runtime: 'automatic',
    importSource: '@pagesmith/core',
  },
}
```

This configures the OXC transpiler to use `@pagesmith/core` as the JSX import source. Even though this example uses Handlebars for page templates, the SSR entry file uses `.tsx` extension for TypeScript support, and the JSX runtime is available if needed.

## Build output

```ts
build: {
  outDir: '../../gh-pages/examples/vanilla-hbs',
  emptyOutDir: true,
}
```

The output directory is set relative to the example directory, placing the built site into the workspace-level `gh-pages/` folder. The `emptyOutDir` flag ensures a clean build every time.
