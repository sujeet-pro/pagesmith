---
title: "Vite Content Plugin"
description: "Use the pagesmithContent Vite plugin to serve collections as virtual modules."
date: 2026-03-10
tags: [vite, plugin]
series: framework-integration
seriesOrder: 1
---

# Vite Content Plugin

The `pagesmithContent` plugin integrates your content layer with Vite's module system. Collections become importable virtual modules with full TypeScript types.

## Setup

```ts
// vite.config.ts
import { pagesmithContent } from '@pagesmith/core/vite'
import { guide, blog, pages } from './content.config'

export default {
  plugins: [
    pagesmithContent({
      collections: { guide, blog, pages },
      dts: true, // generates pagesmith-content.d.ts
    }),
  ],
}
```

## Importing collections

```ts
import guide from 'virtual:content/guide'
import blog from 'virtual:content/blog'

// Each entry is fully typed based on your Zod schema
guide[0].frontmatter.title  // string
guide[0].html               // rendered HTML
guide[0].headings           // Heading[]
```

## Type generation

When `dts: true`, the plugin generates a `.d.ts` file declaring the virtual modules. Add it to your `tsconfig.json`:

```json
{
  "include": ["src", "pagesmith-content.d.ts"]
}
```

## Hot module replacement

During development, editing a markdown file triggers HMR — the virtual module is invalidated and your page updates without a full reload.
