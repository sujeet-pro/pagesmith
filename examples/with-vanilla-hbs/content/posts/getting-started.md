---
title: Getting Started
description: Setting up Pagesmith with Handlebars
date: 2026-03-01
tags:
  - setup
  - handlebars
order: 1
---

## Install dependencies

This example needs two packages: `@pagesmith/core` for the content layer, and `handlebars` for template rendering.

```bash
vp install @pagesmith/core handlebars pagefind
vp install -D vite-plus typescript
```

There is still no client-side framework runtime, but the example now uses the same `vp dev` / `vp build` workflow as the rest of the repo.

## Define content collections

The `content.config.mjs` file declares what content the site has and how to validate it. Each collection uses `defineCollection` from `@pagesmith/core` with a Zod schema:

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

The `z.coerce.date()` call means frontmatter dates like `2026-03-01` are automatically parsed into `Date` objects. The `tags` field defaults to an empty array when omitted.

## The server entry

The entry point is `src/entry-server.tsx`. It does everything Pagesmith needs for the Handlebars render path:

1. **Register partials and helpers** — `Handlebars.registerPartial('layout', ...)` makes the layout template available as `{{> layout}}`. Custom helpers like `formatDate` and `eq` are registered with `Handlebars.registerHelper`.
2. **Create the content layer** — `createContentLayer(defineConfig({ root, collections }))` loads and validates all markdown files.
3. **Compile templates** — `Handlebars.compile(source)` turns each `.hbs` file into a render function.
4. **Render pages** — Each compiled template receives a flat object of props (`{ title, content, css, basePath, ... }`) and returns an HTML string.
5. **Return HTML** — `pagesmithSsg(...)` writes the route output, copies content assets, and runs Pagefind.

## Handlebars template basics

Handlebars uses `{{variable}}` for escaped output and `{{{rawHtml}}}` for unescaped HTML (needed for rendered markdown). Iteration uses `{{#each items}}...{{/each}}`, and conditionals use `{{#if condition}}...{{/if}}`.

The layout partial is registered once in the build script:

```js
Handlebars.registerPartial('layout', loadTemplate('layout'))
```

Two custom helpers handle common needs:

```js
Handlebars.registerHelper('formatDate', (value) => {
  const date = new Date(value)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-')
})

Handlebars.registerHelper('eq', (left, right) => left === right)
```

## Run the build

```bash
vp build
```

This produces a static output under `../../gh-pages/examples/vanilla-hbs`. No client-side framework is required, but you still get the shared Pagesmith runtime features for search, code blocks, and table-of-contents behavior.
