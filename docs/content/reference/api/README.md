---
title: API Reference
description: Import paths and public API for Pagesmith packages — core content APIs, site-building APIs, and docs preset APIs.
---

# API Reference

Complete API reference for the public Pagesmith package surfaces.

## Export Paths

| Import Path                       | Purpose                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pagesmith/core`                 | Main content-layer barrel -- config helpers, content layer, markdown, schemas, loaders, validation, AI, `z` re-export                                                                    |
| `@pagesmith/core/vite`            | Lower-level content-plugin export -- `pagesmithContent()` for core-only integrations                                                                                                     |
| `@pagesmith/core/markdown`        | `processMarkdown()` function                                                                                                                                                             |
| `@pagesmith/core/schemas`         | Zod schemas and inferred TypeScript types                                                                                                                                                |
| `@pagesmith/core/loaders`         | Loader classes and the `resolveLoader()` registry                                                                                                                                        |
| `@pagesmith/core/assets`          | Static file copying and content-hash filenames                                                                                                                                           |
| `@pagesmith/core/ai`              | AI assistant artifact installer                                                                                                                                                          |
| `@pagesmith/core/create`          | Project scaffolding utilities                                                                                                                                                            |
| `@pagesmith/core/cli-kit`         | Shared CLI building blocks (cac wrapper, clack prompts, config loader) reused by `pagesmith-core`, `pagesmith-site`, `pagesmith-docs`                                                    |
| `@pagesmith/core/mcp`             | Programmatic MCP server entry (`createCoreMcpServer`, `startCoreMcpServer`) — wrap a live `ContentLayer` to expose core tools over stdio                                                 |
| `@pagesmith/site`                 | App-facing site/content barrel -- re-exported content APIs, site config helpers, and preset types                                                                                        |
| `@pagesmith/site/vite`            | App-facing Vite barrel -- `pagesmithSite()`, `pagesmithContent()`, `pagesmithSsg()`, `sharedAssetsPlugin()`, `prerenderRoutes()`                                                         |
| `@pagesmith/site/preset`          | Fallback `sitePreset()` factory for the `pagesmith-site` CLI when no real preset is selected                                                                                             |
| `@pagesmith/site/jsx-runtime`     | Server-side JSX: `h()`, `Fragment()`, `HtmlString`                                                                                                                                       |
| `@pagesmith/site/runtime`         | Pre-built CSS/JS asset accessors                                                                                                                                                         |
| `@pagesmith/site/runtime/*`       | Granular browser entry modules (`code-blocks`, `code-tabs`, `chrome`, `content`, `standalone`, `footer-year`, `search-trigger`, `sidebar`, `skip-link`, `theme`, `toc-highlight`)        |
| `@pagesmith/site/components`      | Reusable JSX/HTML components (`SiteDocument`, `SiteHeader`, `SiteSidebar`, `SiteFooter`, `TableOfContents`, `Breadcrumbs`, `ListingCards`, `HeroSection`, `ContentMeta`, theme controls) |
| `@pagesmith/site/layouts`         | Reusable site layouts (`PageShell`, `HomeLayout`, `ListingLayout`, `NotFoundLayout`)                                                                                                     |
| `@pagesmith/site/theme`           | Theme defaults + `resolveThemeControls()`                                                                                                                                                |
| `@pagesmith/site/css`             | `buildCss()` via LightningCSS                                                                                                                                                            |
| `@pagesmith/site/css/*`           | Shared CSS bundles (`chrome`, `standalone`, `content`, `code-block`, `code-inline`, `tabs`, `viewport`, `fonts`)                                                                         |
| `@pagesmith/site/ssg-utils`       | Shared SSG utility helpers (`generateFeed`, `generateSitemap`, `runPagefindIndexing`, route/date helpers, `renderDocumentShell`)                                                         |
| `@pagesmith/site/build-validator` | `validateBuildOutput`, `runBuildValidation` and types for post-build checks                                                                                                              |
| `@pagesmith/docs`                 | Main docs barrel -- config helpers, build/dev/preview APIs, navigation helpers, theme exports, and MCP entrypoints                                                                       |
| `@pagesmith/docs/preset`          | `docsPreset()` -- docs-package preset entry                                                                                                                                              |
| `@pagesmith/docs/components`      | Reusable docs chrome components for layout overrides                                                                                                                                     |
| `@pagesmith/docs/layouts`         | Reusable docs layout helpers for custom themes                                                                                                                                           |
| `@pagesmith/docs/jsx-runtime`     | JSX runtime for docs layout overrides                                                                                                                                                    |
| `@pagesmith/docs/jsx-dev-runtime` | Dev JSX runtime for docs layout overrides                                                                                                                                                |
| `@pagesmith/docs/theme`           | Stock docs theme exports                                                                                                                                                                 |
| `@pagesmith/docs/mcp`             | Docs MCP server entry                                                                                                                                                                    |
| `@pagesmith/docs/schemas`         | Docs config Zod schemas                                                                                                                                                                  |

---

## `@pagesmith/core`

### Configuration Helpers

#### `defineCollection(def)`

Type-safe identity function for creating a `CollectionDef<S>`. Provides full TypeScript inference from the Zod schema.

```ts
import { defineCollection, z } from "@pagesmith/core";

const posts = defineCollection({
  loader: "markdown",
  directory: "content/posts",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});
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
import { defineConfig } from "@pagesmith/core";

const config = defineConfig({
  collections: { posts, authors },
  root: process.cwd(),
  markdown: { shiki: { themes: { light: "github-light", dark: "github-dark" } } },
  plugins: [],
});
```

### `createContentLayer(config)`

Creates a `ContentLayer` instance from a `ContentLayerConfig`. The content layer is the main API for working with collections.

```ts
import { createContentLayer } from "@pagesmith/core";

const layer = createContentLayer(config);
```

### ContentLayer Interface

| Method                 | Signature                                                                              | Description                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `getCollection`        | `(name: string) => Promise<ContentEntry<any>[]>`                                       | Load and return all entries in a collection                                                                                          |
| `getEntry`             | `(collection: string, slug: string) => Promise<ContentEntry<any> \| undefined>`        | Get a single entry by slug                                                                                                           |
| `convert`              | `(markdown: string, options?: LayerConvertOptions) => Promise<ConvertResult>`          | Convert raw markdown to HTML (no collection, no validation); pass `sourcePath` and optional `assetRoot` for local image enhancements |
| `invalidate`           | `(collection: string, slug: string) => Promise<void>`                                  | Invalidate a single entry's cache                                                                                                    |
| `invalidateCollection` | `(collection: string) => Promise<void>`                                                | Invalidate an entire collection's cache                                                                                              |
| `invalidateAll`        | `() => void`                                                                           | Invalidate all cached data                                                                                                           |
| `invalidateWhere`      | `(collection: string, predicate: (entry: ContentEntry) => boolean) => Promise<number>` | Invalidate entries matching a predicate; returns count of invalidated entries                                                        |
| `validate`             | `(collection?: string) => Promise<ValidationResult[]>`                                 | Validate all entries in one or all collections                                                                                       |
| `getCollectionNames`   | `() => string[]`                                                                       | Get the names of all configured collections                                                                                          |
| `getCollectionDef`     | `(name: string) => CollectionDef \| undefined`                                         | Get the definition of a collection                                                                                                   |
| `getCollections`       | `() => Record<string, CollectionDef>`                                                  | Get all collection definitions                                                                                                       |
| `watch`                | `(callback: WatchCallback) => WatchHandle`                                             | Watch collection directories for changes; returns a handle to stop watching                                                          |
| `getCacheStats`        | `() => { collections: number; entries: Record<string, number>; totalEntries: number }` | Get cache statistics for debugging and monitoring                                                                                    |

When `convert()` is rendering markdown that references local images, pass `sourcePath` in `LayerConvertOptions` so Pagesmith can resolve intrinsic dimensions and JPEG picture fallbacks. By default `convert()` keeps relative refs inside the markdown file's own directory; add `assetRoot` when the safe root should be broader, such as the collection directory that `entry.render()` uses automatically.

### ContentEntry\<T\>

Represents a single loaded content entry. Properties and methods:

| Property/Method      | Type                                                          | Description                                                                            |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `slug`               | `string` (readonly)                                           | URL-friendly identifier                                                                |
| `collection`         | `string` (readonly)                                           | Collection name                                                                        |
| `filePath`           | `string` (readonly)                                           | Absolute path to source file                                                           |
| `data`               | `T` (readonly)                                                | Validated data (typed by the Zod schema)                                               |
| `rawContent`         | `string \| undefined` (readonly)                              | Raw markdown body (only for markdown loaders)                                          |
| `render(options?)`   | `(options?: { force?: boolean }) => Promise<RenderedContent>` | Render markdown to HTML. Cached after first call. Pass `{ force: true }` to re-render. |
| `clearRenderCache()` | `() => void`                                                  | Clear cached render result                                                             |

### RenderedContent

```ts
type RenderedContent = {
  html: string; // Processed HTML
  headings: Heading[]; // Extracted headings for TOC
  readTime: number; // Estimated read time in minutes
};
```

### `convert(markdown, options?)`

Standalone markdown-to-HTML conversion without collections or validation:

```ts
import { convert } from "@pagesmith/core";

const result = await convert("# Hello\n\nWorld", {
  markdown: { shiki: { themes: { light: "github-light", dark: "github-dark" } } },
});
// result.html, result.headings, result.toc, result.frontmatter
```

### ConvertResult

```ts
type ConvertResult = {
  html: string;
  headings: Heading[];
  /** @deprecated Use `headings` instead. */
  toc: Heading[];
  frontmatter: Record<string, any>;
};
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
  depth: number; // 1-6
  text: string; // Heading text content
  slug: string; // URL-safe id
};
```

#### Frontmatter Schemas

| Schema                     | Fields                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `BaseFrontmatterSchema`    | `title`, `description`, `publishedDate`, `lastUpdatedOn`, `tags`, `draft` |
| `BlogFrontmatterSchema`    | Extends base with `category`, `featured`, `coverImage`                    |
| `ProjectFrontmatterSchema` | Extends base with `gitRepo`, `links`                                      |

#### MarkdownConfig

```ts
type MarkdownConfig = {
  remarkPlugins?: any[];
  rehypePlugins?: any[];
  allowDangerousHtml?: boolean;
  math?: boolean | "auto";
  images?: {
    lazyLoading?: boolean; // default true
    eagerCount?: number; // default 1
  };
  shiki?: {
    themes: { light: string; dark: string };
    langAlias?: Record<string, string>;
    defaultShowLineNumbers?: boolean;
  };
};
```

`images` (validated by `MarkdownImagesConfigSchema`, also exported from `@pagesmith/core/schemas`) controls loading-hint attributes on in-flow content images. With `lazyLoading` enabled (the default), Pagesmith walks the rendered images in document order: the first `eagerCount` images (default `1`, tuned for the Largest Contentful Paint hero) get `fetchpriority="high"`, and every image after that gets `loading="lazy" decoding="async"`. The hint applies to the `<img>` inside a generated `<picture>` as well as to plain images. Set `lazyLoading: false` to add no loading attributes at all, or `eagerCount: 0` to make every image lazy. An `<img>` that already carries an author-set `loading` or `fetchpriority` is left untouched.

```ts title="content.config.ts"
import { defineConfig } from "@pagesmith/core";

