# API Reference

Complete API reference for `@pagesmith/core` and its sub-path exports.

## Export Paths

| Import Path | Purpose |
|---|---|
| `@pagesmith/core` | Main barrel -- config helpers, content layer, entry, JSX runtime, markdown, schemas, loaders, validation, AI, `z` re-export |
| `@pagesmith/core/vite` | Vite plugins -- `pagesmithContent()`, `pagesmithSsg()`, `sharedAssetsPlugin()`, `prerenderRoutes()` |
| `@pagesmith/core/runtime` | Pre-built CSS/JS asset accessors |
| `@pagesmith/core/jsx-runtime` | Server-side JSX: `h()`, `Fragment()`, `HtmlString` |
| `@pagesmith/core/markdown` | `processMarkdown()` function |
| `@pagesmith/core/css` | `buildCss()` via LightningCSS |
| `@pagesmith/core/css/standalone` | Standalone CSS file (reset + tokens + prose + inline code + TOC + layout) |
| `@pagesmith/core/css/content` | Content-only CSS file (reset + tokens + prose + inline code + viewport) |
| `@pagesmith/core/css/viewport` | Viewport/responsive base CSS file |
| `@pagesmith/core/css/fonts` | Bundled font face declarations (Open Sans, JetBrains Mono) |
| `@pagesmith/core/schemas` | Zod schemas and inferred TypeScript types |
| `@pagesmith/core/loaders` | Loader classes and the `resolveLoader()` registry |
| `@pagesmith/core/assets` | Static file copying and content-hash filenames |
| `@pagesmith/core/ai` | AI assistant artifact installer |
| `@pagesmith/core/create` | Project scaffolding utilities |

---

## `@pagesmith/core`

### Configuration Helpers

#### `defineCollection(def)`

Type-safe identity function for creating a `CollectionDef<S>`. Provides full TypeScript inference from the Zod schema.

```ts
import { defineCollection, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
})
```

#### `defineCollections(map)`

Type-safe identity function for defining multiple collections with strong literal type inference.

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

const collections = defineCollections({
  posts: defineCollection({ ... }),
  authors: defineCollection({ ... }),
})
```

#### `defineConfig(config)`

Type-safe identity function for creating a `ContentLayerConfig`.

```ts
import { defineConfig } from '@pagesmith/core'

const config = defineConfig({
  collections: { posts, authors },
  root: process.cwd(),
  markdown: { shiki: { themes: { light: 'github-light', dark: 'github-dark' } } },
  plugins: [],
})
```

### `createContentLayer(config)`

Creates a `ContentLayer` instance from a `ContentLayerConfig`. The content layer is the main API for working with collections.

```ts
import { createContentLayer } from '@pagesmith/core'

const layer = createContentLayer(config)
```

### ContentLayer Interface

| Method | Signature | Description |
|---|---|---|
| `getCollection` | `(name: string) => Promise<ContentEntry<any>[]>` | Load and return all entries in a collection |
| `getEntry` | `(collection: string, slug: string) => Promise<ContentEntry<any> \| undefined>` | Get a single entry by slug |
| `convert` | `(markdown: string, options?: LayerConvertOptions) => Promise<ConvertResult>` | Convert raw markdown to HTML (no collection, no validation) |
| `invalidate` | `(collection: string, slug: string) => void` | Invalidate a single entry's cache |
| `invalidateCollection` | `(collection: string) => void` | Invalidate all entries in a collection |
| `invalidateAll` | `() => void` | Invalidate all cached data |
| `validate` | `(collection?: string) => Promise<ValidationResult[]>` | Validate all entries in one or all collections |
| `getCollectionNames` | `() => string[]` | Get the names of all configured collections |
| `getCollectionDef` | `(name: string) => CollectionDef \| undefined` | Get the definition of a collection |

### ContentEntry\<T\>

Represents a single loaded content entry. Properties and methods:

| Property/Method | Type | Description |
|---|---|---|
| `slug` | `string` (readonly) | URL-friendly identifier |
| `collection` | `string` (readonly) | Collection name |
| `filePath` | `string` (readonly) | Absolute path to source file |
| `data` | `T` (readonly) | Validated data (typed by the Zod schema) |
| `rawContent` | `string \| undefined` (readonly) | Raw markdown body (only for markdown loaders) |
| `render(options?)` | `(options?: { force?: boolean }) => Promise<RenderedContent>` | Render markdown to HTML. Cached after first call. Pass `{ force: true }` to re-render. |
| `clearRenderCache()` | `() => void` | Clear cached render result |

### RenderedContent

```ts
type RenderedContent = {
  html: string        // Processed HTML
  headings: Heading[] // Extracted headings for TOC
  readTime: number    // Estimated read time in minutes
}
```

### `convert(markdown, options?)`

Standalone markdown-to-HTML conversion without collections or validation:

```ts
import { convert } from '@pagesmith/core'

