# Pagesmith + Next.js

A minimal Next.js App Router example that keeps Next.js in charge of routing/build while using `@pagesmith/site` as the app-facing Pagesmith package for content loading plus shared presentation/runtime imports.

This example does not use Pagesmith's Vite plugins, JSX runtime, CLI, or SSG helpers. Next.js keeps ownership of routing, layout, metadata, and static export.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/site`, `next`, `react`, and `react-dom`, then start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` and keep Next.js responsible for routing, layout, metadata, and export.

Tell the agent to:

- keep routing, layout, and build ownership in Next.js
- use `@pagesmith/site` for `defineCollection`, `createContentLayer()`, and `entry.render()`
- import only the shared CSS/runtime pieces from `@pagesmith/site`
- avoid introducing `pagesmith-site` or `pagesmith-docs` unless the architecture changes

## Quick Start

```bash
vp install
npm run dev:eg:nextjs
```

## Key Files

- `content.config.js` defines the `posts` collection and frontmatter schema
- `lib/content.js` creates the content layer and renders markdown for Next routes
- `app/layout.js` imports `@pagesmith/site/css/content` and mounts the content runtime once
- `app/posts/[slug]/page.js` renders the HTML returned by `entry.render()`
- `next.config.mjs` keeps static export and base-path handling in Next.js
- `llms.txt` is the compact AI map for this example; `llms-full.txt` is the fuller file-pointer variant

## What This Example Demonstrates

- the framework-hosted Pagesmith path instead of the Vite SSG path
- direct `createContentLayer()` usage from `@pagesmith/site` inside a Next.js app
- reusing Pagesmith's shipped markdown CSS/runtime without adopting its CLI
- static export that still participates in the repo's example build flow

## Why `@pagesmith/site` in a framework host?

This example keeps routing, layout, and export explicit in Next.js while still using `@pagesmith/site` as the single Pagesmith import surface. The shared content CSS (`@pagesmith/site/css/content`) and runtime JS (`@pagesmith/site/runtime/content`) still come from the same package that owns `defineCollection`, `createContentLayer()`, and the markdown pipeline.

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/nextjs)
