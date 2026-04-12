# @pagesmith/core — AI Reference

Link this file from your project's CLAUDE.md or AGENTS.md to give AI assistants a comprehensive reference for `@pagesmith/core`.

```markdown
<!-- In your CLAUDE.md or AGENTS.md -->
For the full @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
For @pagesmith/core usage and prompts, read: node_modules/@pagesmith/core/ai-guidelines/usage.md
```

---

## Overview

`@pagesmith/core` is a file-based content toolkit for Vite. It provides schema-validated content collections, lazy markdown rendering with a built-in Shiki-backed code renderer, a server-side JSX runtime, CSS bundles, and Vite plugins for framework integrations.

ESM only (`"type": "module"`). Node 24+.

## Adoption Paths

- AI-first bootstrap or retrofit: `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- Upgrade an existing integration: `node_modules/@pagesmith/core/ai-guidelines/migration.md`
- Use `@pagesmith/docs` instead when you need the `pagesmith` CLI, `pagesmith.config.json5`, built-in docs navigation, or Pagefind-powered search

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


| Method                                          | Description                                          |
| ----------------------------------------------- | ---------------------------------------------------- |
| `createContentLayer(config)`                    | Create a content layer from a config object          |
| `layer.getCollection(name)`                     | Load all entries in a collection (cached)            |
| `layer.getEntry(collection, slug)`              | Get a single entry by slug                           |
| `layer.convert(markdown, options?)`             | Convert raw markdown to HTML outside collections     |
| `layer.validate(collection?)`                   | Run all validators and return results                |
| `layer.invalidate(collection, slug)`            | Cache-bust a single entry                            |
| `layer.invalidateCollection(name)`              | Cache-bust an entire collection                      |
| `layer.invalidateAll()`                         | Cache-bust all collections                           |
| `layer.getCollectionNames()`                    | Get names of all configured collections              |
| `layer.getCollectionDef(name)`                  | Get the definition of a collection                   |
| `layer.getCollections()`                        | Get all collection definitions                       |
| `layer.invalidateWhere(collection, predicate)`  | Cache-bust entries matching a predicate              |
| `layer.watch(callback)`                         | Watch collection directories for changes             |
| `layer.getCacheStats()`                         | Get cache statistics for debugging                   |


### ContentEntry properties


| Property             | Type                       | Description                               |
| -------------------- | -------------------------- | ----------------------------------------- |
| `slug`               | `string`                   | URL-friendly identifier                   |
| `collection`         | `string`                   | Collection name                           |
| `filePath`           | `string`                   | Absolute source path                      |
| `data`               | `T`                        | Validated data (typed by your Zod schema) |
| `rawContent`         | `string`                   | Raw markdown body (markdown loader only)  |
| `render(options?)`   | `Promise<RenderedContent>` | Lazy markdown-to-HTML (cached)            |
| `clearRenderCache()` | `void`                     | Force re-render on next call              |


### RenderedContent


| Property   | Type        | Description             |
| ---------- | ----------- | ----------------------- |
| `html`     | `string`    | Rendered HTML           |
| `headings` | `Heading[]` | `{ depth, text, slug }` |
| `readTime` | `number`    | Estimated minutes       |


## Collection Options


| Option                     | Type                 | Description                                                                 |
| -------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `loader`                   | `string | Loader`    | `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`, or custom |
| `directory`                | `string`             | Directory containing collection files                                       |
| `schema`                   | `z.ZodType`          | Zod schema for validating entry data                                        |
| `include`                  | `string[]`           | Glob include patterns                                                       |
| `exclude`                  | `string[]`           | Glob exclude patterns                                                       |
| `computed`                 | `Record<string, fn>` | Computed fields derived from entry data                                     |
| `validate`                 | `fn`                 | Custom validation hook (return string for error)                            |
| `filter`                   | `fn`                 | Filter entries (return false to exclude)                                    |
| `slugify`                  | `fn`                 | Custom slug generation                                                      |
| `transform`                | `fn`                 | Pre-validation transform                                                    |
| `validators`               | `ContentValidator[]` | Custom content validators                                                   |
| `disableBuiltinValidators` | `boolean`            | Disable built-in markdown validators                                        |


## Loaders


| Type       | Extensions        | Description                                 |
| ---------- | ----------------- | ------------------------------------------- |
| `markdown` | `.md`             | gray-matter frontmatter + markdown body     |
| `json`     | `.json`           | JSON.parse                                  |
| `json5`    | `.json`           | Relaxed JSON with comments, trailing commas |
| `jsonc`    | `.json`, `.jsonc` | JSON with comments                          |
| `yaml`     | `.yml`, `.yaml`   | YAML                                        |
| `toml`     | `.toml`           | TOML                                        |


Custom loaders: implement `Loader { name, kind, extensions, load(filePath) }`.

## ContentLayerConfig

Top-level config passed to `defineConfig()` or `createContentLayer()`:


| Field         | Type              | Default   | Description                                              |
| ------------- | ----------------- | --------- | -------------------------------------------------------- |
| `collections` | `CollectionMap`   | —         | Named collections keyed by collection name               |
| `root`        | `string`          | `cwd()`   | Root directory for resolving relative collection paths    |
| `markdown`    | `MarkdownConfig`  | —         | Markdown processing config shared across all collections |
| `assets`      | `object`          | —         | `{ hashFilenames?, outputDir? }` for cache-busted assets |
| `plugins`     | `ContentPlugin[]` | —         | Content plugins for extending processing and validation  |
| `strict`      | `boolean`         | `false`   | Throw on file load errors instead of creating dummy entries |


### defineCollections

Helper for defining multiple collections with type inference:

```ts
import { defineCollections, z } from '@pagesmith/core'

