# @pagesmith/core Guidelines

Comprehensive guide for AI assistants setting up and using `@pagesmith/core`. Follow this file to configure a project and generate code or content using the core package.

For markdown features, frontmatter schemas, and content authoring rules, see [`markdown-guidelines.md`](markdown-guidelines.md).

---

## Setup

### 1. Install

```bash
npm add @pagesmith/core
```

### 2. Create content directory

```bash
mkdir -p content/posts
```

Create a sample markdown file at `content/posts/hello-world/README.md`:

```md
---
title: Hello World
description: A first post to verify the setup.
date: 2025-01-01
tags:
  - getting-started
---

# Hello World

This is a sample post created during Pagesmith setup.
```

### 3. Create content.config.ts

Create `content.config.ts` at the project root:

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional().default(false),
  }),
})

export default defineCollections({ posts })
```

Adapt the schema and collection names to the project's actual content model.

### 4. Configure Vite

Update or create `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
})
```

If the project uses a framework plugin (React, Solid, Svelte), add it before the Pagesmith plugins.

### 5. Create SSR entry

Create `src/entry-server.tsx` (or `.ts` for non-JSX frameworks):

```tsx
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import posts from 'virtual:content/posts'

export function getRoutes(config: SsgRenderConfig): string[] {
  return [
    '/',
    ...posts.map((p) => `/${p.contentSlug}`),
  ]
}

export function render(url: string, config: SsgRenderConfig): string {
  // Implement rendering logic for each route
  // Return full HTML string including <!DOCTYPE html>
  return '<!DOCTYPE html><html><body>TODO</body></html>'
}
```

### 6. Configure TypeScript (if using JSX runtime)

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

### 7. Add CSS imports

Choose the appropriate CSS tier:

- **Content only** (embedding in existing app): `@pagesmith/core/css/content`
- **Standalone** (full page with TOC/sidebar): `@pagesmith/core/css/standalone`
- **Viewport**: `@pagesmith/core/css/viewport`
- **Fonts** (Open Sans + JetBrains Mono): `@pagesmith/core/css/fonts`

Import in your CSS or JS entry:

```css
@import '@pagesmith/core/css/content';
@import '@pagesmith/core/css/fonts';
```

### 8. Update CLAUDE.md / AGENTS.md

Add or merge the following into the project's `CLAUDE.md` (for Claude) or `AGENTS.md` (for Codex):

```markdown
## Content Layer (@pagesmith/core)

This project uses @pagesmith/core for content management.

- Content collections are defined in `content.config.ts`
- Content lives in `content/` with folder-based entries (`content/<collection>/<slug>/README.md`)
- Schemas use Zod — always import `z` from `@pagesmith/core`, not from `zod` directly
- The Vite plugin exposes collections as virtual modules: `import posts from 'virtual:content/posts'`
- Markdown rendering is lazy — call `entry.render()` only when HTML is needed
- Code block styling is handled by Expressive Code (inline) — do NOT add separate code block CSS or copy-button JS

### References

- Full API reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Markdown guidelines, loaders, validators, CSS exports: see REFERENCE.md
```

---

## Usage

### Content Layer (Programmatic API)

Use `createContentLayer` + `defineConfig` for direct control (build scripts, non-Vite projects):

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

### Vite Plugin Flow

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

### SSR Entry Contract

Your entry-server must export:

```ts
export function getRoutes(config: SsgRenderConfig): string[]
export function render(url: string, config: SsgRenderConfig): string | Promise<string>
```

`SsgRenderConfig` provides: `base`, `root`, `cssPath`, `jsPath`, `searchEnabled`, `isDev`.

### Collection Options

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

### CSS Exports

| Import Path | Use Case |
|---|---|
| `@pagesmith/core/css/content` | Embedding rendered markdown in an existing app |
| `@pagesmith/core/css/standalone` | Full doc site layout with sidebar and TOC |
| `@pagesmith/core/css/viewport` | Minimal responsive shell |
| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |

Code block CSS is injected inline by Expressive Code -- do NOT import separate code block CSS.

### JSX Runtime

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

### Frontmatter Schemas

Pre-defined schemas available from `@pagesmith/core`:

- `BaseFrontmatterSchema` -- title, description, publishedDate, lastUpdatedOn, tags, draft
- `BlogFrontmatterSchema` -- extends base + category, featured, coverImage
- `ProjectFrontmatterSchema` -- extends base + gitRepo, links

For full frontmatter details, see [`markdown-guidelines.md`](markdown-guidelines.md).

---

## Key Rules

- Always use `z` re-exported from `@pagesmith/core`, not from `zod` directly
- Prefer folder-based entries (`guide/getting-started/README.md`) when content references sibling assets
- The `render()` result is cached -- call `clearRenderCache()` to force re-render
- `getCollection()` results are cached -- use `invalidate*()` methods for cache busting
- Runtime JS provides only TOC highlighting (standalone) -- copy buttons are Expressive Code
- All exports are named (no default exports from core)

---

## Full Reference

For the complete API reference including markdown features, loaders, validators, CSS exports, and frontmatter schemas, see:

```
node_modules/@pagesmith/core/REFERENCE.md
```
