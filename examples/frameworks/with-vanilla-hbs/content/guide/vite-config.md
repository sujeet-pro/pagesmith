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

Vite is the only build driver: `vite dev` for local preview and `vite build` for static output. Pagesmith supplies Vite plugins from `@pagesmith/site/vite`; there is no separate Node CLI step for HTML in this example.

## Full config

```ts title="vite.config.ts"
import { defineConfig } from "vite-plus";
import { pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";

export default defineConfig({
  base: "/pagesmith/examples/vanilla-hbs",
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: "./src/entry-server.tsx", contentDirs: ["./content"] }),
  ],
  build: {
    outDir: "../../../gh-pages/examples/vanilla-hbs",
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
      importSource: "@pagesmith/site",
    },
  },
});
```

## Plugins

### `sharedAssetsPlugin()`

Copies assets such as fonts shipped with `@pagesmith/site` so CSS `url()` references resolve in the built folder.

### `pagesmithSsg({ entry, contentDirs })`

Spread into `plugins` because it returns an array. Wires dev middleware to your `render()` export, runs `getRoutes` + `render` for production HTML, and invokes Pagefind after the HTML pass.

**No `pagesmithContent` here** — the Handlebars entry never imports `virtual:content/*`. It uses `createContentLayer` instead, which fits a non-framework template pipeline.

## `base` and `outDir`

`base` is the public URL prefix for assets and in-app links; the SSR entry receives the same value via `SsgRenderConfig` to prefix internal links.

`outDir` points at the workspace `gh-pages` tree so this example can deploy next to other demos.

## JSX / `.tsx` entry

The SSR file uses `.tsx` and sets `importSource: '@pagesmith/site'` so JSX pragma is available if you add JSX-based helpers later. Handlebars remains the page template system.