export default defineConfig({
  collections: {
    /* ... */
  },
  markdown: {
    images: { eagerCount: 2 }, // treat the first two images as eager
  },
});
```

#### ContentLayerConfig

```ts
type ContentLayerConfig = {
  collections: CollectionMap;
  root?: string;
  markdown?: MarkdownConfig;
  assets?: { hashFilenames?: boolean; outputDir?: string };
  plugins?: ContentPlugin[];
  strict?: boolean;
};
```

#### CollectionDef\<S\>

```ts
type CollectionDef<S> = {
  loader: LoaderType | Loader;
  directory: string;
  schema: S;
  include?: string[];
  exclude?: string[];
  computed?: Record<string, (entry: any) => any>;
  transform?: (entry: RawEntry) => RawEntry | Promise<RawEntry>;
  filter?: (entry: any) => boolean;
  slugify?: (filePath: string, directory: string) => string;
  validate?: (entry: any) => string | undefined;
  validators?: ContentValidator[];
  disableBuiltinValidators?: boolean;
};
```

#### ContentPlugin

```ts
type ContentPlugin = {
  name: string;
  rehypePlugin?: () => (tree: any) => void;
  remarkPlugin?: () => (tree: any) => void;
  validate?: (entry: { data: Record<string, any>; content?: string }) => string[];
};
```

### Validation Types

#### ValidationIssue

```ts
type ValidationIssue = {
  message: string;
  severity: "error" | "warn";
  field?: string;
};
```

#### ValidationResult

```ts
type ValidationResult = {
  collection: string;
  entries: Array<{
    slug: string;
    filePath: string;
    issues: ValidationIssue[];
  }>;
  errors: number;
  warnings: number;
};
```

#### ContentValidator

```ts
type ContentValidator = {
  name: string;
  validate(ctx: ValidatorContext): ValidationIssue[] | Promise<ValidationIssue[]>;
};
```

#### ValidatorContext

```ts
type ValidatorContext = {
  filePath: string;
  slug: string;
  collection: string;
  rawContent?: string;
  data: Record<string, any>;
  mdast?: Root;
};
```

### Built-in Validators

| Export                                                                | Description                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linkValidator`                                                       | Default-configured link/image validator. Warns on empty link text and malformed external URLs; errors on missing alt text, raw `<img>` outside `<picture>`, mismatched light/dark image pairs, and broken internal links. Configurable via `createLinkValidator(options)`.  |
| `createLinkValidator(options)`                                        | Factory for a customised `linkValidator` with overrides for alt-text, theme-variant pair enforcement, internal-link rules, additional roots, and optional external-URL reachability fetch.                                                                                  |
| `headingValidator`                                                    | Warns when a content-bearing document has no headings, on empty heading text, on multiple `h1`s, and on skipped heading levels.                                                                                                                                             |
| `codeBlockValidator`                                                  | Warns when meta is set without a language, on unknown meta keys, and on malformed line ranges in `mark`/`ins`/`del`/`collapse`.                                                                                                                                             |
| `imageStructureValidator`                                             | Enforces `<figure><picture>...<img></picture><figcaption?></figure>` (or `<figure><img></figure>` for SVG/GIF). Errors on nested `<figure>`/`<picture>`, missing or duplicate `<img>` inside `<picture>`, unbalanced `<picture>` tags, and foreign tags inside `<picture>`. |
| `builtinMarkdownValidators`                                           | Array containing all four built-in validators.                                                                                                                                                                                                                              |
| `runValidators(ctx, validators)`                                      | Execute validators against a shared MDAST parse and collect issues.                                                                                                                                                                                                         |
| `validateContent(options)` / `formatContentValidationReport(summary)` | Walk a directory, validate every markdown file, and pretty-print the report. Used by `pagesmith-core validate` and `pagesmith-docs validate`.                                                                                                                               |

