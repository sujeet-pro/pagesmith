# @pagesmith/core

File-based CMS library for Node.js. Provides schema-validated content collections, a markdown-to-HTML pipeline (with Expressive Code syntax highlighting, GFM, math), a server-side JSX runtime, CSS bundles, and Vite plugins for framework integrations.

## Install

```bash
npm install @pagesmith/core
```

ESM only (`"type": "module"`). Node 18+.

## Content Configuration

Define collections with Zod schemas in a `content.config.ts`:

```ts
// content.config.ts
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

const authors = defineCollection({
  loader: 'yaml',
  directory: 'content/authors',
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
  }),
})

export default defineCollections({ posts, authors })
```

`z` is re-exported from Zod for convenience.

Available loaders: `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`.

## Content Layer API

For build scripts and SSG, use the content layer directly:

```ts
import { createContentLayer, defineConfig, defineCollection, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

const config = defineConfig({
  collections: { posts },
  markdown: {
    shiki: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
})

const layer = createContentLayer(config)

// Get all entries in a collection
const entries = await layer.getCollection('posts')

// Get a single entry by slug
const entry = await layer.getEntry('posts', 'my-first-post')

// Render markdown to HTML
const rendered = await entry.render()
// rendered.html      — HTML string
// rendered.headings  — Array<{ depth, text, slug }>
// rendered.readTime  — estimated minutes

// Convert raw markdown outside of collections
const result = await layer.convert('# Hello\n\nWorld')
// result.html, result.toc, result.frontmatter
```

Each `ContentEntry` exposes: `slug`, `collection`, `filePath`, `data` (validated frontmatter), `rawContent`.

## Vite Plugin

For framework integrations (React, Solid, Svelte, etc.), use the Vite plugin to expose collections as virtual modules:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    pagesmithContent(collections),
  ],
})
```

Then import content in your app:

```ts
// Import all collections
import content from 'virtual:content'

// Import a single collection
import posts from 'virtual:content/posts'

// Each markdown entry: { id, contentSlug, html, headings, frontmatter }
// Each data entry:     { id, contentSlug, data }
```

The plugin auto-generates a `pagesmith-content.d.ts` type declaration file. HMR is supported -- content changes trigger full reload.

Options:

```ts
pagesmithContent(collections, {
  root: '.',               // resolve collection directories relative to this
  contentRoot: 'content',  // shared root for computing contentSlug
  moduleId: 'virtual:content',  // virtual module prefix
  configPath: './content.config.ts',
  dts: true,               // generate .d.ts (or path string, or false)
  markdown: { /* MarkdownConfig */ },
})
```

## JSX Runtime

Server-side HTML generation. Configure TypeScript:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

Then write JSX that renders to HTML strings:

```tsx
import { h, Fragment, HtmlString } from '@pagesmith/core/jsx-runtime'

function Page({ title, content }: { title: string; content: string }) {
  return (
    <html lang="en">
      <head><title>{title}</title></head>
      <body>
        <main innerHTML={new HtmlString(content)} />
      </body>
    </html>
  )
}

// Returns an HtmlString instance — call String() or .value for raw HTML
const html = Page({ title: 'Hello', content: '<p>World</p>' })
```

Use `innerHTML` prop or `new HtmlString(raw)` to inject pre-rendered HTML without escaping.

## CSS Exports

Import paths for pre-built CSS:

| Import path                     | Contents                                        |
|---------------------------------|-------------------------------------------------|
| `@pagesmith/core/css/content`   | Markdown rendering (reset + prose + code)       |
| `@pagesmith/core/css/standalone`| Full layout (content + grid + sidebar + TOC)    |
| `@pagesmith/core/css/fonts`     | Font face declarations (Open Sans, JetBrains Mono) |
| `@pagesmith/core/css/viewport`  | Responsive viewport base                        |

For programmatic CSS bundling with LightningCSS:

```ts
import { buildCss } from '@pagesmith/core/css'
const css = buildCss('/path/to/entry.css', { minify: true })
```

## Font Loading

Pagesmith bundles self-hosted Open Sans (variable, 300-800) and JetBrains Mono (variable, 400-700) as `.woff2` files.

Option A -- separate stylesheet (recommended for SSG):

```html
<link rel="stylesheet" href="/assets/fonts.css" />
```

Copy the font files from `@pagesmith/core/assets/fonts/` to your output:

```js
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, readdirSync, mkdirSync } from 'fs'

