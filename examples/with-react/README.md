# Pagesmith + React

React-based static site using `@pagesmith/core` for collections and markdown, plus `@pagesmith/site` for Vite SSG, shared assets, and the shipped content runtime.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/core`, `@pagesmith/site`, `react`, and `react-dom`, then start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`.

Tell the agent to:

- define collections in `content.config.ts`
- expose them through `pagesmithContent` from `@pagesmith/core/vite`
- wire `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`
- keep React responsible for the page and layout components only

## Quick Start

```bash
vp install
vp run dev:eg:react
```

## Key Files

- `content.config.ts` defines the `guide` and `pages` collections with Zod schemas
- `vite.config.ts` wires `pagesmithContent`, `pagesmithSsg`, and shared assets
- `src/entry-server.tsx` renders the site with React SSR
- `client.js` and `src/runtime.ts` add the shared content runtime plus a few site enhancements
- `content/guide/` includes the prose walkthrough and `guide/kitchen-sink.md`
- `llms.txt` is the compact AI map for this example; `llms-full.txt` is the fuller file-pointer variant

## What This Example Demonstrates

- Vite virtual content modules with `virtual:content/*`
- React SSR without handing content ownership to React itself
- static output plus Pagefind search
- Pagesmith theme and content runtime integration in a React site shell

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/react)
