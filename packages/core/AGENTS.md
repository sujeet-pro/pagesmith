# @pagesmith/core

Headless content-layer package. Provides collections, loaders, markdown processing, validation, assets helpers, the `pagesmithContent` Vite plugin, MCP support, and the AI installer.

Published as `@pagesmith/core` on npm. Part of the `@pagesmith/` workspace.

Site-building APIs now live in `@pagesmith/site`. If you see legacy JSX/CSS/runtime source trees here during the split, treat them as internal migration leftovers rather than the public package contract.

## Directory map

```text
src/
  index.ts                        Main barrel — re-exports all public API
  config.ts                       defineConfig(), defineCollection() identity helpers
  content-layer.ts                ContentLayer interface + createContentLayer() factory
  entry.ts                        ContentEntry class (slug, data, lazy render())
  store.ts                        ContentStore — internal cache, file discovery, loading, validation
  convert.ts                      convert() — markdown-to-HTML convenience wrapper
  frontmatter.ts                  extractFrontmatter(), validateFrontmatter() via gray-matter + Zod
  toc.ts                          extractToc() — regex-based heading extraction from HTML

  markdown/
    index.ts                      Re-exports processMarkdown, MarkdownResult
    pipeline.ts                   Unified pipeline: remark-parse → remark-gfm → remark-frontmatter →
                                    remark-github-alerts → remark-smartypants →
                                    optional remark-math/rehype-mathjax → (user remark plugins) →
                                    lang-alias transform → remark-rehype → applyPagesmithCodeRenderer →
                                    rehype-code-tabs → rehype-scrollable-tables →
                                    rehype-slug → rehype-autolink-headings →
                                    rehype-external-links → rehype-accessible-emojis →
                                    rehype-local-images →
                                    heading extraction → (user rehype plugins) → rehype-stringify
    plugins/
      rehype-code-tabs.ts         Group consecutive titled code blocks into tabs
      rehype-local-images.ts      Fill intrinsic image dimensions and JPEG picture fallbacks
      rehype-scrollable-tables.ts Wrap markdown tables for horizontal scrolling

  schemas/
    index.ts                      Barrel for all Zod schemas and inferred types
    base-config.ts                Base configuration schema shared across config formats
    collection.ts                 CollectionDef<S>, RawEntry types
    content-config.ts             ContentLayerConfig, ContentPlugin types
    markdown-config.ts            MarkdownConfig, MarkdownConfigSchema (shiki themes, plugins)
    frontmatter.ts                BaseFrontmatterSchema, BlogFrontmatterSchema,
                                    ProjectFrontmatterSchema + inferred types
    heading.ts                    Heading, HeadingSchema (depth, text, slug)

  loaders/
    index.ts                      Loader registry — resolveLoader(), defaultIncludePatterns()
    types.ts                      Loader, LoaderResult, LoaderType interfaces
    errors.ts                     LoaderError class
    markdown.ts                   MarkdownLoader — gray-matter frontmatter + body
    json.ts                       JsonLoader — JSON / JSON5
    jsonc.ts                      JsoncLoader — comment-stripped JSON parsed with JSON.parse
    yaml.ts                       YamlLoader — YAML via yaml package
    toml.ts                       TomlLoader — TOML via smol-toml

  validation/
    index.ts                      Barrel re-exports for validators and types
    types.ts                      ContentValidator, ValidatorContext interfaces
    schema-validator.ts           validateSchema() — Zod safeParse with structured ValidationIssue[]
    runner.ts                     runValidators(), builtinMarkdownValidators array
    link-validator.ts             Warn on bare URLs, empty link text, suspicious protocols
    heading-validator.ts          Enforce single h1, sequential depth, non-empty text
    code-block-validator.ts       Warn when meta is used without a language and on unknown meta properties

  ai/
    index.ts                      installAiArtifacts(), getAiArtifacts(), getAiArtifactContent()
                                    Generates memory/skill/llms files for Claude, Codex, Gemini

  assets/
    index.ts                      Re-exports copyPublicFiles, hashAssets
    copier.ts                     Copy static files to output
    hasher.ts                     Content-hash filenames for cache busting

  plugins/
    index.ts                      collectRemarkPlugins(), collectRehypePlugins(), runPluginValidators()
    types.ts                      Re-exports ContentPlugin from schemas

  utils/
    index.ts                      Barrel for utility functions
    glob.ts                       discoverFiles() — fast-glob wrapper for collection file discovery
    read-time.ts                  computeReadTime() — word count estimate
    slug.ts                       toSlug() — file path to URL-safe slug

  __tests__/
    frontmatter.test.ts           Frontmatter extraction and validation tests
    loaders.test.ts               Loader integration tests
```

