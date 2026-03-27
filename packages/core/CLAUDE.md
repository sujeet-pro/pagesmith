# @pagesmith/core

Core file-based CMS package. Provides the content layer, markdown pipeline, JSX runtime, CSS builder, schemas, loaders, validation, diagrams integration, and AI installer.

Published as `@pagesmith/core` on npm. Part of the `@pagesmith/` workspace.

## Directory map

```text
cli/
  bin.ts                          CLI entry point (convert, toc, diagrams, ai install)
  diagrams.ts                     Legacy diagram CLI re-export

src/
  index.ts                        Main barrel — re-exports all public API
  config.ts                       defineConfig(), defineCollection() identity helpers
  content-layer.ts                ContentLayer interface + createContentLayer() factory
  entry.ts                        ContentEntry class (slug, data, lazy render())
  store.ts                        ContentStore — internal cache, file discovery, loading, validation
  convert.ts                      convert() — full/fragment markdown-to-HTML with optional layout
  document.ts                     generateDocument() — wrap HTML in <!DOCTYPE> shell
  layout-engine.ts                applyLayout() — call a JSX layout function on CoreLayoutProps
  frontmatter.ts                  extractFrontmatter(), validateFrontmatter() via gray-matter + Zod
  toc.ts                          extractToc() — regex-based heading extraction from HTML

  markdown/
    index.ts                      Re-exports processMarkdown, MarkdownResult
    pipeline.ts                   Unified pipeline: remark-parse → remark-gfm → remark-math →
                                    remark-frontmatter → (user remark plugins) → remark-rehype →
                                    rehype-mathjax → rehype-slug → rehype-autolink-headings →
                                    rehype-shiki → rehype-code-tabs → heading extraction →
                                    (user rehype plugins) → rehype-stringify
    plugins/
      index.ts                    Re-exports codeBlockTransformers, rehypeCodeTabs
      shiki-transformers.ts       Custom Shiki transformers: line highlight, code frame
                                    (lang badge, title, line numbers, copy button, collapse)
      rehype-code-tabs.ts         Rehype plugin: merge consecutive fenced blocks into tabbed UI

  jsx-runtime/
    index.ts                      h(), Fragment(), HtmlString — server-side JSX-to-HTML runtime

  css/
    index.ts                      Re-exports buildCss
    builder.ts                    buildCss() — LightningCSS bundler with browser targets

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
    jsonc.ts                      JsoncLoader — JSON with comments (json5)
    yaml.ts                       YamlLoader — YAML via yaml package
    toml.ts                       TomlLoader — TOML via smol-toml

  validation/
    index.ts                      Barrel re-exports for validators and types
    types.ts                      ContentValidator, ValidatorContext interfaces
    schema-validator.ts           validateSchema() — Zod safeParse with structured ValidationIssue[]
    runner.ts                     runValidators(), builtinMarkdownValidators array
    link-validator.ts             Warn on bare URLs, empty link text, suspicious protocols
    heading-validator.ts          Enforce single h1, sequential depth, non-empty text
    code-block-validator.ts       Warn on missing language, unknown language aliases

  diagrams/
    index.ts                      renderDiagrams(), watchDiagrams() — delegates to diagramkit
    rehype-diagram-images.ts      rehypeDiagramImages — rewrite <img> src for rendered diagram outputs

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

  runtime/
    index.ts                      CSS/JS asset accessors (getRuntimeCSS, getContentCSS, etc.)
    standalone.ts                 Standalone runtime JS (copy-code, TOC highlight)
    content.ts                    Content-only runtime JS (copy-code)
    copy-code.ts                  Copy button click handler
    toc-highlight.ts              Active TOC heading highlight on scroll

  ssg/
    index.ts                      Re-exports buildSite, BuildSiteOptions
    builder.ts                    buildSite() — render all entries to static HTML
    bundler.ts                    JS/CSS bundling for SSG output
    dev-server.ts                 Development server with live reload
    preview-server.ts             Preview server for built output
    types.ts                      SSG-related type definitions
    ws-client.ts                  WebSocket client for dev server hot reload

  layouts/
    standalone.tsx                Default standalone layout (JSX)
    components/
      Document.tsx                <Document> shell component
      TOCSidebar.tsx              <TOCSidebar> component

  styles/
    standalone.css                Full standalone bundle (imports all below)
    content.css                   Content-only bundle (reset + prose + code + diagrams + viewport)
    diagrams.css                  Diagram image styles (light/dark switching)
    viewport.css                  Viewport / responsive base
    foundations/
      reset.css                   CSS reset
      tokens.css                  Design tokens as custom properties
    content/
      prose.css                   Prose typography
      toc.css                     Table of contents sidebar
    code/
      block.css                   Code block frame
      inline.css                  Inline code
      lang-icons.css              Language badge icons
      line-features.css           Line numbers, highlighting, diff marks
      tabs.css                    Code tab UI
    layout/
      grid.css                    Page grid
      sidebar.css                 Sidebar layout
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
- `renderDiagrams(options?)` — render diagrams in all markdown collection directories
- `getCollectionNames()` / `getCollectionDef(name)` — introspect configuration

### ContentEntry<T> (entry.ts)

Represents a single loaded content entry. Properties: `slug`, `collection`, `filePath`, `data` (validated frontmatter/data of type `T`), `rawContent` (markdown body, if applicable).

- `render(options?)` — lazy markdown-to-HTML; returns `RenderedContent` (html, headings, readTime). Cached after first call.
- `clearRenderCache()` — force re-render on next `render()` call.

### ContentLayerConfig (schemas/content-config.ts)

Top-level config passed to `defineConfig()`. Fields: `collections`, `root`, `markdown`, `diagrams`, `assets`, `cache`, `eager`, `plugins`.

### CollectionDef<S> (schemas/collection.ts)

Collection definition passed to `defineCollection()`. Fields: `loader`, `directory`, `schema` (Zod), `include`, `exclude`, `computed`, `validate`, `filter`, `slugify`, `transform`, `validators`, `disableBuiltinValidators`.

### ConvertOptions / ConvertResult (convert.ts)

`ConvertOptions`: `markdown`, `mode` (full/fragment), `layout`, `css`, `js`, `cssPath`, `jsPath`, `noToc`.
`ConvertResult`: `html`, `toc` (Heading[]), `frontmatter`.

### MarkdownConfig (schemas/markdown-config.ts)

Pipeline customization: `remarkPlugins`, `rehypePlugins`, `shiki` (themes, langAlias, defaultShowLineNumbers).

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
  -> remark-math                  Math blocks ($...$, $$...$$)
  -> remark-frontmatter            Strip YAML frontmatter from AST
  -> [user remark plugins]         From MarkdownConfig.remarkPlugins
  -> remark-rehype                 MDAST -> HAST (allowDangerousHtml: true)
  -> rehype-mathjax/svg            Render math to SVG
  -> rehype-slug                   Add id="" to headings
  -> rehype-autolink-headings      Wrap heading text in anchor links
  -> @shikijs/rehype               Syntax highlighting with dual themes
     (transformers: line-highlight + code-frame)
  -> rehype-code-tabs              Merge consecutive code blocks into tabs
  -> heading extraction            Custom plugin: walk HAST, collect Heading[]
  -> [user rehype plugins]         From MarkdownConfig.rehypePlugins
  -> [content plugins]             Remark/rehype from ContentPlugin[]
  -> [rehype-diagram-images]       Rewrite diagram <img> src (when diagrams enabled)
  -> rehype-stringify              Serialize HAST to HTML string
```

