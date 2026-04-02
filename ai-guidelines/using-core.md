# Using @pagesmith/core

Guidelines for AI assistants generating code or content that uses `@pagesmith/core`.

## Install

```bash
npm add @pagesmith/core
```

## Content Layer (Programmatic API)

Use `createContentLayer` + `defineConfig` for direct control:

```ts
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

const layer = createContentLayer(defineConfig({ collections: { posts } }))
const entries = await layer.getCollection('posts')
const rendered = await entries[0]?.render()
// rendered.html, rendered.headings, rendered.readTime
```

## Vite Plugin Flow

Use `defineCollections` + `pagesmithContent` for Vite-native projects:

```ts
// content.config.ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const posts = defineCollection({
  loader: 'markdown',
  directory: './content/posts',
  schema: z.object({ title: z.string(), date: z.coerce.date() }),
})

export default defineCollections({ posts })
```

```ts
// vite.config.ts
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
})
```

Import collections as virtual modules:

```ts
import posts from 'virtual:content/posts'
```

## SSR Entry Contract

Your entry-server must export:

```ts
export function getRoutes(config: SsgRenderConfig): string[]
export function render(url: string, config: SsgRenderConfig): string | Promise<string>
```

`SsgRenderConfig` provides: `base`, `root`, `cssPath`, `jsPath`, `searchEnabled`, `isDev`.

## Collection Options

| Option | Type | Description |
|---|---|---|
| `loader` | `string \| Loader` | `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`, or custom |
| `directory` | `string` | Directory containing files |
| `schema` | `z.ZodType` | Zod schema for validation |
| `include` | `string[]` | Glob include patterns |
| `exclude` | `string[]` | Glob exclude patterns |
| `computed` | `Record<string, fn>` | Computed fields |
| `validate` | `fn` | Custom validation (return string for error) |
| `filter` | `fn` | Filter entries |
| `slugify` | `fn` | Custom slug generation |
| `transform` | `fn` | Pre-validation transform |
| `validators` | `ContentValidator[]` | Custom content validators |
| `disableBuiltinValidators` | `boolean` | Disable link/heading/code-block validators |

## CSS Exports

| Import Path | Use Case |
|---|---|
| `@pagesmith/core/css/content` | Embedding rendered markdown in an existing app |
| `@pagesmith/core/css/standalone` | Full doc site layout with sidebar and TOC |
| `@pagesmith/core/css/viewport` | Minimal responsive shell |
| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |

Code block CSS is injected inline by Expressive Code — do NOT import separate code block CSS.

## JSX Runtime

For server-side HTML generation without React/Solid/Svelte:

```json
// tsconfig.json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "@pagesmith/core" } }
```

```tsx
import { Fragment } from '@pagesmith/core/jsx-runtime'

function Page({ title, content }: { title: string; content: string }) {
  return (
    <html><head><title>{title}</title></head>
    <body><Fragment innerHTML={content} /></body></html>
  )
}
```

## Frontmatter Schemas

Pre-defined schemas available from `@pagesmith/core`:

- `BaseFrontmatterSchema` — title, description, publishedDate, lastUpdatedOn, tags, draft
- `BlogFrontmatterSchema` — extends base + category, featured, coverImage
- `ProjectFrontmatterSchema` — extends base + gitRepo, links

## Key Rules

- Always use `z` re-exported from `@pagesmith/core`, not from `zod` directly
- Prefer folder-based entries (`guide/getting-started/README.md`) when content references sibling assets
- The `render()` result is cached — call `clearRenderCache()` to force re-render
- `getCollection()` results are cached — use `invalidate*()` methods for cache busting
- Runtime JS provides only TOC highlighting (standalone) — copy buttons are Expressive Code
- All exports are named (no default exports from core)
