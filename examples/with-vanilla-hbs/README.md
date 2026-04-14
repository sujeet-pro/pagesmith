# Pagesmith + Handlebars

Handlebars-based static site using `@pagesmith/site` as the app-facing package for collections, direct `createContentLayer()` rendering, Vite SSG, shared assets, and the shipped content/runtime layer. It keeps templating on Handlebars instead of moving to a framework component model.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/site`, `handlebars`, and your Vite tooling, then start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` for the content model, direct rendering helpers, and Vite/SSG flow.

Tell the agent to:

- keep collections and markdown rendering on `@pagesmith/site`
- use `createContentLayer()` directly in the SSR entry instead of `virtual:content/*`
- wire `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`
- keep HTML layout ownership in `templates/*.hbs`

## Quick Start

```bash
vp install
vp run dev:eg:vanilla-hbs
```

## Key Files

- `content.config.mjs` defines the `guide` and `pages` collections
- `src/entry-server.tsx` loads content, computes routes, and renders the Handlebars templates
- `templates/` owns the HTML shell and page fragments
- `vite.config.ts` wires `pagesmithSsg`, shared assets, and content-directory watching
- `client.js` adds the shared content runtime plus small site enhancements
- `content/guide/` includes the prose walkthrough and `guide/kitchen-sink.md`
- `llms.txt` is the compact AI map for this example; `llms-full.txt` is the fuller file-pointer variant

## What This Example Demonstrates

- direct `createContentLayer()` usage without virtual content modules
- Handlebars layouts on top of Pagesmith's content and SSG flow
- static output plus Pagefind search
- a template-engine integration that still reuses Pagesmith CSS/runtime surfaces

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/vanilla-hbs)