## Key types

### ContentLayer (content-layer.ts)

The main API object. Created via `createContentLayer(config)`.

- `getCollection(name)` — load and return all entries in a collection
- `getEntry(collection, slug)` — get a single entry by slug
- `convert(markdown, options?)` — convert raw markdown to HTML outside of collections
- `invalidate(collection, slug)` / `invalidateCollection(name)` / `invalidateAll()` — cache busting
- `validate(collection?)` — run all validators, return `ValidationResult[]`
- `getCollectionNames()` / `getCollectionDef(name)` / `getCollections()` — introspect configuration
- `invalidateWhere(collection, predicate)` — invalidate entries matching a predicate
- `watch(callback)` — watch collection directories for changes
- `getCacheStats()` — get cache size stats per collection

### ContentEntry<T> (entry.ts)

Represents a single loaded content entry. Properties: `slug`, `collection`, `filePath`, `data` (validated frontmatter/data of type `T`), `rawContent` (markdown body, if applicable).

- `render(options?)` — lazy markdown-to-HTML; returns `RenderedContent` (html, headings, readTime). Cached after first call.
- `clearRenderCache()` — force re-render on next `render()` call.

### ContentLayerConfig (schemas/content-config.ts)

Top-level config passed to `defineConfig()`. Fields: `collections`, `root`, `markdown`, `assets`, `plugins`, `strict`.

### CollectionDef<S> (schemas/collection.ts)

Collection definition passed to `defineCollection()`. Fields: `loader`, `directory`, `schema` (Zod), `include`, `exclude`, `computed`, `validate`, `filter`, `slugify`, `transform`, `validators`, `disableBuiltinValidators`.

### ConvertOptions / ConvertResult (convert.ts)

`ConvertOptions`: `markdown` (MarkdownConfig).
`ConvertResult`: `html`, `headings` (Heading[]), deprecated alias `toc`, `frontmatter`.

### MarkdownConfig (schemas/markdown-config.ts)

Pipeline customization: `remarkPlugins`, `rehypePlugins`, `allowDangerousHtml`, `math` (`true` | `false` | `'auto'`), and `shiki` (themes, langAlias, defaultShowLineNumbers).

### Heading (schemas/heading.ts)

`{ depth: number, text: string, slug: string }`

### Frontmatter schemas (schemas/frontmatter.ts)

- `BaseFrontmatterSchema` — title, description, publishedDate, lastUpdatedOn, tags, draft
- `BlogFrontmatterSchema` — extends base with category, featured, coverImage
- `ProjectFrontmatterSchema` — extends base with gitRepo, links

## Markdown pipeline

The pipeline is built in `src/markdown/pipeline.ts` using `unified`. The full chain:

