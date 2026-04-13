# @pagesmith/core — AI Reference

Link this file from your project's CLAUDE.md or AGENTS.md to give AI assistants a comprehensive reference for `@pagesmith/core`.

```markdown
<!-- In your CLAUDE.md or AGENTS.md -->
For the full @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
For @pagesmith/core setup and follow-up prompts, read: node_modules/@pagesmith/core/ai-guidelines/setup-core.md and node_modules/@pagesmith/core/ai-guidelines/usage.md
```

---

## Overview

`@pagesmith/core` is the Pagesmith headless content layer. It provides schema-validated content collections, lazy markdown rendering with a built-in Shiki-backed code renderer, validation, loaders, schemas, assets helpers, and the Vite content plugin.

ESM only (`"type": "module"`). Node 24+.

## Adoption Paths

- AI-first bootstrap or retrofit: `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`
- Follow-up usage patterns and prompts: `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- Upgrade an existing integration: `node_modules/@pagesmith/core/ai-guidelines/migration.md`
- Pair `@pagesmith/core` with `@pagesmith/site` when you need the Pagesmith JSX runtime, CSS/runtime bundles, Vite SSG helpers, or the `pagesmith-site` CLI
- Use `@pagesmith/docs` instead when you want the opinionated docs preset on top of both packages

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
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    pagesmithContent({ collections }),
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

For site-building concerns, move to `@pagesmith/site`:

- `pagesmithSsg`, `sharedAssetsPlugin`, `prerenderRoutes`
- `SsgRenderConfig`
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/ssg-utils`

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

## Build A Site On Top Of Core

`@pagesmith/core` intentionally stops at the content boundary.

If your app already owns routing and build tooling, use `createContentLayer()` plus `entry.render()` directly. This is the recommended shape for framework hosts such as Next.js or custom SSR apps.

Use `@pagesmith/site` for:

- the Pagesmith JSX runtime
- CSS bundles and CSS builder
- browser runtime helpers such as TOC highlighting and theme/font-size persistence
- Vite SSG helpers
- shared SSG utilities
- the `pagesmith-site` CLI and preset loading

For framework-hosted apps that already own the shell, `@pagesmith/site` can stay limited to `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content`.

Typical split:

```ts
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

## Frontmatter Schemas


| Schema                     | Fields                                                        |
| -------------------------- | ------------------------------------------------------------- |
| `BaseFrontmatterSchema`    | title, description, publishedDate, lastUpdatedOn, tags, draft |
| `BlogFrontmatterSchema`    | extends base + category, featured, coverImage                 |
| `ProjectFrontmatterSchema` | extends base + gitRepo, links                                 |


## Export Map


| Import Path                      | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `@pagesmith/core`         | Main API (defineCollection, createContentLayer, z, etc.) |
| `@pagesmith/core/markdown` | `processMarkdown` |
| `@pagesmith/core/schemas` | Zod schemas and types |
| `@pagesmith/core/loaders` | Loader classes and registry |
| `@pagesmith/core/assets`  | Asset copying and hashing |
| `@pagesmith/core/vite`    | Vite content plugin (`pagesmithContent`) |
| `@pagesmith/core/ai`      | AI assistant artifact generator |
| `@pagesmith/core/create`  | Project scaffolding |
| `@pagesmith/core/mcp`     | Core MCP server and helper utilities |


## Key Rules

- Always use `z` re-exported from `@pagesmith/core`, not from `zod` directly
- Prefer folder-based entries (`guide/getting-started/README.md`) when content references sibling assets
- The `render()` result is cached — call `clearRenderCache()` to force re-render
- `getCollection()` results are cached — use `invalidate*()` methods for cache busting
- All exports are named (no default exports from core)
- Site-building concerns such as JSX, CSS, runtime JS, and SSG belong in `@pagesmith/site`

## Related Docs

- **Setup prompt:** `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`
- **Agent prompts and rules:** `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- **Step-by-step recipes:** `node_modules/@pagesmith/core/ai-guidelines/recipes.md`
- **Error catalog:** `node_modules/@pagesmith/core/ai-guidelines/errors.md`
- **User README:** `node_modules/@pagesmith/core/README.md`
- **Site toolkit reference:** `node_modules/@pagesmith/site/REFERENCE.md`
- **Site toolkit README:** `node_modules/@pagesmith/site/README.md`
- **Docs package reference:** `node_modules/@pagesmith/docs/REFERENCE.md`
- **Docs package README:** `node_modules/@pagesmith/docs/README.md`

