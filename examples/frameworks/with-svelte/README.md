# Pagesmith + Svelte

Svelte-based static site using `@pagesmith/site` as the app-facing package for collections, Vite SSG, shared assets, and the shipped content/runtime layer.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/site` and `svelte`, then start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` for the content model, Vite wiring, and SSG flow.

Tell the agent to:

- define collections in `content.config.ts` with `@pagesmith/site`
- expose them through `pagesmithContent` from `@pagesmith/site/vite`
- wire `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`
- keep Svelte responsible for the page and layout components while Pagesmith owns content and SSG

## Quick Start

```bash
vp install
vp run dev:eg:svelte
```

## Key Files

- `content.config.ts` defines the `guide` and `pages` collections
- `vite.config.ts` wires `pagesmithContent`, `pagesmithSsg`, and shared assets
- `src/entry-server.ts` implements `getRoutes()` and `render()` for the SSG build
- `src/site.ts` and the Svelte components render the page body
- `client.js` and `src/runtime.ts` add the shared content runtime plus small site enhancements
- `content/guide/` includes the prose walkthrough and `guide/kitchen-sink.md`
- `llms.txt` is the compact AI map for this example; `llms-full.txt` is the fuller file-pointer variant

## What This Example Demonstrates

- Vite virtual content modules with `virtual:content/*`
- Svelte SSR without handing content ownership to Svelte
- static output plus Pagefind search
- the shared Pagesmith theme/runtime surfaces inside a Svelte site shell

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/svelte)