```
remark-parse                       Parse markdown to MDAST
  -> remark-gfm                   Tables, strikethrough, task lists, autolinks
  -> remark-frontmatter            Strip YAML frontmatter from AST
  -> remark-github-alerts          GitHub-style alert/callout blocks
  -> remark-smartypants            Typographic quotes, dashes, ellipses
  -> remark-math (optional)        Enabled when `markdown.math` is `true` or `'auto'` detects math markers
  -> [user remark plugins]         From MarkdownConfig.remarkPlugins
  -> lang-alias transform          Resolve language aliases for the built-in code renderer
  -> remark-rehype                 MDAST -> HAST (`allowDangerousHtml` defaults to true)
  -> rehype-mathjax/svg            Render math to SVG when math is enabled
  -> applyPagesmithCodeRenderer    Syntax highlighting + code frames + copy + tabs
  -> rehype-code-tabs              Group consecutive titled code blocks into tabs
  -> rehype-scrollable-tables      Wrap markdown tables for overflow-safe scrolling
  -> rehype-slug                   Add id="" to headings
  -> rehype-autolink-headings      Wrap heading text in anchor links
  -> rehype-external-links         Add target/rel to external links
  -> rehype-accessible-emojis      Wrap emojis in accessible spans
  -> rehype-local-images           Fill intrinsic image dimensions and JPEG picture fallbacks
  -> heading extraction            Custom plugin: walk HAST, collect Heading[]
  -> [user rehype plugins]         From MarkdownConfig.rehypePlugins
  -> rehype-stringify              Serialize HAST to HTML string
```

The processor is cached per `MarkdownConfig` object reference (WeakMap).

The built-in Pagesmith code renderer handles syntax highlighting with dual themes (default: github-light/github-dark), file titles, line numbers, copy buttons, collapsible sections, line highlighting (mark/ins/del), text wrapping, and frame styles. Shared frame chrome ships in the CSS bundles, while the shared content runtime handles tabs, copy, and collapse interactions in the browser.

Code block meta string syntax:

````
```js title="app.js" showLineNumbers=false collapse={1-5,12-14} mark={3} ins={4} del={5}
````

## Content layer API

```ts
import { createContentLayer, defineCollection, defineConfig, z } from "@pagesmith/core";