const collections = defineCollections({
  posts: { loader: 'markdown', directory: 'content/posts', schema: z.object({ title: z.string() }) },
  pages: { loader: 'markdown', directory: 'content/pages', schema: z.object({ title: z.string() }) },
})
```

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


| Option        | Type               | Default                 | Description                 |
| ------------- | ------------------ | ----------------------- | --------------------------- |
| `collections` | `Collections`      | —                       | Collection definitions      |
| `moduleId`    | `string`           | `'virtual:content'`     | Virtual module prefix       |
| `configPath`  | `string`           | `'./content.config.ts'` | Config file path            |
| `dts`         | `boolean | string` | `true`                  | Generate .d.ts              |
| `contentRoot` | `string`           | `'content'`             | Shared root for contentSlug |
| `markdown`    | `MarkdownConfig`   | —                       | Markdown pipeline config    |


Import in your code:

```ts
import posts from 'virtual:content/posts'
// Markdown entries: { id, contentSlug, html, headings, frontmatter }[]
// Data loaders: { id, contentSlug, data }[]
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
remark-parse → remark-gfm → remark-frontmatter
  → remark-github-alerts → remark-smartypants
  → remark-math (when `markdown.math` is `true` or `'auto'` detects math markers)
  → [user remark plugins] → lang-alias transform → remark-rehype
  → rehype-mathjax (when math is enabled, before the built-in code renderer)
  → applyPagesmithCodeRenderer (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-code-tabs → rehype-scrollable-tables
  → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → [user rehype plugins] → rehype-stringify
```

### Markdown Configuration

```ts
type MarkdownConfig = {
  remarkPlugins?: any[]
  rehypePlugins?: any[]
  allowDangerousHtml?: boolean
  math?: boolean | 'auto'
  shiki?: {
    themes: { light: string; dark: string }
    langAlias?: Record<string, string>
    defaultShowLineNumbers?: boolean
  }
}
```

- `allowDangerousHtml` defaults to `true`. Disable it when rendering untrusted markdown content.
- `math` defaults to `'auto'`, which only enables `remark-math` and `rehype-mathjax` for pages that contain math markers.

### Code Block Meta Syntax (Built-in Renderer)


| Meta               | Example                  | Description            |
| ------------------ | ------------------------ | ---------------------- |
| `title="..."`      | ````js title="app.js"`   | File title             |
| `showLineNumbers`  | ````js showLineNumbers`  | Line numbers           |
| `mark={lines}`     | ````js mark={3,5-7}`     | Highlight lines        |
| `ins={lines}`      | ````js ins={4}`          | Inserted lines (green) |
| `del={lines}`      | ````js del={5}`          | Deleted lines (red)    |
| `collapse={lines}` | ````js collapse={1-5}`   | Collapsible section    |
| `wrap`             | ````js wrap`             | Text wrapping          |
| `frame="..."`      | ````js frame="terminal"` | Frame style            |


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


| Import Path                      | Contents                           |
| -------------------------------- | ---------------------------------- |
| `@pagesmith/core/css/content`    | Prose typography + code block styling |
| `@pagesmith/core/css/standalone` | Full layout + prose + TOC + code block styling |
| `@pagesmith/core/css/viewport`   | Responsive viewport base           |
| `@pagesmith/core/css/fonts`      | Bundled Open Sans + JetBrains Mono |


Code block styling is bundled in the core CSS exports. Highlight token colors and per-block theme vars are applied inline, while frame chrome, tabs, and layout ship in the shared CSS files.

## Theme System

Two orthogonal CSS class axes on `<html>`:

- **Color scheme**: `color-scheme-auto` (OS preference) | `color-scheme-light` | `color-scheme-dark`
- **Theme**: `theme-paper` (warm, low-contrast) | `theme-high-contrast` (WCAG AAA-friendly)

Server default: `<html class="color-scheme-auto theme-paper">`. An inline FOUC-prevention script reads `localStorage('pagesmith-theme')` and swaps classes before first paint.

Color scheme classes set the CSS `color-scheme` property, which controls `light-dark()` token resolution. Theme classes override CSS custom properties with variant-specific `light-dark()` pairs.

Image switching uses class-based rules instead of `@media (prefers-color-scheme)`:
- `.only-light` / `.only-dark` — show/hide images per scheme
- `.show-on-light` / `.show-on-dark` — generic visibility helpers
- `.invert-on-dark` — applies `filter: invert(1)` in dark mode

## Runtime Exports

```ts
import { getRuntimeCSS, getRuntimeJS, getContentCSS, getContentJS } from '@pagesmith/core/runtime'
```

Two tiers:

- **Standalone** (`getRuntimeCSS/JS`) — full site with TOC highlight
- **Content** (`getContentCSS/JS`) — markdown rendering only

Load `@pagesmith/core/runtime/content` when you want Pagesmith's built-in code tabs, copy button behavior, and collapsed-line toggles in the browser without wiring the pieces manually.

## Frontmatter Schemas


| Schema                     | Fields                                                        |
| -------------------------- | ------------------------------------------------------------- |
| `BaseFrontmatterSchema`    | title, description, publishedDate, lastUpdatedOn, tags, draft |
| `BlogFrontmatterSchema`    | extends base + category, featured, coverImage                 |
| `ProjectFrontmatterSchema` | extends base + gitRepo, links                                 |


## Export Map


| Import Path                      | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `@pagesmith/core`                | Main API (defineCollection, createContentLayer, z, etc.) |
| `@pagesmith/core/jsx-runtime`    | h, Fragment, HtmlString                                  |
| `@pagesmith/core/markdown`       | processMarkdown                                          |
| `@pagesmith/core/css`            | buildCss (LightningCSS)                                  |
| `@pagesmith/core/css/content`    | Content CSS file                                         |
| `@pagesmith/core/css/code-block` | Block code CSS file                                      |
| `@pagesmith/core/css/code-inline` | Inline code CSS file                                     |
| `@pagesmith/core/css/standalone` | Standalone CSS file                                      |
| `@pagesmith/core/css/viewport`   | Viewport CSS file                                        |
| `@pagesmith/core/css/fonts`      | Bundled font faces                                       |
| `@pagesmith/core/schemas`        | Zod schemas and types                                    |
| `@pagesmith/core/loaders`        | Loader classes and registry                              |
| `@pagesmith/core/assets`         | Asset copying and hashing                                |
| `@pagesmith/core/runtime`        | Pre-built CSS/JS accessors                               |
| `@pagesmith/core/runtime/content` | Browser runtime for code tabs, copy, and collapsed lines |
| `@pagesmith/core/runtime/standalone` | Browser runtime for content interactivity + TOC highlight |
| `@pagesmith/core/vite`           | Vite plugins                                             |
| `@pagesmith/core/ssg-utils`      | Shared SSG utility helpers                               |
| `@pagesmith/core/ai`             | AI assistant artifact generator                          |
| `@pagesmith/core/create`         | Project scaffolding                                      |
| `@pagesmith/core/mcp`            | Core MCP server and helper utilities                     |


## Key Rules

- Always use `z` re-exported from `@pagesmith/core`, not from `zod` directly
- Prefer folder-based entries (`guide/getting-started/README.md`) when content references sibling assets
- The `render()` result is cached — call `clearRenderCache()` to force re-render
- `getCollection()` results are cached — use `invalidate*()` methods for cache busting
- Runtime JS handles TOC highlighting and Pagesmith code-block interactivity. Load `@pagesmith/core/runtime/content` or the runtime JS accessors instead of injecting ad-hoc inline scripts.
- All exports are named (no default exports from core)
- Code block styling comes from the shipped core CSS bundles — include `@pagesmith/core/css/content` or `@pagesmith/core/css/standalone` for rendered markdown

## Related Docs

- **Agent prompts and rules:** `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- **Step-by-step recipes:** `node_modules/@pagesmith/core/ai-guidelines/recipes.md`
- **Error catalog:** `node_modules/@pagesmith/core/ai-guidelines/errors.md`
- **User README:** `node_modules/@pagesmith/core/README.md`
- **Docs package reference:** `node_modules/@pagesmith/docs/REFERENCE.md`
- **Docs package README:** `node_modules/@pagesmith/docs/README.md`

