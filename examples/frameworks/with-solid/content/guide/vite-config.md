---
title: Vite Configuration
description: Vite plugins for Pagesmith content, Solid SSR, and static generation in this example.
date: 2026-03-16
tags:
  - vite
  - config
series: Framework Integration
seriesOrder: 2
---

# Vite Configuration

The build is a normal Vite project: `vite.config.ts` registers shared assets, Solid with SSR, `pagesmithContent`, and the spread `pagesmithSsg` plugin array.

## Current config

```ts title="vite.config.ts"
import { defineConfig } from "vite-plus";
import collections from "./content.config";
import solid from "vite-plugin-solid";
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";

export default defineConfig({
  base: "/pagesmith/examples/solid",
  plugins: [
    sharedAssetsPlugin(),
    solid({ ssr: true }),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: "./src/entry-server.tsx", contentDirs: ["./content"] }),
  ],
  build: {
    outDir: "../../../gh-pages/examples/solid",
    emptyOutDir: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
});
```

## Plugin roles

- **`sharedAssetsPlugin()`** — copies shared assets (for example bundled fonts) referenced from CSS into the output so production paths resolve.
- **`solid({ ssr: true })`** — compiles JSX in `src/entry-server.tsx` for **server** output (`renderToString`), not hydration.
- **`pagesmithContent({ collections })`** — reads `content.config.ts`, validates frontmatter, runs the markdown pipeline, and registers **`virtual:content/<collection>`** modules consumed by the entry.
- **`...pagesmithSsg({ entry, contentDirs })`** — dev middleware that SSR-renders requests, and the production pipeline that calls `getRoutes` / `render`, writes HTML, and runs Pagefind. `contentDirs` is what Vite watches for markdown HMR.

## `base` and `outDir`

`base` is the public path prefix for GitHub Pages (`config.base` in `render()` prefixes internal links). `outDir` points at the monorepo’s `gh-pages/examples/solid` tree so this example can be deployed alongside other demos.