### Loaders

| Export                           | Description                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `MarkdownLoader`                 | Loads `.md` files via `gray-matter`                                                            |
| `JsonLoader`                     | Loads `.json` files via `JSON.parse` and `.json5` files via `json5`                            |
| `JsoncLoader`                    | Loads `.jsonc` files (strips `//` and `/* */` comments and trailing commas, then `JSON.parse`) |
| `YamlLoader`                     | Loads `.yml` / `.yaml` files via the `yaml` package                                            |
| `TomlLoader`                     | Loads `.toml` files via `smol-toml`                                                            |
| `resolveLoader(name)`            | Resolve a built-in loader by `LoaderType` string or pass through a custom `Loader` instance    |
| `registerLoader(name, loader)`   | Register an additional loader so it can be referenced by string                                |
| `defaultIncludePatterns(loader)` | Compute the default `**/*<ext>` include globs from a loader's `extensions`                     |
| `LoaderError`                    | Error subclass with `filePath`, `format`, optional `line`/`column` for better diagnostics      |

### JSX Runtime

Exported from `@pagesmith/site/jsx-runtime`:

| Export                              | Description                                                                |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `h(tag, props, ...children)`        | Creates `HtmlString`. Supports intrinsic elements and function components. |
| `Fragment({ children, innerHTML })` | Renders children or raw innerHTML.                                         |
| `HtmlString`                        | Wrapper class that prevents double-escaping of already-rendered HTML.      |

Configure in `tsconfig.json` for automatic JSX transformation:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

For docs layout overrides, keep the import surface on the docs package and set `jsxImportSource` to `@pagesmith/docs`. `@pagesmith/docs/jsx-runtime` re-exports the same runtime for docs-specific theming work.

### Markdown Processing

#### `processMarkdown(raw, config?, preExtracted?)`

Process a raw markdown string through the unified pipeline. Returns `MarkdownResult`:

