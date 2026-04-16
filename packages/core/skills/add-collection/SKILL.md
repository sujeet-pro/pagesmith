---
name: add-collection
description: Add a Pagesmith content collection (markdown, JSON, JSON5, YAML, TOML) validated by a Zod schema. Use when you need to register a new content type in your project.
---

# Add a Pagesmith Collection

## Prerequisites

- `@pagesmith/core` installed (or `@pagesmith/site` / `@pagesmith/docs` which re-export the same APIs).
- A `content.config.ts` file at the project root (create it if missing).

## Steps

1. Decide the loader (`markdown`, `json`, `json5`, `jsonc`, `yaml`, `toml`) and the content directory (e.g. `content/posts`).
2. Define the frontmatter / data schema with Zod. Import `z` from `@pagesmith/core` (re-exported from `@pagesmith/site` and `@pagesmith/docs`). Do not import zod directly.
3. Call `defineCollection({...})` and register it on the root `defineCollections({...})` export.
4. Register the collection with the Vite plugin:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [pagesmithContent({ collections })],
})
```

5. Read entries from the virtual module:

```ts
import posts from 'virtual:content/posts'
```

Or read directly through the content layer when you need full control:

```ts
import { createContentLayer, defineConfig } from '@pagesmith/core'
import collections from './content.config'

const layer = createContentLayer(defineConfig({ collections }))
const entry = await layer.getEntry('posts', 'hello-world')
const rendered = await entry?.render()
```

## Shortcuts

For common content types, prefer the convenience factories exported from `@pagesmith/core`:

- `blogCollection({ directory? })` — uses `BlogFrontmatterSchema`.
- `projectsCollection({ directory? })` — uses `ProjectFrontmatterSchema`.
- `docsCollection({ directory? })` — uses the docs frontmatter schema.

These still accept a `schema:` override when you need to extend the defaults.

## Verification

- `npm run build` — should emit entries in the virtual module output.
- Pagesmith's schema validation runs automatically when you call `getCollection`/`getEntry`.
- For stricter checks, call `layer.validate('posts')` in a `scripts/validate-content.ts`.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
