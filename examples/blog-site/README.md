# Pagesmith Blog Site

A custom static site that uses `@pagesmith/site` as the app-facing package. It does not use React, Solid, Svelte, or a template engine. Instead, the SSR entry renders with `@pagesmith/site/jsx-runtime`, calls `createContentLayer()` directly, and lets `pagesmithSsg` handle dev/build/preview behavior.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/site`, then start with `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`.

Tell the agent to:

- keep both content-layer and site-building imports on `@pagesmith/site` so one package covers the whole stack
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
- `src/content.ts` defines collections and the content layer; `src/components.tsx` provides JSX components; `src/entry-server.tsx` implements `getRoutes()` and `render()`
- `client.js` and `src/runtime.ts` add the shared standalone runtime plus one small site-specific enhancement
- `content/guide/` explains the setup and includes `guide/kitchen-sink.md` for markdown regression coverage
- `llms.txt` is the compact AI map for this example; `llms-full.txt` is the fuller file-pointer variant

## When To Use This Shape

- You want a custom Pagesmith site without adopting a framework runtime
- You want direct control over `createContentLayer()` and `entry.render()`
- You still want Pagesmith's shared CSS/runtime and Vite SSG helpers

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/blog-site)
