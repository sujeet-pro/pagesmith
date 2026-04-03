# @pagesmith/core — AI Reference

Link this file from your project's CLAUDE.md or AGENTS.md to give AI assistants a comprehensive reference for `@pagesmith/core`.

```markdown
<!-- In your CLAUDE.md or AGENTS.md -->
For the full @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
```

---

## Overview

`@pagesmith/core` is a file-based content toolkit for Vite. It provides schema-validated content collections, lazy markdown rendering with Expressive Code syntax highlighting, a server-side JSX runtime, CSS bundles, and Vite plugins for framework integrations.

ESM only (`"type": "module"`). Node 18+.

## Content Layer API

```ts
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'

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

const layer = createContentLayer(defineConfig({ collections: { posts } }))
const entries = await layer.getCollection('posts')
const rendered = await entries[0]?.render()
// rendered.html, rendered.headings, rendered.readTime
```

### ContentLayer methods

| Method | Description |
|---|---|
| `createContentLayer(config)` | Create a content layer from a config object |
| `layer.getCollection(name)` | Load all entries in a collection (cached) |
| `layer.getEntry(collection, slug)` | Get a single entry by slug |
| `layer.convert(markdown, options?)` | Convert raw markdown to HTML outside collections |
| `layer.validate(collection?)` | Run all validators and return results |
| `layer.invalidate(collection, slug)` | Cache-bust a single entry |
| `layer.invalidateCollection(name)` | Cache-bust an entire collection |
| `layer.invalidateAll()` | Cache-bust all collections |

### ContentEntry properties

| Property | Type | Description |
|---|---|---|
| `slug` | `string` | URL-friendly identifier |
| `collection` | `string` | Collection name |
| `filePath` | `string` | Absolute source path |
| `data` | `T` | Validated data (typed by your Zod schema) |
| `rawContent` | `string` | Raw markdown body (markdown loader only) |
| `render(options?)` | `Promise<RenderedContent>` | Lazy markdown-to-HTML (cached) |
| `clearRenderCache()` | `void` | Force re-render on next call |

### RenderedContent

| Property | Type | Description |
|---|---|---|
| `html` | `string` | Rendered HTML |
| `headings` | `Heading[]` | `{ depth, text, slug }` |
| `readTime` | `number` | Estimated minutes |

## Collection Options

| Option | Type | Description |
|---|---|---|
| `loader` | `string \| Loader` | `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`, or custom |
| `directory` | `string` | Directory containing collection files |
| `schema` | `z.ZodType` | Zod schema for validating entry data |
| `include` | `string[]` | Glob include patterns |
| `exclude` | `string[]` | Glob exclude patterns |
| `computed` | `Record<string, fn>` | Computed fields derived from entry data |
| `validate` | `fn` | Custom validation hook (return string for error) |
| `filter` | `fn` | Filter entries (return false to exclude) |
| `slugify` | `fn` | Custom slug generation |
| `transform` | `fn` | Pre-validation transform |
| `validators` | `ContentValidator[]` | Custom content validators |
| `disableBuiltinValidators` | `boolean` | Disable built-in markdown validators |

## Loaders

| Type | Extensions | Description |
|---|---|---|
| `markdown` | `.md` | gray-matter frontmatter + markdown body |
| `json` | `.json` | JSON.parse |
| `json5` | `.json` | Relaxed JSON with comments, trailing commas |
| `jsonc` | `.json`, `.jsonc` | JSON with comments |
| `yaml` | `.yml`, `.yaml` | YAML |
| `toml` | `.toml` | TOML |

Custom loaders: implement `Loader { name, kind, extensions, load(filePath) }`.

## Vite Plugins

### pagesmithContent

Virtual module plugin that exposes collections as importable modules:

