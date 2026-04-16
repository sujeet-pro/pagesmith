---
title: Project Structure
description: How files and directories are organized in the Next.js + Pagesmith example
date: 2026-03-20
tags:
  - architecture
---

# Project Structure

```text
with-nextjs/
  app/
    layout.js           Root layout — imports Pagesmith CSS + runtime
    page.js             Home page — lists all posts
    not-found.js        404 page
    globals.css         App-specific styles
    posts/
      [slug]/
        page.js         Dynamic post route — renders markdown HTML
  content/
    posts/              Markdown content managed by Pagesmith
      hello-pagesmith.md
      kitchen-sink.md
    guide/              Guide content explaining this example
  lib/
    content.js          Content layer factory + render helpers
  content.config.js     Collection definitions and Zod schemas
  next.config.mjs       Next.js configuration
```

## Key Separation

- **`app/`** — standard Next.js App Router. Owns routing, layout, metadata, and React rendering.
- **`content/`** — filesystem-first content managed by Pagesmith's content layer.
- **`lib/content.js`** — the bridge between Next.js and Pagesmith. Creates a `ContentLayer`, fetches entries, and renders markdown.
- **`content.config.js`** — defines collections and Zod schemas. This file is the single source of truth for content structure.

## No Build-Time Coupling

Next.js does not know about Pagesmith at build time. The content layer is a runtime dependency used inside `getStaticProps`-equivalent patterns (server components with static export). This means you can swap Pagesmith for any other content source without changing your Next.js routing.
