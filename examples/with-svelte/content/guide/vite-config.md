---
title: Vite Configuration
description: Configuring Vite plugins for Pagesmith with Svelte
date: 2026-03-16
tags:
  - vite
  - config
series: Framework Integration
seriesOrder: 2
---

# Vite Configuration

The entire build is driven by Vite with three Pagesmith plugins and one Svelte plugin. No custom build scripts, no webpack -- just a standard `vite.config.ts`.

## The full config

```ts title="vite.config.ts"
import { defineConfig } from 'vite-plus'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import collections from './content.config'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/pagesmith/examples/svelte/',
  plugins: [
    sharedAssetsPlugin(),
    svelte(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.ts', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/svelte',
    emptyOutDir: true,
  },
})
```

## Plugin breakdown

### `sharedAssetsPlugin()`

Copies shared assets (fonts, icons) from `@pagesmith/core` into the build output. This ensures that font files referenced by CSS are available in production without manual copying.

### `svelte()`

The Svelte Vite plugin compiles `.svelte` files into JavaScript. It reads its configuration from `svelte.config.js`, which sets up `vitePreprocess` for TypeScript support in Svelte components:

```js title="svelte.config.js"
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
```

Since the site is fully static with no client-side hydration, the Svelte plugin compiles components for server-side rendering only.

### `pagesmithContent({ collections })`

The content plugin takes the collections object exported from `content.config.ts` and does three things:

1. **Processes markdown** -- Runs each `.md` file through the unified pipeline (remark, rehype, Expressive Code for syntax highlighting) and extracts headings.
2. **Validates frontmatter** -- Checks every file's YAML frontmatter against the collection's Zod schema. Build fails on validation errors.
3. **Creates virtual modules** -- Registers `virtual:content/guide`, `virtual:content/features`, and `virtual:content/pages` so your rendering code can import content directly.

It also generates `src/pagesmith-content.d.ts` with TypeScript declarations for those virtual modules.

### `pagesmithSsg({ entry, contentDirs })`

The SSG plugin handles static site generation. It accepts two key options:

- **`entry`** -- Path to the SSR entry file that exports `getRoutes()` and `render()`. Note the `.ts` extension (not `.tsx`) since Svelte uses `.svelte` files instead of JSX.
- **`contentDirs`** -- Directories to watch for content changes during development.

Note that `pagesmithSsg` returns an array of plugins (hence the spread `...`), which is why it is spread into the plugins array.

**In development**, it provides middleware that calls `render()` on each request, giving you live preview with hot reload when content or templates change.

**In production**, it:
1. Calls `getRoutes()` to discover all URLs
2. Calls `render()` for each URL in parallel
3. Writes the HTML files to the output directory
4. Runs Pagefind to index the generated pages and produce a search index

## Base path

```ts
base: '/pagesmith/examples/svelte/'
```

The `base` option configures the public URL prefix for all assets. This is passed through to the `render()` function via `config.base`, where it is used to prefix all internal links and asset references. This makes the site deployable under a subdirectory (e.g., GitHub Pages).

## Build output

```ts
build: {
  outDir: '../../gh-pages/examples/svelte',
  emptyOutDir: true,
}
```

The output directory is set relative to the example directory, placing the built site into the workspace-level `gh-pages/` folder. The `emptyOutDir` flag ensures a clean build every time.