const corePkg = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
const fontsDir = join(corePkg, 'assets', 'fonts')
const outFonts = join(outDir, 'assets', 'fonts')

mkdirSync(outFonts, { recursive: true })
for (const file of readdirSync(fontsDir)) {
  if (file.endsWith('.woff2')) {
    copyFileSync(join(fontsDir, file), join(outFonts, file))
  }
}
copyFileSync(join(corePkg, 'assets', 'fonts.css'), join(outDir, 'assets', 'fonts.css'))
```

Option B -- import in CSS/JS (Vite handles bundling):

```css
@import '@pagesmith/core/css/fonts';
```

## Frontmatter Schemas

Built-in Zod schemas for common content types:

```ts
import {
  BaseFrontmatterSchema,
  BlogFrontmatterSchema,
  ProjectFrontmatterSchema,
} from '@pagesmith/core'
```

**BaseFrontmatterSchema**: `title`, `description`, `publishedDate`, `lastUpdatedOn`, `tags` (min 1), `draft` (optional, default false). Uses `.passthrough()` so extra fields are preserved.

**BlogFrontmatterSchema**: extends base with `category?`, `featured?`, `coverImage?`.

**ProjectFrontmatterSchema**: extends base with `gitRepo?` (URL), `links?` (array of `{ url, text }`).

Use them directly or extend:

```ts
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: BlogFrontmatterSchema,
})
```

## Runtime JS

For interactive features (TOC scroll highlighting). Code block interactivity (copy buttons) is handled by Expressive Code's inline scripts.

```ts
import { getRuntimeJS, getRuntimeCSS, getContentJS, getContentCSS } from '@pagesmith/core/runtime'

// Standalone (full site with TOC highlight)
const css = getRuntimeCSS()  // CSS string
const js = getRuntimeJS()    // JS string

// Content only (prose + inline code styling)
const contentCss = getContentCSS()
```

Inject into your HTML:

```tsx
<style innerHTML={new HtmlString(getRuntimeCSS())} />
<script innerHTML={new HtmlString(getRuntimeJS())} />
```

Path variants (`getRuntimeCSSPath()`, etc.) return absolute file paths for use with bundlers.

## Static Site Build Pattern

A typical SSG build follows this pattern (see `examples/blog-site/build.mjs`):

```js
// Phase 1: Client build (CSS/JS via Vite)
await build({ root })

// Phase 2: SSR build (compile JSX layouts)
await build({
  root,
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: '.server',
  },
})

// Phase 3: Import compiled layouts + load content
const layouts = await import('./.server/entry-server.js')
const layer = createContentLayer(config)
const posts = await layer.getCollection('posts')

// Phase 4: Render each page
for (const post of posts) {
  const rendered = await post.render()
  const html = layouts.Article({
    content: rendered.html,
    headings: rendered.headings,
    frontmatter: post.data,
  })
  writeFileSync(`dist/${post.slug}/index.html`, `<!DOCTYPE html>\n${html}`)
}

// Phase 5 (optional): Pagefind indexing
execSync(`npx pagefind --site dist`)
```

## Export Map Summary

| Import path                      | Purpose                                    |
|----------------------------------|--------------------------------------------|
| `@pagesmith/core`                | Main API (defineCollection, createContentLayer, z, etc.) |
| `@pagesmith/core/jsx-runtime`    | h, Fragment, HtmlString (JSX transform)    |
| `@pagesmith/core/markdown`       | processMarkdown (standalone pipeline)      |
| `@pagesmith/core/css`            | buildCss (LightningCSS bundler)            |
| `@pagesmith/core/css/content`    | Content CSS file                           |
| `@pagesmith/core/css/standalone` | Full standalone CSS file                   |
| `@pagesmith/core/css/fonts`      | Font face declarations                     |
| `@pagesmith/core/css/viewport`   | Viewport CSS file                          |
| `@pagesmith/core/schemas`        | Zod schemas and types                      |
| `@pagesmith/core/loaders`        | Loader classes and registry                |
| `@pagesmith/core/assets`         | Asset copying and hashing                  |
| `@pagesmith/core/runtime`        | Pre-built CSS/JS accessors                 |
| `@pagesmith/core/vite`           | Vite content plugin                        |
| `@pagesmith/core/ai`             | AI assistant file installer                |
