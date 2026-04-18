---
title: "Rendering Markdown in Next.js"
description: "A minimal App Router page sourced from a local Pagesmith collection."
date: 2026-04-13
tags: [nextjs, pagesmith, core]
---

# Rendering Markdown in Next.js

This page lives in `content/posts/hello-pagesmith.md`, is loaded through `createContentLayer()`, and is rendered by a normal Next.js App Router route.

## Why this example exists

- Keep content loading and validation on `@pagesmith/site`
- Let Next.js own routing, layout, metadata, and deployment
- Reuse Pagesmith's shared markdown presentation and code-block behavior without adopting the Pagesmith Vite toolchain

## Minimal content loader

```js title="lib/content.js"
import { createContentLayer, defineConfig } from "@pagesmith/site";
import collections from "../content.config.js";

const layer = createContentLayer(
  defineConfig({
    root: process.cwd(),
    collections,
  }),
);
```

## Rendering inside a route

```jsx title="app/posts/[slug]/page.js"
<div className="prose article-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
```

The route never calls `processMarkdown()` directly. It asks the collection entry to render itself, which keeps headings, read time, code-block metadata, and shared markdown behavior aligned with the rest of Pagesmith.

> [!TIP]
> Prefer `entry.render()` over hand-rolled markdown conversion when your content already lives in a Pagesmith collection.
