---
title: Content Collections
description: Loading content with the programmatic API
date: 2026-03-15
tags:
  - content
  - collections
order: 3
---

## The programmatic content API

This example uses the same `defineCollection` and `createContentLayer` API as the EJS example. The content layer is framework-agnostic — it does not care whether you render with React, Svelte, EJS, or Handlebars. It simply loads files, validates frontmatter, and hands you structured data.

```js
import { createContentLayer, defineConfig } from '@pagesmith/core'
import { posts, pages } from './content.config.mjs'

const layer = createContentLayer(
  defineConfig({
    root: dirnameFromUrl,
    collections: { posts, pages },
  }),
)
```

The `root` option tells the content layer where to resolve the `directory` paths declared in each collection. Since this example is self-contained, the root points to the example directory itself.

## Querying collections

`layer.getCollection('posts')` returns an array of `ContentEntry` objects. Each entry exposes:

- **`.data`** — The validated frontmatter object. Fields match the Zod schema exactly, so `entry.data.title` is always a string and `entry.data.date` is always a `Date` instance.
- **`.slug`** — A URL-friendly identifier derived from the filename (e.g., `getting-started` from `getting-started.md`).
- **`.render()`** — An async function that returns `{ html, headings }`. The `html` string is the rendered markdown, and `headings` is an array of `{ text, slug, depth }` objects for building a table of contents.

## Passing data to Handlebars

Compiled Handlebars templates are plain functions — they accept a single object and return a string. The build script flattens each entry's data into the template context:

```js
postTemplate({
  title: post.data.title,
  date: post.data.date,
  tags: post.data.tags,
  content,
  headings,
  basePath,
  css,
  js,
})
```

This flat structure keeps templates simple. There is no need for deep property access like `{{post.data.title}}` — the template just writes `{{title}}`.

## Table of contents from headings

The `headings` array returned by `entry.render()` enables the table-of-contents sidebar in `templates/post.hbs`. Each heading object has a `depth` property (2 for `##`, 3 for `###`, etc.) that the template uses for indentation:

```handlebars
{{#each headings}}
  <li style="padding-left: {{this.depth}}rem;">
    <a href="#{{this.slug}}">{{this.text}}</a>
  </li>
{{/each}}
```

Because Handlebars is logic-less, the indentation is done with inline CSS rather than computed classes. The `depth` value maps directly to a `padding-left` in rem units.

## Schema validation at build time

Zod schemas catch frontmatter errors before any template rendering happens. If a post is missing a required `title` field or has a `date` value that cannot be coerced into a `Date`, the content layer throws a descriptive validation error during `getCollection()`. This fail-fast behavior means you never get a partially rendered site with broken pages — either all content is valid or the build stops with a clear error message.
