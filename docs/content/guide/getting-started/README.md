# Getting Started

Pagesmith works best when you treat content as typed data first and rendered HTML second. The core workflow is:

1. Define collections with Zod schemas.
2. Point them at filesystem directories.
3. Load them through a content layer.
4. Render only the entries you need.

If you want a convention-based docs site with built-in navigation and search, skip to the [Quick Start with @pagesmith/docs](#quick-start-with-pagesmiths-docs) section at the end.

## Install

```bash title="Terminal"
npm add @pagesmith/core
```

## Create a Content Config

A content config defines your collections, schemas, and markdown settings. Use `defineCollection`, `defineConfig`, and `z` (a re-export of Zod) from `@pagesmith/core`:

```ts title="content.config.ts"
import {
  createContentLayer,
  defineCollection,
  defineConfig,
  z,
} from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
})

const authors = defineCollection({
  loader: 'json',
  directory: 'content/authors',
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
  }),
})

const contentConfig = defineConfig({
  collections: { posts, authors },
  markdown: {
    shiki: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
})

export default contentConfig.collections
export const layer = createContentLayer(contentConfig)
```

`defineCollection()` is a type-safe identity function. It does not transform the definition, but it provides full TypeScript inference from the Zod schema so that `entry.data` is fully typed.

## Recommended Content Layout

```text title="Project Structure"
content/
  posts/
    hello-world/
      README.md          # Entry markdown
      hero.png           # Sibling asset
    getting-started/
      README.md
  authors/
    jane-doe.json
```

Folder-based entries (a directory with a `README.md` inside) are the safest default whenever a markdown entry references sibling assets like images. Pagesmith generates slugs from relative file paths, stripping `README` and file extensions:

| File Path | Generated Slug |
|---|---|
| `hello-world/README.md` | `hello-world` |
| `getting-started.md` | `getting-started` |
| `2024/my-post.md` | `2024/my-post` |

## Load and Render

```ts title="build.ts" mark={1,6}
const posts = await layer.getCollection('posts')

for (const post of posts) {
  console.log(post.slug, post.data.title)

  const rendered = await post.render()
  console.log(rendered.html)      // Processed HTML
  console.log(rendered.headings)  // Heading[] for TOC
  console.log(rendered.readTime)  // Minutes (200 wpm)
}
```

Rendering is lazy. When you call `getCollection()`, Pagesmith discovers files, loads them through the registered loader, validates data against the Zod schema, and runs content validators. The raw markdown is available immediately as `entry.rawContent`, but HTML rendering only happens when you call `entry.render()`. Results are cached after the first call.

## Using the Vite Plugin

For Vite-based projects, Pagesmith provides two plugins that work together:

- **`pagesmithContent`** exposes collections as virtual modules with full type safety.
- **`pagesmithSsg`** handles dev-time SSR middleware and build-time static site generation.

```ts title="vite.config.ts"
import { defineConfig } from 'vite'
import { pagesmithContent, pagesmithSsg } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    pagesmithContent(collections),
    pagesmithSsg({ entry: './src/entry-server.tsx' }),
  ],
})
```

Then import collection data in your application code:

```ts title="src/entry-server.tsx"
import posts from 'virtual:content/posts'

// Markdown collections: { id, contentSlug, html, headings, frontmatter }
for (const post of posts) {
  console.log(post.frontmatter.title, post.html)
}
```

The `pagesmithContent` plugin generates TypeScript declarations (`pagesmith-content.d.ts`) so that `virtual:content/posts` has full type safety derived from the Zod schema in your `content.config.ts`.

The SSR entry module must export two functions:

```ts title="src/entry-server.tsx"
export function getRoutes(config: SsgRenderConfig): string[] {
  // Return all route paths to pre-render
  return ['/', '/posts/hello-world', '/404']
}

export function render(url: string, config: SsgRenderConfig): string {
  // Return the full HTML string for a given route
  return '<html>...</html>'
}
```

## Quick Start with @pagesmith/docs

If you want a convention-based documentation site with built-in navigation, sidebar, search, and a default theme, use `@pagesmith/docs` instead:

```bash title="Terminal"
npm add -D @pagesmith/docs
```

Create a `pagesmith.config.json5` at your project root:

```json5 title="pagesmith.config.json5"
{
  name: "My Docs",
  title: "My Project Documentation",
  contentDir: "./content",
  search: { enabled: true },
}
```

Add markdown files to `content/`:

```text title="Project Structure"
content/
  README.md              # Home page
  guide/
    meta.json5            # Section ordering
    getting-started/
      README.md
  reference/
    meta.json5
    api/
      README.md
```

Run the dev server:

```bash title="Terminal"
npx pagesmith dev --open
```

Build for production:

```bash title="Terminal"
npx pagesmith build
```

See the [Docs CLI Reference](/reference/docs-cli/) and [Docs Configuration Reference](/reference/docs-config/) for full details.

## What to Read Next

- [Collections and Loaders](/guide/collections-and-loaders) -- defining collections, built-in loaders, custom loaders, schemas
- [Validation and Rendering](/guide/validation-and-rendering) -- schema validation, content validators, the markdown pipeline
- [API Reference](/reference/api) -- full API surface of `@pagesmith/core`
- [Configuration Reference](/reference/configuration) -- all configuration options
- [AI Assistants](/guide/ai-assistants) -- installing assistant memory and skill files
