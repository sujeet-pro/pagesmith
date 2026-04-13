# Pagesmith Blog Site

A custom static site that keeps the content layer on `@pagesmith/core` and the site shell on `@pagesmith/site`. It does not use React, Solid, Svelte, or a template engine. Instead, the SSR entry renders with `@pagesmith/site/jsx-runtime`, calls `createContentLayer()` directly, and lets `pagesmithSsg` handle dev/build/preview behavior.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/core` and `@pagesmith/site`, then start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`.

Tell the agent to:

- keep collections, schemas, and markdown rendering on `@pagesmith/core`
- use `createContentLayer()` directly in the SSR entry instead of `virtual:content/*`
- wire `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`
- use `@pagesmith/site/jsx-runtime` for the HTML shell

## Quick Start

```bash
vp install
vp run dev:eg:blog-site
```

## Key Files

- `vite.config.ts` wires `pagesmithSsg` and `sharedAssetsPlugin`
- `src/entry-server.tsx` defines the collections inline and implements `getRoutes()` plus `render()`
- `client.js` and `src/runtime.ts` add the shared content runtime plus small site-specific enhancements
- `content/guide/` explains the setup and includes `guide/kitchen-sink.md` for markdown regression coverage
- `llms.txt` is the compact AI map for this example; `llms-full.txt` is the fuller file-pointer variant

## When To Use This Shape

- You want a custom Pagesmith site without adopting a framework runtime
- You want direct control over `createContentLayer()` and `entry.render()`
- You still want Pagesmith's shared CSS/runtime and Vite SSG helpers

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/blog-site)
