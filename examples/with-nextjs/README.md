# Pagesmith + Next.js

A minimal Next.js App Router example that uses `@pagesmith/core` as the content layer and markdown renderer, while importing `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content` for the shared Pagesmith presentation layer.

This example does not use Pagesmith's Vite plugins, JSX runtime, CLI, or SSG helpers. Next.js keeps ownership of routing, layout, metadata, and static export.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/core`, `@pagesmith/site`, `next`, `react`, and `react-dom`, then start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`.

Tell the agent to:

- keep routing, layout, and build ownership in Next.js
- use `@pagesmith/core` for `defineCollection`, `createContentLayer()`, and `entry.render()`
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
- `llms.txt` is the compact AI map for this example

## What This Example Demonstrates

- the framework-hosted Pagesmith path instead of the Vite SSG path
- direct `createContentLayer()` usage in a Next.js app
- reusing Pagesmith's shipped markdown CSS/runtime without adopting its CLI
- static export that still participates in the repo's example build flow

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/nextjs)