const result = await convert('# Hello\n\nWorld', {
  markdown: { shiki: { themes: { light: 'github-light', dark: 'github-dark' } } },
})
// result.html, result.toc, result.frontmatter
```

### ConvertResult

```ts
type ConvertResult = {
  html: string
  toc: Heading[]
  frontmatter: Record<string, any>
}
```

### Frontmatter Utilities

#### `extractFrontmatter(raw)`

Extract YAML frontmatter and body content from a raw markdown string using `gray-matter`.

#### `validateFrontmatter(data, schema)`

Validate extracted frontmatter against a Zod schema.

### TOC Extraction

#### `extractToc(html)`

Regex-based heading extraction from rendered HTML. Returns `Heading[]`.

### Schemas and Types

#### Heading

```ts
type Heading = {
  depth: number  // 1-6
  text: string   // Heading text content
  slug: string   // URL-safe id
}
```

#### Frontmatter Schemas

| Schema | Fields |
|---|---|
| `BaseFrontmatterSchema` | `title`, `description`, `publishedDate`, `lastUpdatedOn`, `tags`, `draft` |
| `BlogFrontmatterSchema` | Extends base with `category`, `featured`, `coverImage` |
| `ProjectFrontmatterSchema` | Extends base with `gitRepo`, `links` |

#### MarkdownConfig

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

#### ContentLayerConfig

```ts
type ContentLayerConfig = {
  collections: CollectionMap
  root?: string
  markdown?: MarkdownConfig
  assets?: { hashFilenames?: boolean; outputDir?: string }
  cache?: boolean
  eager?: boolean
  plugins?: ContentPlugin[]
}
```

#### CollectionDef\<S\>

```ts
type CollectionDef<S> = {
  loader: LoaderType | Loader
  directory: string
  schema: S
  include?: string[]
  exclude?: string[]
  computed?: Record<string, (entry: any) => any>
  transform?: (entry: RawEntry) => RawEntry | Promise<RawEntry>
  filter?: (entry: any) => boolean
  slugify?: (filePath: string, directory: string) => string
  validate?: (entry: any) => string | undefined
  validators?: ContentValidator[]
  disableBuiltinValidators?: boolean
}
```

#### ContentPlugin

```ts
type ContentPlugin = {
  name: string
  rehypePlugin?: () => (tree: any) => void
  remarkPlugin?: () => (tree: any) => void
  validate?: (entry: { data: Record<string, any>; content?: string }) => string[]
}
```

### Validation Types

#### ValidationIssue

```ts
type ValidationIssue = {
  message: string
  severity: 'error' | 'warn'
  field?: string
}
```

#### ValidationResult

```ts
type ValidationResult = {
  collection: string
  entries: Array<{
    slug: string
    filePath: string
    issues: ValidationIssue[]
  }>
  errors: number
  warnings: number
}
```

#### ContentValidator

```ts
type ContentValidator = {
  name: string
  validate(ctx: ValidatorContext): ValidationIssue[] | Promise<ValidationIssue[]>
}
```

#### ValidatorContext

```ts
type ValidatorContext = {
  filePath: string
  slug: string
  collection: string
  rawContent?: string
  data: Record<string, any>
  mdast?: Root
}
```

### Built-in Validators

| Export | Description |
|---|---|
| `linkValidator` | Warns on bare URLs, empty link text, suspicious protocols |
| `headingValidator` | Enforces single h1, sequential heading depth, non-empty text |
| `codeBlockValidator` | Warns on missing language, unknown language aliases |
| `builtinMarkdownValidators` | Array containing all three built-in validators |
| `runValidators(ctx, validators)` | Execute validators and collect issues |

### Loaders

| Export | Description |
|---|---|
| `MarkdownLoader` | Loads `.md` files via `gray-matter` |
| `JsonLoader` | Loads `.json` files via `JSON.parse` or `json5` |
| `JsoncLoader` | Loads `.json` / `.jsonc` files via `json5` (JSON with comments) |
| `YamlLoader` | Loads `.yml` / `.yaml` files via the `yaml` package |
| `TomlLoader` | Loads `.toml` files via `smol-toml` |

### JSX Runtime

Exported from both `@pagesmith/core` and `@pagesmith/core/jsx-runtime`:

| Export | Description |
|---|---|
| `h(tag, props, ...children)` | Creates `HtmlString`. Supports intrinsic elements and function components. |
| `Fragment({ children, innerHTML })` | Renders children or raw innerHTML. |
| `HtmlString` | Wrapper class that prevents double-escaping of already-rendered HTML. |

Configure in `tsconfig.json` for automatic JSX transformation:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

### Markdown Processing

#### `processMarkdown(raw, config?, preExtracted?)`

Process a raw markdown string through the unified pipeline. Returns `MarkdownResult`:

```ts
type MarkdownResult = {
  html: string
  headings: Heading[]
  frontmatter: Record<string, any>
}
```

### CSS Builder

#### `buildCss(entryPath, options?)`

Bundle a CSS file using LightningCSS. Targets Chrome 100+, Firefox 100+, Safari 16+.

```ts
import { buildCss } from '@pagesmith/core/css'

