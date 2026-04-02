---
title: "Installation & Setup"
description: "Set up Pagesmith in your project with npm, configure collections, and verify your first content build."
date: 2026-03-01
tags: [setup, getting-started]
series: getting-started
seriesOrder: 1
---

# Installation & Setup

Install the core package and any peer dependencies your framework needs.

## Install

```bash
npm add @pagesmith/core
```

For the Vite content plugin, no extra install is needed — it ships with `@pagesmith/core/vite`.

## Create a content config

Create `content.config.ts` (or `.mjs`) in your project root:

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export default defineCollections({ posts })
```

## Add content

Create `content/posts/hello-world.md`:

```markdown
---
title: "Hello World"
date: 2026-01-01
tags: [intro]
---

Your first Pagesmith content entry.
```

## Wire up Vite

Add the `pagesmithContent` plugin to your `vite.config.ts`:

```ts
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default {
  plugins: [pagesmithContent({ collections })],
}
```

Now `import posts from 'virtual:content/posts'` gives you typed, validated content entries at build time.