The processor is cached per `MarkdownConfig` object reference (WeakMap).

Shiki defaults: `github-light` / `github-dark` dual themes. Custom transformers add language badges, titles, line numbers, copy buttons, collapsible sections, and line highlighting (mark/ins/del).

Code block meta string syntax:
```
```js title="app.js" hideLineNumbers collapse={1-5,12-14} mark={3} ins={4} del={5}
```

## Content layer API

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

const config = defineConfig({
  collections: { posts },
  markdown: { shiki: { themes: { light: 'github-light', dark: 'github-dark' } } },
  diagrams: { enabled: true, displayMode: 'picture' },
})

const layer = createContentLayer(config)
const entries = await layer.getCollection('posts')
const rendered = await entries[0]?.render()
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

| Loader type | Class            | Extensions       | Notes                                    |
|-------------|------------------|------------------|------------------------------------------|
| `markdown`  | `MarkdownLoader` | `.md`            | gray-matter frontmatter + body content   |
| `json`      | `JsonLoader`     | `.json`          | JSON.parse, full object as data          |
| `json5`     | `JsonLoader`     | `.json`          | Same class, json5 parse                  |
| `jsonc`     | `JsoncLoader`    | `.json`, `.jsonc`| JSON with comments via json5             |
| `yaml`      | `YamlLoader`     | `.yml`, `.yaml`  | yaml package                             |
| `toml`      | `TomlLoader`     | `.toml`          | smol-toml                                |

Custom loaders: implement the `Loader` interface and pass an instance as `loader` in `CollectionDef`.

## Validation system

### Schema validation

`validateSchema(data, zodSchema)` wraps `safeParse` and returns `{ issues: ValidationIssue[], validatedData }`. Issues carry `field` (path string), `message`, and `severity` ('error' | 'warn').

### Content validators

Run on the raw MDAST (parsed once, shared across validators via `ValidatorContext.mdast`).

Built-in validators (`builtinMarkdownValidators`):

- **linkValidator** — warns on bare URLs, empty link text, suspicious protocols
- **headingValidator** — enforces single h1, sequential heading depth, non-empty text
- **codeBlockValidator** — warns on missing language, unknown language aliases

Custom validators: implement `ContentValidator { name, validate(ctx) }` and add to `CollectionDef.validators`. Disable built-ins with `disableBuiltinValidators: true`.

`runValidators(ctx, validators)` executes all validators, catches thrown errors as error-severity issues.

### Plugin validation

`ContentPlugin.validate` runs after loader/schema/content validation. Returns `string[]` of error messages.

## JSX runtime

Server-side HTML generation. Import path: `@pagesmith/core/jsx-runtime`.

- `h(tag, props, ...children)` — creates `HtmlString`. Supports intrinsic elements and function components.
- `Fragment({ children, innerHTML })` — renders children or raw innerHTML.
- `HtmlString` — wrapper class; prevents double-escaping of already-rendered HTML.

Configure in tsconfig.json:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

## CSS builder

`buildCss(entryPath, { minify? })` — bundles a CSS file using LightningCSS. Targets Chrome 100+, Firefox 100+, Safari 16+. Returns minified CSS string.

## Runtime exports

Import path: `@pagesmith/core/runtime`.

Two tiers:
- **Standalone** — full site: reset, prose, code, layout, theme toggle, TOC highlight, copy-code.
- **Content** — markdown rendering only: reset, prose, code, diagrams, viewport, copy-code.

Accessors: `getRuntimeCSS()`, `getRuntimeJS()`, `getContentCSS()`, `getContentJS()`, plus `get*Path()` variants for file paths. Also individual: `getDiagramsCSS()`, `getTabsCSS()`, `getViewportCSS()`.

## SSG builder

Import path: `@pagesmith/core/ssg`.

`buildSite(layer, { outDir, template, collections?, basePath? })` — iterates all entries, calls `render()`, applies a template function, writes `{outDir}/{basePath}/{slug}/index.html`.

## CLI commands

Binary: `pagesmith` (from `cli/bin.ts`).

### `pagesmith convert <file.md> [options]`

Convert markdown to HTML. Options: `-o/--output`, `-m/--mode` (full|fragment), `--css` (inline|reference|none), `--js` (inline|reference|none), `--no-toc`, `--title`, `-w/--watch`.

### `pagesmith toc <file.md|file.html>`

Extract table of contents as JSON. Works on both markdown (converts first) and HTML (regex extraction).

### `pagesmith diagrams [folder] [options]`

Render diagrams using diagramkit. Options: `--force/-f`, `--watch/-w`, `--file <path>`, `--type/-t` (mermaid|excalidraw|drawio).

### `pagesmith ai install [options]`

Install assistant memory, skills, and llms files. Options: `--assistant` (all|claude|codex|gemini), `--scope` (project|user), `--cwd`, `--home-dir`, `--skill-name`, `--force`, `--no-llms`.

## Export map

The package exposes multiple entry points via `exports` in package.json:

| Import path              | Source                     | Purpose                              |
|--------------------------|----------------------------|--------------------------------------|
| `@pagesmith/core`              | `src/index.ts`             | Main API barrel                      |
| `@pagesmith/core/jsx-runtime`  | `src/jsx-runtime/index.ts` | h, Fragment, HtmlString              |
| `@pagesmith/core/markdown`     | `src/markdown/index.ts`    | processMarkdown                      |
| `@pagesmith/core/css`          | `src/css/index.ts`         | buildCss (LightningCSS)             |
| `@pagesmith/core/css/content`  | `src/styles/content.css`   | Content CSS file                     |
| `@pagesmith/core/css/diagrams` | `src/styles/diagrams.css`  | Diagram CSS file                     |
| `@pagesmith/core/css/viewport` | `src/styles/viewport.css`  | Viewport CSS file                    |
| `@pagesmith/core/schemas`      | `src/schemas/index.ts`     | Zod schemas and types                |
| `@pagesmith/core/loaders`      | `src/loaders/index.ts`     | Loader classes and registry          |
| `@pagesmith/core/diagrams`     | `src/diagrams/index.ts`    | Diagram rendering via diagramkit     |
| `@pagesmith/core/assets`       | `src/assets/index.ts`      | Asset copying and hashing            |
| `@pagesmith/core/runtime`      | `src/runtime/index.ts`     | Pre-built CSS/JS accessors           |
| `@pagesmith/core/ai`           | `src/ai/index.ts`          | AI assistant file installer          |
| `@pagesmith/core/ssg`          | `src/ssg/index.ts`         | Static site builder                  |

## Coding conventions

- **Trailing commas** everywhere (arrays, objects, parameters, imports).
- **ESM only** — `"type": "module"` in package.json. No CommonJS.
- **Zod schemas** for all validation. Re-exports `z` from `zod` for consumer convenience.
- **Custom CSS properties** — design tokens in `styles/foundations/tokens.css` as `--ps-*` variables.
- **No default exports** — all exports are named.
- **Node platform** — build target is Node (`platform: 'node'` in vite.config.ts).
- **Tests** in `src/__tests__/` colocated with source, run via `vp test`.
- **Build** via `vp pack` (vite-plus), outputs to `dist/` as ESM with source maps and declarations.
- **CSS** bundled with LightningCSS; targets Chrome 100+, Firefox 100+, Safari 16+.
- **Diagrams** always route through `diagramkit` — no bespoke renderers in this package.
- **Processor caching** — the unified markdown processor is cached per `MarkdownConfig` reference via `WeakMap` to avoid rebuilding the plugin chain on every call.