const css = buildCss('./styles/main.css', { minify: true })
```

### `z` (Zod Re-export)

`@pagesmith/core` re-exports `z` from Zod for consumer convenience, so you do not need to install Zod separately:

```ts
import { z } from '@pagesmith/core'

const schema = z.object({
  title: z.string(),
  date: z.coerce.date(),
})
```

---

## `@pagesmith/core/vite`

### `pagesmithContent(collections, options?)`

Vite plugin that exposes content collections as virtual modules. Uses `enforce: 'pre'`.

```ts title="vite.config.ts"
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [pagesmithContent(collections)],
})
```

**Options** (via `PagesmithContentPluginOptions`):

| Option | Type | Default | Description |
|---|---|---|---|
| `collections` | `CollectionMap` | Required | The collection definitions |
| `root` | `string` | `"."` | Root directory for resolving collection paths |
| `markdown` | `MarkdownConfig` | `undefined` | Markdown pipeline configuration |
| `contentRoot` | `string` | Auto-detected | Shared content root for computing `id` and `contentSlug` |
| `moduleId` | `string` | `"virtual:content"` | Root virtual module ID |
| `configPath` | `string` | `"content.config.ts"` | Path to the content config module (for generated typings) |
| `dts` | `boolean \| string \| { path?: string }` | Auto | Generate module declarations. Defaults to `src/pagesmith-content.d.ts` when `src/` exists. |
| `plugins` | `ContentPlugin[]` | `[]` | Content plugins |

**Virtual Module Types:**

For markdown collections, each entry has:
```ts
{ id: string, contentSlug: string, html: string, headings: Heading[], frontmatter: InferCollectionData<T> }
```

For data collections, each entry has:
```ts
{ id: string, contentSlug: string, data: InferCollectionData<T> }
```

### `pagesmithSsg(options)`

Vite plugin for static site generation. Returns two plugins:

- **`pagesmith:ssg-dev`** (`apply: 'serve'`) -- SSR middleware for the Vite dev server
- **`pagesmith:ssg-build`** (`apply: 'build'`) -- Post-build SSG: builds SSR bundle, renders routes, copies assets, runs Pagefind

```ts title="vite.config.ts"
import { pagesmithSsg } from '@pagesmith/core/vite'