```ts
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

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `collections` | `Collections` | — | Collection definitions |
| `moduleId` | `string` | `'virtual:content'` | Virtual module prefix |
| `configPath` | `string` | `'./content.config.ts'` | Config file path |
| `dts` | `boolean \| string` | `true` | Generate .d.ts |
| `contentRoot` | `string` | `'content'` | Shared root for contentSlug |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config |

Import in your code:

```ts
import posts from 'virtual:content/posts'
// Each markdown entry: { id, contentSlug, html, headings, frontmatter }
```

### pagesmithSsg

Static site generation plugin. Your SSR entry must export:

```ts
export function getRoutes(config: SsgRenderConfig): string[]
export function render(url: string, config: SsgRenderConfig): string | Promise<string>
```

`SsgRenderConfig` provides: `base`, `root`, `cssPath`, `jsPath`, `searchEnabled`, `isDev`.

### sharedAssetsPlugin

Serves shared font assets (Open Sans, JetBrains Mono) bundled with `@pagesmith/core`.

## Markdown Pipeline

```
remark-parse → remark-gfm → remark-math → remark-frontmatter
  → remark-github-alerts → remark-smartypants → [user remark plugins]
  → remark-rehype
  → rehype-expressive-code (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-mathjax → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → [user rehype plugins] → rehype-stringify
```

### Markdown Configuration

```ts
type MarkdownConfig = {
  remarkPlugins?: any[]
  rehypePlugins?: any[]
  shiki?: {
    themes: { light: string; dark: string }
    langAlias?: Record<string, string>
    defaultShowLineNumbers?: boolean
  }
}
```

### Code Block Meta Syntax (Expressive Code)

| Meta | Example | Description |
|---|---|---|
| `title="..."` | `` ```js title="app.js" `` | File title |
| `showLineNumbers` | `` ```js showLineNumbers `` | Line numbers |
| `mark={lines}` | `` ```js mark={3,5-7} `` | Highlight lines |
| `ins={lines}` | `` ```js ins={4} `` | Inserted lines (green) |
| `del={lines}` | `` ```js del={5} `` | Deleted lines (red) |
| `collapse={lines}` | `` ```js collapse={1-5} `` | Collapsible section |
| `wrap` | `` ```js wrap `` | Text wrapping |
| `frame="..."` | `` ```js frame="terminal" `` | Frame style |

### Built-in Validators

- **linkValidator** — warns on bare URLs, empty link text, suspicious protocols
- **headingValidator** — enforces single h1, sequential heading depth
- **codeBlockValidator** — warns on missing language, unknown meta properties

## JSX Runtime

Configure tsconfig: `{ "jsx": "react-jsx", "jsxImportSource": "@pagesmith/core" }`

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
```

- `h()` returns `HtmlString` — use `String(result)` or `.value` for raw HTML
- Use `innerHTML` prop to inject pre-rendered HTML without escaping
- `Fragment` renders children or raw `innerHTML` without a wrapper element

## CSS Exports

| Import Path | Contents |
|---|---|
| `@pagesmith/core/css/content` | Prose typography + inline code |
| `@pagesmith/core/css/standalone` | Full layout + prose + TOC |
| `@pagesmith/core/css/viewport` | Responsive viewport base |
| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |

Code block styling is handled by Expressive Code (inline styles).

## Runtime Exports

```ts
import { getRuntimeCSS, getRuntimeJS, getContentCSS, getContentJS } from '@pagesmith/core/runtime'
```

Two tiers:
- **Standalone** (`getRuntimeCSS/JS`) — full site with TOC highlight
- **Content** (`getContentCSS/JS`) — markdown rendering only

## Frontmatter Schemas

| Schema | Fields |
|---|---|
| `BaseFrontmatterSchema` | title, description, publishedDate, lastUpdatedOn, tags, draft |
| `BlogFrontmatterSchema` | extends base + category, featured, coverImage |
| `ProjectFrontmatterSchema` | extends base + gitRepo, links |

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/core` | Main API (defineCollection, createContentLayer, z, etc.) |
| `@pagesmith/core/jsx-runtime` | h, Fragment, HtmlString |
| `@pagesmith/core/markdown` | processMarkdown |
| `@pagesmith/core/css` | buildCss (LightningCSS) |
| `@pagesmith/core/css/content` | Content CSS file |
| `@pagesmith/core/css/standalone` | Standalone CSS file |
| `@pagesmith/core/css/viewport` | Viewport CSS file |
| `@pagesmith/core/css/fonts` | Bundled font faces |
| `@pagesmith/core/schemas` | Zod schemas and types |
| `@pagesmith/core/loaders` | Loader classes and registry |
| `@pagesmith/core/assets` | Asset copying and hashing |
| `@pagesmith/core/runtime` | Pre-built CSS/JS accessors |
| `@pagesmith/core/vite` | Vite plugins |
| `@pagesmith/core/ai` | AI assistant artifact generator |
| `@pagesmith/core/create` | Project scaffolding |

## Key Rules

- Always use `z` re-exported from `@pagesmith/core`, not from `zod` directly
- Prefer folder-based entries (`guide/getting-started/README.md`) when content references sibling assets
- The `render()` result is cached — call `clearRenderCache()` to force re-render
- `getCollection()` results are cached — use `invalidate*()` methods for cache busting
- Runtime JS provides only TOC highlighting (standalone) — copy buttons are Expressive Code
- All exports are named (no default exports from core)
- Code block styling is inline via Expressive Code — do NOT import separate code block CSS