```ts
type MarkdownResult = {
  html: string;
  headings: Heading[];
  frontmatter: Record<string, any>;
};
```

### CSS Builder

#### `buildCss(entryPath, options?)`

Bundle a CSS file using LightningCSS. Targets Chrome 100+, Firefox 100+, Safari 16+.

```ts
import { buildCss } from "@pagesmith/site/css";

const css = buildCss("./styles/main.css", { minify: true });
```

### `z` (Zod Re-export)

`@pagesmith/core` re-exports `z` from Zod for consumer convenience, so you do not need to install Zod separately:

```ts
import { z } from "@pagesmith/core";

const schema = z.object({
  title: z.string(),
  date: z.coerce.date(),
});
```

### Concurrency Utilities

Exported from the main `@pagesmith/core` entry -- the single shared bounded worker-pool primitive used across the packages (content loading, image-variant emission, and `@pagesmith/site`'s route pre-rendering). Prefer this over an unbounded `Promise.all(items.map(...))` anywhere fan-out scales with content or asset count.

```ts
function defaultConcurrency(): number; // max(1, os.availableParallelism())

function mapWithConcurrency<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency?: number, // defaults to defaultConcurrency(); values < 1 clamp to 1
): Promise<R[]>;
```

```ts
import { mapWithConcurrency } from "@pagesmith/core";

const sizes = await mapWithConcurrency(imagePaths, (path) => statImage(path), 4);
// sizes[i] corresponds to imagePaths[i], regardless of completion order
```

- Results preserve input order regardless of completion order.
- A thrown `mapper` rejects the whole batch, mirroring `Promise.all` -- handle partial failures inside the `mapper` if a failed item should not fail the batch.
- An empty `items` array resolves to `[]` without invoking `mapper`.

---

## `@pagesmith/core/vite`

### `pagesmithContent(collections, options?)`

Vite plugin that exposes content collections as virtual modules. Uses `enforce: 'pre'`.

```ts title="vite.config.ts"
import { pagesmithContent } from "@pagesmith/core/vite";
import collections from "./content.config";

export default defineConfig({
  plugins: [pagesmithContent(collections)],
});
```

**Options** (via `PagesmithContentPluginOptions`):

| Option        | Type                                     | Default               | Description                                                                                |
| ------------- | ---------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `collections` | `CollectionMap`                          | Required              | The collection definitions                                                                 |
| `root`        | `string`                                 | `"."`                 | Root directory for resolving collection paths                                              |
| `markdown`    | `MarkdownConfig`                         | `undefined`           | Markdown pipeline configuration                                                            |
| `contentRoot` | `string`                                 | Auto-detected         | Shared content root for computing `id` and `contentSlug`                                   |
| `moduleId`    | `string`                                 | `"virtual:content"`   | Root virtual module ID                                                                     |
| `configPath`  | `string`                                 | `"content.config.ts"` | Path to the content config module (for generated typings)                                  |
| `dts`         | `boolean \| string \| { path?: string }` | Auto                  | Generate module declarations. Defaults to `src/pagesmith-content.d.ts` when `src/` exists. |
| `plugins`     | `ContentPlugin[]`                        | `[]`                  | Content plugins                                                                            |

**Virtual Module Types:**

For markdown collections, each entry has:

```ts
{ id: string, contentSlug: string, html: string, headings: Heading[], frontmatter: InferCollectionData<T> }
```

For data collections, each entry has:

```ts
{ id: string, contentSlug: string, data: InferCollectionData<T> }
```

## `@pagesmith/site/vite`

### `pagesmithSite(options)`

Convenience super-plugin that composes `pagesmithContent`, `pagesmithSsg`, and `sharedAssetsPlugin` in one call. Returns a `Plugin[]`:

```ts title="vite.config.ts"
import { pagesmithSite } from "@pagesmith/site/vite";
import collections from "./content.config";

export default defineConfig({
  plugins: [
    pagesmithSite({
      collections,
      content: {
        /* PagesmithContentPluginOptions, minus `collections` */
      },
      ssg: { entry: "./src/entry-server.tsx" }, // pass `false` to skip SSG (e.g. Next.js)
    }),
  ],
});
```

| Option                | Type                                                 | Default                               | Description                                                                                    |
| --------------------- | ---------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `collections`         | `CollectionMap`                                      | Required                              | Forwarded to `pagesmithContent`                                                                |
| `content`             | `Omit<PagesmithContentPluginOptions, 'collections'>` | `undefined`                           | Extra `pagesmithContent` options (e.g. `markdown`, `dts`)                                      |
| `ssg`                 | `SsgPluginOptions \| false`                          | `{ entry: './src/entry-server.tsx' }` | SSG plugin options. Pass `false` to skip SSG entirely (when an outer framework owns rendering) |
| `disableSharedAssets` | `boolean`                                            | `false`                               | Skip the dev-only fonts middleware                                                             |

### `pagesmithContent(collections, options?)`

`@pagesmith/site/vite` re-exports the content plugin so site consumers can keep both content and SSG Vite imports on one package:

```ts title="vite.config.ts"
import { pagesmithContent, pagesmithSsg } from "@pagesmith/site/vite";
import collections from "./content.config";

export default defineConfig({
  plugins: [pagesmithContent(collections), pagesmithSsg({ entry: "./src/entry-server.tsx" })],
});
```

### `pagesmithSsg(options)`

Vite plugin for static site generation. Returns two plugins:

- **`pagesmith:ssg-dev`** (`apply: 'serve'`) -- SSR middleware for the Vite dev server
- **`pagesmith:ssg-build`** (`apply: 'build'`) -- Post-build SSG: builds SSR bundle, renders routes, copies assets, runs Pagefind

```ts title="vite.config.ts"
import { pagesmithSsg } from "@pagesmith/site/vite";

export default defineConfig({
  plugins: [
    pagesmithSsg({
      entry: "./src/entry-server.tsx",
      pagefind: true,
      contentDirs: ["content"],
    }),
  ],
});
```

**Options** (`SsgPluginOptions`):

| Option          | Type                                                    | Default             | Description                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`         | `string`                                                | Required            | Path to the SSR entry module                                                                                                                                                                                                                                      |
| `pagefind`      | `boolean`                                               | `true`              | Run Pagefind indexer after build                                                                                                                                                                                                                                  |
| `contentDirs`   | `string[]`                                              | `[]`                | Content directories whose companion assets should be served in dev and copied at build time                                                                                                                                                                       |
| `cssEntry`      | `string`                                                | `'./src/theme.css'` | Dev-only CSS entry injected into rendered HTML                                                                                                                                                                                                                    |
| `trailingSlash` | `boolean`                                               | `false`             | When `true`, dev server resolves clean URLs to `path/index.html`; otherwise to `path.html`                                                                                                                                                                        |
| `beforeBuild`   | `(ctx: SsgBeforeBuildContext) => void \| Promise<void>` | `undefined`         | Runs once, before the SSR build + route pre-rendering. Use it for project-specific pre-build steps (writing `rss.xml`/`sitemap.xml`, generating content, syncing assets). A thrown error aborts the build with `pagesmithSsg beforeBuild hook failed: <message>`. |

**`SsgBeforeBuildContext`** (passed to `beforeBuild`):

```ts
type SsgBeforeBuildContext = {
  rootDir: string; // Absolute path to the project root (Vite's resolved `root`)
  outDir: string; // Absolute path to the build output directory
  config: ResolvedConfig; // Vite's fully resolved config for this build
  logger: Logger; // Prefixed `pagesmith:ssg` logger (from @pagesmith/core)
};
```

`beforeBuild` runs in the client build's `closeBundle` hook, after the client's hashed CSS/JS assets already exist in `outDir` but before any route HTML is written -- a safe place to drop additional static files that route pre-rendering will not touch:

```ts title="vite.config.ts"
import { writeFileSync } from "fs";
import { generateFeed } from "@pagesmith/site/ssg-utils";
import { pagesmithSsg } from "@pagesmith/site/vite";

pagesmithSsg({
  entry: "./src/entry-server.tsx",
  async beforeBuild({ outDir, config, logger }) {
    const posts = await loadPublishedPosts();
    const xml = generateFeed(posts, {
      origin: "https://example.com",
      basePath: config.base.replace(/\/+$/, ""),
      title: "Example Blog",
      description: "Latest posts",
      language: "en",
    });
    writeFileSync(`${outDir}/rss.xml`, xml);
    logger.info(`rss.xml written with ${posts.length} item(s)`);
  },
});
```

The runner is also exported standalone as `runBeforeBuildHook(hook, ctx)` (from `@pagesmith/site/vite`) for unit testing a `beforeBuild` hook in isolation.

**SSR Entry Module** must export:

| Export      | Signature                                                             | Description                          |
| ----------- | --------------------------------------------------------------------- | ------------------------------------ |
| `getRoutes` | `(config: SsgRenderConfig) => string[]`                               | Return all route paths to pre-render |
| `render`    | `(url: string, config: SsgRenderConfig) => string \| Promise<string>` | Render a route to an HTML string     |

**SsgRenderConfig:**

```ts
type SsgRenderConfig = {
  base: string; // Base path (e.g., '/my-site')
  root: string; // Absolute project root
  cssPath: string; // Path to the built CSS asset
  jsPath?: string; // Path to the built JS asset
  searchEnabled: boolean;
  isDev: boolean;
};
```

### `sharedAssetsPlugin()`

Middleware plugin that serves `@pagesmith/site`'s bundled font files (woff2) and `fonts.css` during development. In production, fonts are copied to the output directory by the SSG build plugin.

### `prerenderRoutes(options)`

Lower-level utility function (not a Vite plugin) for simpler SSG scenarios where you run separate client and SSR builds. Loads the SSR entry, renders each route, and injects rendered HTML into the client template by replacing a `<!--ssr-outlet-->` placeholder.

The SSR entry must export a `render(url: string): string` function.

```ts
type PrerenderOptions = {
  /** Absolute path to the client build output directory (e.g., `dist/`) */
  outDir: string;
  /** Absolute path to the built SSR entry module (e.g., `dist/.server/entry-server.js`) */
  serverEntry: string;
  /** Routes to pre-render (e.g., `['/', '/about', '/posts/hello-world']`) */
  routes: string[];
  /** HTML placeholder to replace with rendered content (default: `'<!--ssr-outlet-->'`) */
  placeholder?: string;
  /** Remove the server build directory after pre-rendering (default: true) */
  cleanup?: boolean;
  /** Maximum routes rendered in parallel (default: host available parallelism) */
  concurrency?: number;
};
```

Routes render through `@pagesmith/core`'s shared bounded worker pool (`mapWithConcurrency`) -- the same primitive the built-in `pagesmithSsg` route rendering uses. Each route writes an independent file, so output is identical regardless of `concurrency`; only render throughput changes. Pass `concurrency: 1` to force the previous fully-serial behavior.

Returns `Promise<{ pages: number }>` with the count of rendered pages.

**Usage:**

```ts
import { build } from "vite";
import { prerenderRoutes } from "@pagesmith/site/vite";

// 1. Client build
await build({ build: { outDir: "dist" } });

// 2. SSR build
await build({ build: { ssr: "src/entry-server.tsx", outDir: "dist/.server" } });

// 3. Pre-render
await prerenderRoutes({
  outDir: resolve("dist"),
  serverEntry: resolve("dist/.server/entry-server.js"),
  routes: ["/", "/about", "/posts/hello-world"],
});
```

---

## `@pagesmith/site/ssg-utils`

Shared serializers used both internally (`@pagesmith/docs`'s own sitemap generation) and by custom `@pagesmith/site` builds -- typically called from a `pagesmithSsg({ beforeBuild })` hook (see above).

### `generateFeed(entries, config)`

Generate an RSS 2.0 feed document.

```ts
type FeedEntry = {
  title: string;
  /** Route path; may already carry the base path (`withBasePath` is idempotent) */
  path: string;
  /** Entries without one are excluded from the feed */
  publishedDate?: string | Date;
  /** Falls back to `title` when omitted */
  description?: string;
  /** Emitted as `<category>` elements */
  tags?: string[];
};

type FeedConfig = {
  origin: string; // e.g. 'https://example.com'
  basePath?: string; // e.g. '/blog'
  title: string; // channel <title>
  description: string; // channel <description>
  language: string; // channel <language>, e.g. 'en'
  limit?: number; // max items, default 50
  buildDate?: Date; // <lastBuildDate>; defaults to now
};

function generateFeed(entries: FeedEntry[], config: FeedConfig): string;
```

Items are filtered to those with a `publishedDate`, sorted newest-first, and capped at `limit`. Dates render as RFC-822 (`toUTCString()`); text fields are XML-escaped.

```ts
import { writeFileSync } from "fs";
import { generateFeed } from "@pagesmith/site/ssg-utils";

const xml = generateFeed(posts, {
  origin: "https://example.com",
  basePath: "/blog",
  title: "Example",
  description: "Latest posts",
  language: "en",
});
writeFileSync("dist/rss.xml", xml);
```

### `generateSitemap(routes, config)`

Generate a `sitemap.xml` document.

```ts
type SitemapConfig = {
  origin: string;
  basePath?: string;
};

function generateSitemap(routes: string[], config: SitemapConfig): string;
```

`routes` are paths relative to the base URL -- use `''` or `'/'` for the home page. Callers are responsible for excluding non-indexable routes (draft pages, redirect stubs) before calling; this stays a pure serializer.

```ts
import { generateSitemap } from "@pagesmith/site/ssg-utils";

const xml = generateSitemap(["", "/about", "/blog/hello"], {
  origin: "https://example.com",
  basePath: "/docs",
});
```

`@pagesmith/docs` delegates its own `sitemap: true` output to this exact function, so custom `@pagesmith/site` sites get an identical sitemap format for free.

### `runPagefindIndexing(outDir, options?)`

Runs the Pagefind indexer over a built output directory. Used internally by `pagesmithSsg`; see the [Runtime Reference](../runtime/README.md) for full details.

---

## `@pagesmith/site/build-validator`

Post-build structural checks over emitted static HTML. Typically run from a `postbuild` script or the `pagesmith-docs validate --build` flow.

```ts
import { runBuildValidation } from "@pagesmith/site/build-validator";

const exitCode = runBuildValidation({
  outDir: resolve("dist"),
  basePath: "/my-site",
  checkSitemap: true,
  checkBundledAssets: true,
});
process.exit(exitCode);
```

Relevant `BuildValidatorOptions` (in addition to the existing internal-link, image-structure, and trailing-slash checks):

| Option               | Type      | Default | Description                                                                                                                                                                                                                                                                  |
| -------------------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkSitemap`       | `boolean` | `false` | Cross-checks `sitemap.xml` against emitted HTML: every `<loc>` must resolve to an emitted file (**error** if not), and every indexable HTML page (non-redirect, excluding `404.html`) should appear in the sitemap (**warning** if not). No-op when `sitemap.xml` is absent. |
| `checkBundledAssets` | `boolean` | `false` | Verifies the entry `index.html` references at least one bundled CSS asset and one bundled JS asset, and that each referenced bundle resolves on disk. Catches an empty or broken production bundle.                                                                          |

`validateBuildOutput(options)` returns the full `{ errors, warnings, ... }` result if you want to inspect issues programmatically instead of exiting the process; `runBuildValidation(options)` prints a report and returns the process exit code.

`pagesmith-docs validate --build` does not yet pass `checkSitemap` or `checkBundledAssets` (it already requires `sitemap.xml` to _exist_ via `requiredFiles`, just not the deeper cross-check) -- opt in yourself by calling `validateBuildOutput`/`runBuildValidation` directly in a custom validation script if you want the stronger guarantee today.

---

## SEO And Structured Data

`SiteDocument` (from `@pagesmith/site/components`) emits Open Graph/Twitter meta tags and, unless explicitly disabled, a schema.org JSON-LD `<script type="application/ld+json">` block built from the same already-resolved page metadata.

```ts
type SiteDocumentSeo = {
  locale?: string;
  twitterHandle?: string;
  defaultOgType?: string;
  jsonLd?: boolean; // default true
};
```

Pass `isHome` to `SiteDocument` on the home page and set `meta.ogType = 'article'` (with an optional `meta.articleType`, default `'Article'`) on content pages:

- `meta.ogType === 'article'` -> an `Article` (or `BlogPosting` / `NewsArticle` / `TechArticle` via `meta.articleType`) JSON-LD block, using `headline`, `description`, `datePublished`/`dateModified`, `author`, canonical `url`, and the resolved OG image.
- `isHome` (and not an article) -> a `WebSite` JSON-LD block with `name`, `url`, `description`.
- Set `seo.jsonLd: false` (site config) to opt out entirely.

The builders are also exported standalone for a hand-rolled document shell:

```ts
import {
  buildArticleStructuredData,
  buildWebsiteStructuredData,
  serializeJsonLd,
} from "@pagesmith/site";

const data = buildArticleStructuredData({
  type: "BlogPosting",
  headline: "Hello, world",
  description: "An example post",
  datePublished: "2026-01-15",
  author: "Ada Lovelace",
  url: "https://example.com/blog/hello",
  image: "https://example.com/og/hello.png",
});

const script = `<script type="application/ld+json">${serializeJsonLd(data)}</script>`;
```

`serializeJsonLd` escapes `<` as `\u003c` so a stray `</script>` (or `<!--`) inside a string value cannot terminate the script element or open an HTML comment -- the escaped output is still valid JSON and parses back to the original string.

`@pagesmith/docs` wires this through its own theme (`Html.tsx` re-exports `Html`, the docs wrapper that renders `SiteDocument`): `DocHome` passes `isHome`, so every docs site gets a `WebSite` block on its home page, and `DocPage` passes `meta={{ ogType: 'article', ... }}`, so every content page gets an `Article` block automatically -- no config needed. See [Docs Theme Reference](../docs-theme/README.md) for the full layout-to-component wiring.

---

## `@pagesmith/site/runtime`

CSS and JS asset accessors for pre-built runtime bundles. See the [Runtime Reference](../runtime/README.md) for full details.

| Function               | Returns                              |
| ---------------------- | ------------------------------------ |
| `getRuntimeCSS()`      | Standalone CSS as a string           |
| `getRuntimeJS()`       | Standalone runtime JS as a string    |
| `getRuntimeCSSPath()`  | Absolute file path to standalone CSS |
| `getRuntimeJSPath()`   | Absolute file path to standalone JS  |
| `getContentCSS()`      | Content-only CSS as a string         |
| `getContentJS()`       | Content-only runtime JS as a string  |
| `getContentCSSPath()`  | Absolute file path to content CSS    |
| `getContentJSPath()`   | Absolute file path to content JS     |
| `getViewportCSS()`     | Viewport CSS as a string             |
| `getViewportCSSPath()` | Absolute file path to viewport CSS   |

---

## `@pagesmith/core/create`

Programmatic project scaffolding. Supports local templates (bundled) and remote templates (downloaded from GitHub examples). Import `createProject` and `listTemplates` from this module when building tooling; there is no separate `pagesmith create` CLI command.

| Export                                     | Description                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createProject(projectName, templateName)` | Scaffold a new project from a template. Creates the directory, copies files, adapts paths for standalone use, and writes `package.json`. |
| `templates`                                | Array of available `Template` definitions                                                                                                |
| `listTemplates()`                          | Returns a formatted string listing all available templates with descriptions                                                             |

**Template type:**

```ts
type Template = {
  name: string;
  description: string;
  source: "local" | "github";
  path: string;
  dependency: "@pagesmith/core" | "@pagesmith/site" | "@pagesmith/docs";
  scripts: Record<string, string>;
};
```

**Available templates:**

| Name     | Description                                    | Package           |
| -------- | ---------------------------------------------- | ----------------- |
| `docs`   | Documentation site with @pagesmith/docs        | `@pagesmith/docs` |
| `blog`   | Blog with custom layouts using @pagesmith/site | `@pagesmith/site` |
| `react`  | React SSG site with react-router               | `@pagesmith/site` |
| `solid`  | SolidJS SSG site                               | `@pagesmith/site` |
| `svelte` | Svelte SSG site                                | `@pagesmith/site` |
| `ejs`    | Vanilla Node.js + EJS templates                | `@pagesmith/site` |
| `hbs`    | Vanilla Node.js + Handlebars templates         | `@pagesmith/site` |

**Usage:**

```ts
import { createProject, listTemplates } from "@pagesmith/core/create";

// List available templates
console.log(listTemplates());

// Scaffold a new project
await createProject("my-docs", "docs");
```

---

## `@pagesmith/core/ai`

AI assistant artifact installer for generating memory, skill, and llms files.

| Export                        | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| `getAiArtifacts()`            | List all available AI artifacts                            |
| `getAiArtifactContent(kind)`  | Get the content of a specific artifact                     |
| `installAiArtifacts(options)` | Install artifacts for an assistant (Claude, Codex, Gemini) |

**Types:**

| Type               | Description                        |
| ------------------ | ---------------------------------- |
| `AiAssistant`      | `'claude' \| 'codex' \| 'gemini'`  |
| `AiArtifact`       | An individual artifact definition  |
| `AiArtifactKind`   | Kind of artifact                   |
| `AiInstallOptions` | Options for `installAiArtifacts()` |
| `AiInstallResult`  | Result of an install operation     |
| `AiInstallScope`   | `'project' \| 'user'`              |

---

## `@pagesmith/docs`

### Export Paths

| Import Path                       | Purpose                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pagesmith/docs`                 | Main barrel -- `build()`, `startDev()`, `preview()`, `defineDocsConfig()`, `loadDocsConfig()`, `resolveDocsConfig()`, `validateConfig()`, `reportConfigIssues()`, `withBase()`, navigation helpers, MCP, types |
| `@pagesmith/docs/preset`          | `docsPreset()` -- programmatic access to build/dev/preview                                                                                                                                                     |
| `@pagesmith/docs/components`      | Reusable docs chrome components for layout overrides                                                                                                                                                           |
| `@pagesmith/docs/layouts`         | Reusable docs layout helpers for custom themes                                                                                                                                                                 |
| `@pagesmith/docs/jsx-runtime`     | JSX runtime for docs layout overrides                                                                                                                                                                          |
| `@pagesmith/docs/jsx-dev-runtime` | Dev JSX runtime for docs layout overrides                                                                                                                                                                      |
| `@pagesmith/docs/schemas`         | Docs config Zod schemas                                                                                                                                                                                        |
| `@pagesmith/docs/theme`           | Stock docs theme exports                                                                                                                                                                                       |
| `@pagesmith/docs/mcp`             | Docs MCP server entry                                                                                                                                                                                          |

### Config resolution and validation

| Export                                     | Description                                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveDocsConfig(configPath?, options?)` | Load `pagesmith.config.json5`, apply defaults and absolute paths, resolve `basePath`, and return a `ResolvedDocsConfig`. Optional `options` can override CLI-equivalent values (e.g. `basePath`, `outDir`). |
| `validateConfig(config)`                   | Validate a `ResolvedDocsConfig` and return `ConfigValidationIssue[]` (errors and warnings).                                                                                                                 |
| `reportConfigIssues(issues)`               | Print issues to the console; returns `true` if any error-severity issues are present.                                                                                                                       |

### `docsPreset()`

Import: `@pagesmith/docs/preset`

Returns a `SitePreset`-shaped object that the `pagesmith-site` CLI can also drive. Useful for tooling integrations or custom build scripts that want to invoke the docs pipeline without going through the `pagesmith-docs` CLI.

```ts
import { docsPreset } from "@pagesmith/docs/preset";

const docs = docsPreset();

// Build the docs site
await docs.build({ configPath: "./pagesmith.config.json5" });

// Start dev server
await docs.dev({ configPath: "./pagesmith.config.json5", port: 3000 });

// Preview built output
await docs.preview({ configPath: "./pagesmith.config.json5", port: 4000 });

// Run validate; returns the process exit code (0 = pass)
const code = await docs.validate({ configPath: "./pagesmith.config.json5" });

// init / mcp accept argv-style strings and forward to the matching CLI command
await docs.init(["--ai", "--yes"]);
await docs.mcp(["--stdio"]);
```

**Methods:**

| Method     | Signature                                            | Description                                                          |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `build`    | `(options?: SiteBuildOptions) => Promise<void>`      | Run a full production build                                          |
| `dev`      | `(options?: SiteDevOptions) => Promise<void>`        | Start the dev server with live reload                                |
| `preview`  | `(options?: SiteDevOptions) => Promise<void>`        | Serve the built output for local verification                        |
| `validate` | `(options?: SiteValidateOptions) => Promise<number>` | Run content + build-output validation; returns the process exit code |
| `init`     | `(argv: string[]) => Promise<void>`                  | Forward to `pagesmith-docs init` argv                                |
| `mcp`      | `(argv: string[]) => Promise<void>`                  | Start the docs MCP server (`--stdio`)                                |

`SiteBuildOptions`, `SiteDevOptions`, and `SiteValidateOptions` are the same option types the `pagesmith-site` CLI passes to a preset (see `@pagesmith/site/preset`). `SiteBuildOptions` carries `configPath`, `outDir`, and `basePath`; `SiteDevOptions` adds `port`, `open`, and `logLevel`; `SiteValidateOptions` adds the same flag set the `pagesmith-docs validate` CLI exposes.

---

## `@pagesmith/core/mcp`

Programmatic MCP server entry. Import after wiring up your own `ContentLayer`:

```ts title="scripts/pagesmith-core-mcp.mjs"
import collections from "../content.config.js";
import { createContentLayer, defineConfig } from "@pagesmith/core";
import { startCoreMcpServer } from "@pagesmith/core/mcp";

const layer = createContentLayer(defineConfig({ collections }));
await startCoreMcpServer({ layer, rootDir: process.cwd() });
```

| Export                                     | Description                                                           |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `createCoreMcpServer({ layer, rootDir? })` | Build (but do not connect) an `McpServer` named `@pagesmith/core-mcp` |
| `startCoreMcpServer({ layer, rootDir? })`  | Build and connect via `StdioServerTransport`                          |

Tools registered: `core_list_collections`, `core_list_entries`, `core_get_entry`, `core_validate`, `core_search_entries`. Resources: `pagesmith://core/agents/usage`, `pagesmith://core/llms-full`, `pagesmith://core/reference`.

There is no standalone `pagesmith-core mcp` CLI because the server needs a live `ContentLayer` instance from the host project.

---

## `@pagesmith/core/cli-kit`

Shared CLI building blocks reused by `pagesmith-core`, `pagesmith-site`, and `pagesmith-docs`. Use this when you build your own CLI on top of Pagesmith conventions.

| Export                                                                                                                                                    | Description                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineCli({ name, version, description })`                                                                                                               | Wraps `cac` and returns `{ cli, run }`; honors `--yes`, `--non-interactive`, `--interactive`, `--config`, `CI=1`, `PAGESMITH_NON_INTERACTIVE=1` |
| `withInteractivityFlags(command)` / `withConfigFlag(command)`                                                                                             | Add the standard interactivity / `--config` flags to an individual `cac` command                                                                |
| `CliError`, `formatCliError`, `exitCodeFor`                                                                                                               | Structured CLI errors with `hint` support and predictable exit codes                                                                            |
| `assertValue`, `resolveInteractive`, `isInteractive`, `isNonInteractiveEnv`                                                                               | Interactivity helpers used inside command implementations                                                                                       |
| `promptText` / `promptConfirm` / `promptSelect` / `promptMultiselect`, `intro`, `outro`, `note`, `log`, `spinner`, `tasks`, `group`, `cancel`, `isCancel` | `@clack/prompts` re-exports for consistent UX                                                                                                   |
| `findPagesmithConfig`, `loadPagesmithConfig`, `readPagesmithConfig`, `PAGESMITH_CONFIG_BASENAMES`                                                         | Locate and load `pagesmith.config.{ts,mts,mjs,js,json5,json}` (TS/JS via `jiti`, JSON5/JSON via `JSON5.parse`)                                  |
| `readPackageVersion(metaDirname)`                                                                                                                         | Read the `version` from the nearest `package.json` (used by CLI bins)                                                                           |
