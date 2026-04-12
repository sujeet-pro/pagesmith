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

The build is standard Vite (`vite-plus`) plus Svelte and Pagesmith plugins.

## Full config

```ts title="vite.config.ts"
import { defineConfig } from 'vite-plus'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import collections from './content.config'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/pagesmith/examples/svelte',
  plugins: [
    sharedAssetsPlugin(),
    svelte(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.ts', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/svelte',
    emptyOutDir: true,
    rolldownOptions: { checks: { pluginTimings: false } },
  },
})
```

## Plugins

### `sharedAssetsPlugin()`

Copies shared assets (e.g. fonts) from `@pagesmith/core` into the build output so CSS `url()` references resolve in production.

### `svelte()`

Compiles `.svelte` for the **Node** SSG bundle (driven by `pagesmithSsg`). Preprocessors come from `svelte.config.js` (`vitePreprocess`).

### `pagesmithContent({ collections })`

- Loads `content.config.ts` collections.
- Validates frontmatter with Zod.
- Emits `virtual:content/<collection>` and regenerates `src/pagesmith-content.d.ts`.

### `pagesmithSsg({ entry, contentDirs })`

Spread into `plugins` because it returns an **array** of plugin objects. It wires `getRoutes`/`render`, dev preview middleware, HTML emission, and post-build Pagefind indexing. `contentDirs` is used for watch/rebuild during dev.

## `base` and `outDir`

`base` is passed through to `SsgRenderConfig` so `render()` can prefix internal URLs for subdirectory hosting. `outDir` targets the workspace `gh-pages` tree for the published demo.
