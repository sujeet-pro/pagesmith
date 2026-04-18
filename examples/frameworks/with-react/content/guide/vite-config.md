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

The build is standard Vite (`vite-plus` here) plus three **`@pagesmith/site/vite`** plugins. Collections are the only Pagesmith-specific input besides the SSG entry path.

## Full config (as in this repo)

```ts title="vite.config.ts"
import { defineConfig } from "vite-plus";
import collections from "./content.config";
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";

export default defineConfig({
  base: "/pagesmith/examples/react",
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: "./src/entry-server.tsx", contentDirs: ["./content"] }),
  ],
  build: {
    outDir: "../../../gh-pages/examples/react",
    emptyOutDir: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react",
    },
  },
});
```

## Plugin breakdown

### `sharedAssetsPlugin()`

Copies shared assets from **`@pagesmith/site`** (e.g. fonts) into the build output so CSS references resolve in production.

### `pagesmithContent({ collections })`

1. Runs each markdown file through the core pipeline and extracts headings.
2. Validates frontmatter with the Zod schema for that collection.
3. Registers **`virtual:content/guide`** and **`virtual:content/pages`** (keys mirror `defineCollections`).
4. Regenerates **`src/pagesmith-content.d.ts`** for TypeScript.

### `pagesmithSsg({ entry, contentDirs })`

Spread into `plugins` because it returns an array.

- **Dev** — Middleware serves **`render()`** output and watches **`contentDirs`** for reload.
- **Build** — Calls **`getRoutes()`**, **`render()`** per URL, writes HTML, then runs **Pagefind** over the output.

## Base path

`base` must match how the site is hosted (path prefix for assets and internal links). `SsgRenderConfig.base` mirrors this inside **`render()`**.

## JSX

`oxc.jsx.importSource: 'react'` enables the automatic JSX runtime for **`src/entry-server.tsx`** without importing React in every file.

## Output directory

`build.outDir` points at the workspace **`gh-pages/examples/react`** folder for the live demo; **`emptyOutDir`** keeps builds clean.