const posts = defineCollection({
  loader: "markdown",
  directory: "content/posts",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const config = defineConfig({
  collections: { posts },
  markdown: { shiki: { themes: { light: "github-light", dark: "github-dark" } } },
});

const layer = createContentLayer(config);
const entries = await layer.getCollection("posts");
const rendered = await entries[0]?.render();
// rendered.html, rendered.headings, rendered.readTime
```

- `defineConfig(config)` — type-safe identity function for `ContentLayerConfig`.
- `defineCollection(def)` — type-safe identity function for `CollectionDef<S>`, infers Zod schema type.
- `createContentLayer(config)` — returns a `ContentLayer` backed by `ContentStore`.
- `getCollection(name)` — discovers files via fast-glob, loads through the registered loader, validates against the Zod schema, runs content validators, caches results.
- `getEntry(collection, slug)` — loads collection first (if not cached), then returns by slug.
- `entry.render()` — processes `rawContent` through the markdown pipeline. Cached after first call.

## Loaders

Each loader implements `{ name, extensions, load(filePath) -> LoaderResult }`.

| Loader type | Class            | Extensions      | Notes                                      |
| ----------- | ---------------- | --------------- | ------------------------------------------ |
| `markdown`  | `MarkdownLoader` | `.md`           | gray-matter frontmatter + body content     |
| `json`      | `JsonLoader`     | `.json`         | JSON.parse, full object as data            |
| `json5`     | `JsonLoader`     | `.json5`        | Same class, JSON5.parse based on extension |
| `jsonc`     | `JsoncLoader`    | `.jsonc`        | Comment stripping + JSON.parse             |
| `yaml`      | `YamlLoader`     | `.yml`, `.yaml` | yaml package                               |
| `toml`      | `TomlLoader`     | `.toml`         | smol-toml                                  |

Custom loaders: implement the `Loader` interface and pass an instance as `loader` in `CollectionDef`.

## Validation system

### Schema validation

`validateSchema(data, zodSchema)` wraps `safeParse` and returns `{ issues: ValidationIssue[], validatedData }`. Issues carry `field` (path string), `message`, and `severity` ('error' | 'warn').

### Content validators

Run on the raw MDAST (parsed once, shared across validators via `ValidatorContext.mdast`).

Built-in validators (`builtinMarkdownValidators`):

- **linkValidator** — warns on bare URLs, empty link text, suspicious protocols
- **headingValidator** — enforces single h1, sequential heading depth, non-empty text
- **codeBlockValidator** — warns when meta is used without a language and on unknown meta properties

Custom validators: implement `ContentValidator { name, validate(ctx) }` and add to `CollectionDef.validators`. Disable built-ins with `disableBuiltinValidators: true`.

`runValidators(ctx, validators)` executes all validators, catches thrown errors as error-severity issues.

### Plugin validation

`ContentPlugin.validate` runs after loader/schema/content validation. Returns `string[]` of error messages.

## Site-building split

`@pagesmith/core` is the headless content layer. For site-building concerns, pair it with `@pagesmith/site`:

- JSX runtime: `@pagesmith/site/jsx-runtime`
- CSS builder + CSS bundles: `@pagesmith/site/css`
- Runtime CSS/JS accessors: `@pagesmith/site/runtime`
- SSG helpers: `@pagesmith/site/vite` and `@pagesmith/site/ssg-utils`

## Export map

The package exposes multiple entry points via `exports` in package.json:

| Import path                | Source                  | Purpose                                  |
| -------------------------- | ----------------------- | ---------------------------------------- |
| `@pagesmith/core`          | `src/index.ts`          | Main API barrel                          |
| `@pagesmith/core/markdown` | `src/markdown/index.ts` | processMarkdown                          |
| `@pagesmith/core/schemas`  | `src/schemas/index.ts`  | Zod schemas and types                    |
| `@pagesmith/core/loaders`  | `src/loaders/index.ts`  | Loader classes and registry              |
| `@pagesmith/core/assets`   | `src/assets/index.ts`   | Asset copying and hashing                |
| `@pagesmith/core/vite`     | `src/vite/index.ts`     | Vite content plugin (`pagesmithContent`) |
| `@pagesmith/core/create`   | `src/create/index.ts`   | Project scaffolding utilities            |
| `@pagesmith/core/mcp`      | `src/mcp/index.ts`      | Core MCP server and helpers              |
| `@pagesmith/core/ai`       | `src/ai/index.ts`       | AI assistant file installer              |

## Coding conventions

- **Trailing commas** everywhere (arrays, objects, parameters, imports).
- **ESM only** — `"type": "module"` in package.json. No CommonJS.
- **Zod schemas** for all validation. Re-exports `z` from `zod` for consumer convenience.
- **No default exports** — all exports are named.
- **Node platform** — build target is Node (`platform: 'node'` in vite.config.ts).
- **Tests** in `src/__tests__/` colocated with source, run via `vp test`.
- **Build** via `vp pack` (vite-plus), outputs to `dist/` as ESM with source maps and declarations.
- **Processor caching** — the unified markdown processor is cached per `MarkdownConfig` reference via `WeakMap` to avoid rebuilding the plugin chain on every call.

## Package AI files

These files are part of the package contract and must be kept current when `@pagesmith/core` behavior changes:

- `skills/pagesmith-core-setup/references/setup-core.md`
- `skills/pagesmith-core-setup/references/core-guidelines.md`
- `skills/pagesmith-core-setup/references/markdown-guidelines.md`
- `llms.txt`
- `llms-full.txt`
- `skills/pagesmith-core-setup/references/usage.md`
- `skills/pagesmith-core-setup/references/recipes.md`
- `skills/pagesmith-core-setup/references/errors.md`
- `skills/pagesmith-core-setup/references/migration.md`
- `skills/pagesmith-core-setup/references/changelog-notes.md`
- `skills/pagesmith-core-setup/references/AGENTS.md.template`
