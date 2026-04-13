# @pagesmith/core Guidelines

Guide for AI assistants using `@pagesmith/core`.

`@pagesmith/core` is the headless content layer. It owns collections, loaders, validation, markdown rendering, schemas, assets helpers, MCP support, and the `pagesmithContent` Vite plugin. It does not own the Pagesmith JSX runtime, CSS bundles, runtime JS, SSG helpers, or the `pagesmith-site` CLI.

For markdown features and authoring rules, also read `markdown-guidelines.md`.

## Setup

### 1. Install

```bash
npm add @pagesmith/core
```

If the project also needs Pagesmith site-building, install `@pagesmith/site` too:

```bash
npm add @pagesmith/core @pagesmith/site
```

### 2. Create content collections

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional().default(false),
  }),
})

export default defineCollections({ posts })
```

### 3. Use the content layer directly

```ts
import { createContentLayer, defineConfig, z } from '@pagesmith/core'
import collections from './content.config'

const layer = createContentLayer(
  defineConfig({
    collections,
  }),
)

const entries = await layer.getCollection('posts')
const rendered = await entries[0]?.render()
```

### 4. Configure Vite content access

```ts
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [pagesmithContent({ collections })],
})
```

If the project also needs Pagesmith site-building, split the imports:

```ts
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

## What Lives In `@pagesmith/core`

- `defineCollection`, `defineCollections`, `defineConfig`
- `createContentLayer`
- `processMarkdown`
- built-in loaders
- schemas and frontmatter helpers
- assets helpers
- MCP support
- `pagesmithContent`

## What Does Not Live In `@pagesmith/core`

Move these to `@pagesmith/site`:

- `pagesmithSsg`
- `sharedAssetsPlugin`
- `prerenderRoutes`
- `SsgRenderConfig`
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/ssg-utils`
- the `pagesmith-site` CLI

## Usage

### Content Layer API

Use `createContentLayer` + `defineConfig` for direct control:

```ts
import { createContentLayer, defineConfig } from '@pagesmith/core'
import collections from './content.config'

const layer = createContentLayer(defineConfig({ collections }))
const entry = await layer.getEntry('posts', 'hello-world')
const rendered = await entry?.render()
```

### Vite Plugin Flow

Use `pagesmithContent` to expose virtual content modules:

```ts
import posts from 'virtual:content/posts'
```

### Frontmatter Schemas

Available from `@pagesmith/core`:

- `BaseFrontmatterSchema`
- `BlogFrontmatterSchema`
- `ProjectFrontmatterSchema`

## Key Rules

- Always import `z` from `@pagesmith/core`, not directly from `zod`
- Prefer folder-based entries when content needs sibling assets
- Keep schema validation in the collection definition
- Use `entry.render()` only when HTML is needed
- Keep site-facing imports in `@pagesmith/site`, not `@pagesmith/core`
- All exports are named

## Full Reference

Read:

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`
- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
