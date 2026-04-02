---
title: Getting Started
description: How to set up a Pagesmith static site with React from scratch
date: 2026-03-01
tags:
  - setup
  - react
order: 1
---

# Getting Started with Pagesmith + React

This guide walks through every piece needed to go from an empty directory to a fully pre-rendered static site powered by Pagesmith and React.

## Install dependencies

The project needs the Pagesmith content layer, React for rendering, and Vite+ as the build tool:

```bash
vp install @pagesmith/core react react-dom pagefind
vp install -D vite-plus typescript @types/react @types/react-dom
```

See `package.json` in this example for the exact versions used.

## Define your content schema

Create a `content.config.mjs` at the project root. This is where you declare your content collections using `defineCollection` and validate frontmatter with Zod schemas:

```js
import { defineCollection, z } from '@pagesmith/core'

export const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})
```

Each collection maps to a directory of markdown files. The schema ensures every file has the frontmatter fields you expect, and `z.coerce.date()` handles string-to-Date conversion automatically.

## Configure Vite

The `vite.config.ts` wires Pagesmith into Vite+. The key parts are:

1. **`pagesmithContent`** -- registers your collections so they become importable as virtual modules.
2. **`pagesmithSsg`** -- asks Pagesmith to build routes from `src/entry-server.tsx` and run Pagefind.
3. **`oxc.jsx`** -- tells Vite+ to use React's JSX transform.
4. **`base`** -- sets the public base path for deployment.

```ts
import { pagesmithContent, pagesmithSsg } from '@pagesmith/core/vite'
import { defineConfig } from 'vite-plus'
import collections from './content.config'

export default defineConfig({
  plugins: [
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
})
```

## Create the server entry

The `src/entry-server.tsx` file imports `virtual:content/*` modules, sorts the collections, and renders routes with `react-dom/server`. `pagesmithSsg(...)` calls its `getRoutes()` and `render(url, config)` exports during the build.

## Create the HTML shell

The `index.html` file stays minimal because the rendered markup is injected by Pagesmith during pre-rendering:

```html
<div id="app"></div>
```

## Write your first post

Drop a markdown file into `content/posts/`. Add frontmatter that matches your schema, then write your content below the `---` fence. Pagesmith parses the markdown, validates the frontmatter against your Zod schema, and makes the result available as a typed object in your React components.

## Run the build

Build the example with:

```bash
vp build
```

The output lands in `../../gh-pages/examples/react` as plain HTML files -- one per route -- ready to deploy to any static host.
