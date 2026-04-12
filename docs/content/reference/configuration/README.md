---
title: Configuration
description: ContentLayerConfig and CollectionDef for @pagesmith/core, plus how docs sites use pagesmith.config.json5.
---

# Configuration

This page covers all configuration formats used across Pagesmith: the `ContentLayerConfig` for `@pagesmith/core` and the `pagesmith.config.json5` for `@pagesmith/docs`.

## ContentLayerConfig

The configuration object passed to `defineConfig()` and `createContentLayer()`:

```ts title="content.config.ts"
import { defineConfig } from '@pagesmith/core'

defineConfig({
  // Named content collections (required)
  collections: { posts, pages, authors },

  // Root directory for resolving relative paths (defaults to cwd())
  root: process.cwd(),

  // Markdown processing configuration
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
    shiki: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      langAlias: { hbs: 'handlebars' },
      defaultShowLineNumbers: true,
    },
  },

  // Asset hashing configuration
  assets: {
    hashFilenames: false,
    outputDir: undefined,
  },

  // In-memory caching of loaded entries (default: implicit)
  cache: true,

  // Load all entries eagerly on creation
  eager: false,

  // Content plugins for pipeline extension and validation
  plugins: [],
})
```

### ContentLayerConfig Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `collections` | `CollectionMap` | Required | Named collection definitions |
| `root` | `string` | `process.cwd()` | Root directory for resolving relative collection paths |
| `markdown` | `MarkdownConfig` | `{}` | Markdown pipeline configuration |
| `assets` | `{ hashFilenames?: boolean; outputDir?: string }` | `undefined` | Asset hashing configuration |
| `cache` | `boolean` | `undefined` | Enable in-memory caching of loaded entries |
| `eager` | `boolean` | `undefined` | Load all entries eagerly on creation |
| `plugins` | `ContentPlugin[]` | `[]` | Content plugins for pipeline and validation |

## CollectionDef

The collection definition object passed to `defineCollection()`:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `loader` | `LoaderType \| Loader` | Yes | -- | Built-in loader type string (`'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`) or a custom `Loader` instance |
| `directory` | `string` | Yes | -- | Directory containing collection files, relative to `root` |
| `schema` | `ZodType` | Yes | -- | Zod schema for validating entry data |
| `include` | `string[]` | No | Derived from loader | Glob patterns to include (defaults to `**/*<ext>` from loader extensions) |
| `exclude` | `string[]` | No | `[]` | Glob patterns to exclude |
| `computed` | `Record<string, (entry) => any>` | No | `{}` | Computed fields merged into `entry.data` after validation |
| `transform` | `(entry: RawEntry) => RawEntry` | No | Identity | Pre-validation transform (can be async) |
| `filter` | `(entry) => boolean` | No | Always true | Post-validation filter; return `false` to exclude |
| `slugify` | `(filePath, directory) => string` | No | `toSlug()` | Custom slug generation from file path |
| `validate` | `(entry) => string \| undefined` | No | -- | Lightweight validation hook; return string to report error |
| `validators` | `ContentValidator[]` | No | `[]` | Custom content validators (for markdown AST inspection) |
| `disableBuiltinValidators` | `boolean` | No | `false` | Disable built-in link, heading, and code block validators |

## MarkdownConfig

Customizes the unified markdown processing pipeline:

```ts title="MarkdownConfig"
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

| Field | Type | Default | Description |
|---|---|---|---|
| `remarkPlugins` | `any[]` | `[]` | Additional remark plugins, injected after built-in plugins and before remark-to-rehype conversion |
| `rehypePlugins` | `any[]` | `[]` | Additional rehype plugins, injected after built-in plugins and before HTML serialization |
| `allowDangerousHtml` | `boolean` | `true` | Preserve raw HTML from markdown. Disable this when rendering untrusted content. |
| `math` | `boolean \| 'auto'` | `'auto'` | Always enable math plugins, disable them, or auto-enable them only for markdown that contains math markers. |
| `shiki.themes` | `{ light: string; dark: string }` | `{ light: 'github-light', dark: 'github-dark' }` | Dual theme names for built-in code renderer syntax highlighting |
| `shiki.langAlias` | `Record<string, string>` | `undefined` | Map of custom language aliases to language identifiers (e.g., `{ dockerfile: 'docker' }`) |
| `shiki.defaultShowLineNumbers` | `boolean` | `true` | Show line numbers on code blocks by default. Individual blocks can override with `showLineNumbers=false`. |

Plugins can be passed as bare functions or `[plugin, options]` tuples:

```ts title="content.config.ts"
markdown: {
  remarkPlugins: [
    remarkEmoji,
    [remarkToc, { heading: 'contents' }],
  ],
  rehypePlugins: [
    [rehypeExternalLinks, { target: '_blank' }],
  ],
}
```

## ContentPlugin

Plugins extend the markdown pipeline and validation:

```ts title="ContentPlugin"
type ContentPlugin = {
  name: string
  rehypePlugin?: () => (tree: any) => void
  remarkPlugin?: () => (tree: any) => void
  validate?: (entry: { data: Record<string, any>; content?: string }) => string[]
}
```

- `remarkPlugin` and `rehypePlugin` are appended to the pipeline during rendering.
- `validate` runs during the loading phase, after schema and content validators. Returns `string[]` of error messages.

## pagesmith.config.json5

The `@pagesmith/docs` package is configured through a JSON5 file. See the [Docs Configuration Reference](/reference/docs-config/) for the full specification.

Quick example:

```json5 title="pagesmith.config.json5"
{
  name: "My Docs",
  title: "My Project Documentation",
  contentDir: "./content",
  outDir: "./dist",
  basePath: "/",
  search: { enabled: true },
  markdown: {
    shiki: {
      themes: { light: "github-light", dark: "github-dark" },
    },
  },
}
```

## Collection Defaults

- Loader-specific include globs are inferred automatically from the loader's `extensions` array.
- Built-in markdown validators (link, heading, code block) are enabled unless `disableBuiltinValidators` is set.
- Schema validation returns structured issues and preserves raw data when parsing fails, so entries with validation errors are still accessible.
- The markdown processor is cached per `MarkdownConfig` object reference via a `WeakMap`, avoiding pipeline reconstruction on every call.