export default defineConfig({
  plugins: [
    pagesmithSsg({
      entry: './src/entry-server.tsx',
      pagefind: true,
      contentDirs: ['content'],
    }),
  ],
})
```

**Options** (`SsgPluginOptions`):

| Option | Type | Default | Description |
|---|---|---|---|
| `entry` | `string` | Required | Path to the SSR entry module |
| `pagefind` | `boolean` | `true` | Run Pagefind indexer after build |
| `contentDirs` | `string[]` | `[]` | Content directories for copying companion assets |

**SSR Entry Module** must export:

| Export | Signature | Description |
|---|---|---|
| `getRoutes` | `(config: SsgRenderConfig) => string[]` | Return all route paths to pre-render |
| `render` | `(url: string, config: SsgRenderConfig) => string \| Promise<string>` | Render a route to an HTML string |

**SsgRenderConfig:**

```ts
type SsgRenderConfig = {
  base: string          // Base path (e.g., '/my-site')
  root: string          // Absolute project root
  cssPath: string       // Path to the built CSS asset
  jsPath?: string       // Path to the built JS asset
  searchEnabled: boolean
  isDev: boolean
}
```

### `sharedAssetsPlugin()`

Middleware plugin that serves `@pagesmith/core`'s bundled font files (woff2) and `fonts.css` during development. In production, fonts are copied to the output directory by the SSG build plugin.

### `prerenderRoutes(options)`

Lower-level utility function (not a Vite plugin) for simpler SSG scenarios where you run separate client and SSR builds. Loads the SSR entry, renders each route, and injects rendered HTML into the client template by replacing a `<!--ssr-outlet-->` placeholder.

The SSR entry must export a `render(url: string): string` function.

```ts
type PrerenderOptions = {
  /** Absolute path to the client build output directory (e.g., `dist/`) */
  outDir: string
  /** Absolute path to the built SSR entry module (e.g., `dist/.server/entry-server.js`) */
  serverEntry: string
  /** Routes to pre-render (e.g., `['/', '/about', '/posts/hello-world']`) */
  routes: string[]
  /** HTML placeholder to replace with rendered content (default: `'<!--ssr-outlet-->'`) */
  placeholder?: string
  /** Remove the server build directory after pre-rendering (default: true) */
  cleanup?: boolean
}
```

Returns `Promise<{ pages: number }>` with the count of rendered pages.

**Usage:**

```ts
import { build } from 'vite'
import { prerenderRoutes } from '@pagesmith/core/vite'

// 1. Client build
await build({ build: { outDir: 'dist' } })

// 2. SSR build
await build({ build: { ssr: 'src/entry-server.tsx', outDir: 'dist/.server' } })

