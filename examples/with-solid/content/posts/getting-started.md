---
title: Getting Started
description: Set up a Pagesmith site with SolidJS from scratch
date: 2026-03-01
tags: ["setup", "solid"]
order: 1
---

## Prerequisites

You need Node.js 18+ and a package manager. This example uses `vite-plus` as the build tool, which is a Vite-compatible wrapper used throughout Pagesmith.

## Install dependencies

Start with these packages:

- **@pagesmith/core** — the content layer, markdown pipeline, Zod re-export, and the Vite content plugin
- **solid-js** — the SolidJS runtime
- **vite-plugin-solid** — Vite plugin that compiles `.tsx` files through Solid's JSX transform
- **vite-plus** — the Vite-compatible build tool used in this project

## Define your content collections

Create a `content.config.mjs` at the project root. This file uses `defineCollection` and `z` (Zod) from `@pagesmith/core` to declare typed collections. Each collection points to a directory of markdown files and defines a schema for frontmatter validation. The `posts` collection here expects `title`, `date`, and optional `tags`; the `pages` collection expects `title` and an optional `description`.

## Configure Vite

The `vite.config.ts` file loads two plugins:

1. **pagesmithContent** from `@pagesmith/core/vite` — this plugin reads your `content.config.ts`, processes all markdown files at build time, and exposes them as virtual modules like `virtual:content/blog`.
2. **vite-plugin-solid** — this compiles the SolidJS JSX used in `src/entry-server.tsx`.
3. **pagesmithSsg** — this builds routes from the server entry, copies assets from `content/`, and runs Pagefind after HTML generation.

## Write your content

Create markdown files in `content/posts/` and `content/pages/`. Each file needs YAML frontmatter matching the schema you defined. The content layer validates every entry at build time — if a required field is missing or has the wrong type, you get a clear error before the site is built.

## Build the site

Run `vp build` to let Vite+ build the client assets, compile the Solid SSR entry, pre-render every route, and index the result with Pagefind.