// 3. Pre-render
await prerenderRoutes({
  outDir: resolve('dist'),
  serverEntry: resolve('dist/.server/entry-server.js'),
  routes: ['/', '/about', '/posts/hello-world'],
})
```

---

## `@pagesmith/core/runtime`

CSS and JS asset accessors for pre-built runtime bundles. See the [Runtime Reference](/reference/runtime/) for full details.

| Function | Returns |
|---|---|
| `getRuntimeCSS()` | Standalone CSS as a string |
| `getRuntimeJS()` | Standalone runtime JS as a string |
| `getRuntimeCSSPath()` | Absolute file path to standalone CSS |
| `getRuntimeJSPath()` | Absolute file path to standalone JS |
| `getContentCSS()` | Content-only CSS as a string |
| `getContentJS()` | Content-only runtime JS as a string |
| `getContentCSSPath()` | Absolute file path to content CSS |
| `getContentJSPath()` | Absolute file path to content JS |
| `getViewportCSS()` | Viewport CSS as a string |
| `getViewportCSSPath()` | Absolute file path to viewport CSS |

---

## `@pagesmith/core/create`

Project scaffolding module for `pagesmith create`. Supports local templates (bundled) and remote templates (downloaded from GitHub examples).

| Export | Description |
|---|---|
| `createProject(projectName, templateName)` | Scaffold a new project from a template. Creates the directory, copies files, adapts paths for standalone use, and writes `package.json`. |
| `templates` | Array of available `Template` definitions |
| `listTemplates()` | Returns a formatted string listing all available templates with descriptions |

**Template type:**

```ts
type Template = {
  name: string
  description: string
  source: 'local' | 'github'
  path: string
  dependency: '@pagesmith/core' | '@pagesmith/docs'
  scripts: Record<string, string>
}
```

**Available templates:**

| Name | Description | Package |
|---|---|---|
| `docs` | Documentation site with @pagesmith/docs | `@pagesmith/docs` |
| `blog` | Blog with custom layouts using @pagesmith/core | `@pagesmith/core` |
| `react` | React SSG site with react-router | `@pagesmith/core` |
| `solid` | SolidJS SSG site | `@pagesmith/core` |
| `svelte` | Svelte SSG site | `@pagesmith/core` |
| `ejs` | Vanilla Node.js + EJS templates | `@pagesmith/core` |
| `hbs` | Vanilla Node.js + Handlebars templates | `@pagesmith/core` |

**Usage:**

```ts
import { createProject, listTemplates } from '@pagesmith/core/create'

// List available templates
console.log(listTemplates())

// Scaffold a new project
await createProject('my-docs', 'docs')
```

---

## `@pagesmith/core/ai`

AI assistant artifact installer for generating memory, skill, and llms files.

| Export | Description |
|---|---|
| `getAiArtifacts()` | List all available AI artifacts |
| `getAiArtifactContent(kind)` | Get the content of a specific artifact |
| `installAiArtifacts(options)` | Install artifacts for an assistant (Claude, Codex, Gemini) |

**Types:**

| Type | Description |
|---|---|
| `AiAssistant` | `'claude' \| 'codex' \| 'gemini'` |
| `AiArtifact` | An individual artifact definition |
| `AiArtifactKind` | Kind of artifact |
| `AiInstallOptions` | Options for `installAiArtifacts()` |
| `AiInstallResult` | Result of an install operation |
| `AiInstallScope` | `'project' \| 'user'` |

---

## `@pagesmith/docs`

### Export Paths

| Import Path | Purpose |
|---|---|
| `@pagesmith/docs` | Main barrel -- `build()`, `startDev()`, `preview()`, `defineDocsConfig()`, `loadDocsConfig()`, `validateDocsConfig()` |
| `@pagesmith/docs/preset` | `docsPreset()` -- programmatic access to build/dev/preview |
| `@pagesmith/docs/schemas` | Docs config Zod schemas |

### `docsPreset()`

Import: `@pagesmith/docs/preset`

Returns an object with `build()`, `dev()`, and `preview()` methods for programmatic control over the docs lifecycle. Useful for tooling integrations or custom build scripts that need to drive the docs pipeline without going through the CLI.

```ts
import { docsPreset } from '@pagesmith/docs/preset'

const docs = docsPreset()

// Build the docs site
await docs.build('./pagesmith.config.json5')

// Start dev server
await docs.dev('./pagesmith.config.json5', { port: 3000 })

// Preview built output
await docs.preview({ port: 4173, configPath: './pagesmith.config.json5' })
```

**Methods:**

| Method | Signature | Description |
|---|---|---|
| `build` | `(configPath?: string) => Promise<void>` | Run a full production build |
| `dev` | `(configPath?: string, options?: { port?: number }) => Promise<void>` | Start the dev server with live reload |
| `preview` | `(options?: { port?: number; configPath?: string }) => Promise<void>` | Serve the built output for local verification |
