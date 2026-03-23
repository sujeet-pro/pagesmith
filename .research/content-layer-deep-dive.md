# Research: Content Layer & Content Collections -- Architecture, APIs, and Implementation Patterns

## Key Takeaways

- **Astro Content Layer (v5+)** is the most mature and architecturally sophisticated system: scoped key-value data store, parallel loader invocation, digest-based change detection, Devalue serialization, and a clean separation between build-time and live (v6) data fetching.
- **Contentlayer** pioneered the `defineDocumentType` + computed fields + type generation pattern but is now abandoned (Stackbit/Netlify acquisition killed funding). Its design DNA lives on in successors.
- **Velite** is the closest spiritual successor to Contentlayer: framework-agnostic, Zod-based schemas with rich built-in helpers (`s.markdown()`, `s.image()`, `s.toc()`, `s.metadata()`), and a `.transform()` pattern for computed fields.
- **Content Collections (sdorra)** takes a different approach -- raw content as strings, all processing via `transform()`, giving maximum flexibility and no vendor lock-in.
- **Fumadocs** is documentation-focused with `defineDocs` combining doc + meta collections, a generated `.source` folder, and tight Next.js integration.
- **Keystatic** is a file-based CMS with a visual editor, using Markdoc under the hood, with local/GitHub/cloud storage modes.
- **Markdoc** provides the most robust validation story: schema-based tag/node validation, declarative format (no arbitrary JS mixing), AST-based static analysis.
- **Diagram-to-SVG** is typically handled as a rehype/remark plugin (rehype-mermaid) or a separate preprocessing step (Excalidraw CLI tools using Playwright).

---

## 1. Astro Content Collections (v5+)

### 1.1 defineCollection() API

The `defineCollection()` function is the core configuration primitive, defined in `src/content.config.ts`:

```typescript
// src/content.config.ts
import { file, glob, } from 'astro/loaders'
import { z, } from 'astro/zod'
import { defineCollection, } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', },),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().optional(),
    tags: z.array(z.string(),),
  },),
},)

const authors = defineCollection({
  loader: file('src/data/authors.json',),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
  },),
},)

// References between collections
const blogWithRefs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', },),
  schema: ({ image, },) =>
    z.object({
      title: z.string(),
      author: reference('authors',),
      relatedPosts: z.array(reference('blog',),),
      cover: image(), // schema helper for images
    },),
},)

export const collections = { blog, authors, }
```

Key design decisions:

- **`loader` is required** (not optional) -- every collection must declare its data source
- **`schema` is optional** -- you can have untyped collections, but you lose type safety
- **Zod is the schema engine** -- imported from `astro/zod` (Astro's own re-export)
- **`reference()` creates cross-collection links** -- validated at build time, resolved via `getEntry()`
- **`image()` is a schema context helper** -- validates image existence and provides metadata

Source: [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) | [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/)

### 1.2 Built-in Loaders

**glob() loader** -- multi-file directory loading:

```typescript
glob({
  pattern: '**/*.md', // glob pattern(s) for files
  base: './src/content/blog', // root directory
  generateId: ({ entry, data, },) => data.slug || entry, // custom ID gen
  retainBody: true, // whether to store raw content (default: true)
},)
```

- Supports: Markdown, MDX, Markdoc, JSON, YAML, TOML
- IDs are auto-generated as URL-friendly slugs from filenames
- Frontmatter `slug` property overrides the generated ID

**file() loader** -- single-file loading:

```typescript
file('src/data/dogs.json',) // auto-detects format
file('src/data/custom.csv', {
  parser: (text,) => parseCSV(text,), // custom parser for unsupported formats
},)
```

- JSON: expects array of objects with `id` field
- YAML: same as JSON
- TOML: each top-level table becomes an entry
- Custom `parser()` for arbitrary formats

**Function loader** -- simplest form, returns array directly:

```typescript
const countries = defineCollection({
  loader: async () => {
    const response = await fetch('https://api.example.com/countries',)
    return (await response.json()).map(c => ({ id: c.code, ...c, }))
  },
},)
```

Source: [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/)

### 1.3 Custom Loader Architecture

Custom loaders are objects with a `name`, `load()` method, and optional `schema`:

```typescript
export function myLoader(options: { apiUrl: string },) {
  return {
    name: 'my-loader',

    load: async (context: LoaderContext,) => {
      const { store, meta, logger, parseData, generateDigest, watcher, } = context

      // Check if content changed using meta store
      const lastModified = meta.get('lastModified',)
      const response = await fetch(options.apiUrl, {
        headers: lastModified ? { 'If-Modified-Since': lastModified, } : {},
      },)

      if (response.status === 304) {
        logger.info('Content unchanged, skipping',)
        return
      }

      const data = await response.json()
      store.clear()

      for (const item of data) {
        const digest = generateDigest(item,)

        // Skip if content hasn't changed (digest comparison)
        if (store.has(item.id,) && store.get(item.id,)?.digest === digest) {
          continue
        }

        const parsed = await parseData({ id: item.id, data: item, },)
        store.set({ id: item.id, data: parsed, digest, },)
      }

      meta.set('lastModified', response.headers.get('Last-Modified',),)
    },

    schema: z.object({
      title: z.string(),
      content: z.string(),
    },),
  }
}
```

**LoaderContext** properties:

| Property             | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `store`              | Scoped key-value DataStore for this collection's entries |
| `meta`               | Persistent MetaStore for sync tokens, timestamps, etc.   |
| `logger`             | Scoped logger for this loader                            |
| `config`             | Full resolved AstroConfig                                |
| `collection`         | Collection name string                                   |
| `parseData()`        | Validates data against the collection schema             |
| `renderMarkdown()`   | Converts markdown string to HTML (same pipeline as glob) |
| `generateDigest()`   | Creates content hash for change detection                |
| `watcher`            | FSWatcher instance (dev mode only)                       |
| `refreshContextData` | Data from integration webhook triggers                   |

**DataStore API**:

```typescript
store.set({ id, data, body, digest, rendered, filePath, },) // returns boolean
store.get(id,) // DataEntry | undefined
store.has(id,) // boolean
store.delete(id,) // void
store.clear() // void
store.keys() // string[]
store.values() // DataEntry[]
store.entries() // [string, DataEntry][]
```

**DataEntry structure**:

```typescript
interface DataEntry {
  id: string
  data: Record<string, unknown>
  filePath?: string
  body?: string
  digest?: string
  rendered?: {
    html: string
    metadata?: {
      imagePaths: string[]
      headings: MarkdownHeading[]
      frontmatter: Record<string, any>
    }
  }
}
```

Source: [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) | [Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/)

### 1.4 Data Store Architecture

The data store is a **scoped key-value store** with these architectural properties:

1. **Collection isolation**: Each collection has its own store. A collection can only access its own entries.
2. **Parallel loader invocation**: All collection loaders are invoked in parallel at build time.
3. **Digest-based change detection**: When inserting data, if a digest is provided, the store checks if content has changed before updating. This prevents unnecessary rebuilds.
4. **Devalue serialization**: The store uses [Devalue](https://github.com/Rich-Harris/devalue) for serialization (not JSON), which preserves complex types like Date, RegExp, Map, Set, etc.
5. **Mutable vs Immutable**: The store is separated into `MutableDataStore` (used during loading) and an immutable version (used at query time). The mutable version is loaded from disk via `MutableDataStore.fromFile(dataStoreFile)`.
6. **Persistence**: The store is persisted between builds as a file, enabling incremental builds.

**Dev mode behavior**:

- Store can be updated on demand via `s+Enter` hotkey or integration endpoints
- Integrations can register refresh endpoints or open CMS sockets for live updates
- File watchers trigger loader re-invocation for changed content

**Build mode behavior**:

- Store updates only at build time
- Deployed site cannot change the data store
- Cache invalidated when content config or Astro version changes

**Future direction**: Astro plans to replace the key-value store with **LibSQL (SQLite)** for better scalability (millions of entries), complex queries, and improved cold-start times in serverless environments.

Source: [Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/) | [The Future of Astro Content Layer](https://astro.build/blog/future-of-astro-content-layer/) | [GitHub: MutableDataStore separation](https://github.com/withastro/astro/commit/6c1560fb0d19ce659bc9f9090f8050254d5c03f3)

### 1.5 Query APIs

```typescript
import { getCollection, getEntries, getEntry, render, } from 'astro:content'

// Get all entries
const allPosts = await getCollection('blog',)

// Filter entries
const published = await getCollection('blog', ({ data, },) => {
  return data.draft !== true
},)

// Get single entry
const post = await getEntry('blog', 'my-post-id',)
// or: await getEntry({ collection: 'blog', id: 'my-post-id' });

// Resolve references
const author = await getEntry(post.data.author,)
const relatedPosts = await getEntries(post.data.relatedPosts,)

// Render content (lazy -- compile on demand)
const { Content, headings, remarkPluginFrontmatter, } = await render(post,)
// <Content /> is an Astro component for rendering in .astro files
```

**CollectionEntry type**:

```typescript
type CollectionEntry<C extends CollectionKey,> = {
  id: string
  collection: C
  data: InferEntrySchema<C> // typed from your Zod schema
  body: string // raw uncompiled content
  rendered: RenderedContent // processed HTML from loader
  filePath: string // only for local entries
}
```

Source: [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/)

### 1.6 Type Generation

Astro auto-generates TypeScript types from schemas:

1. Define schema in `src/content.config.ts`
2. Run `npx astro sync` (or happens automatically in dev)
3. Types are generated at `.astro/types.d.ts` via `injectTypes()` utility
4. `CollectionEntry<'blog'>` gives full type safety with autocompletion
5. `CollectionKey` is a union type of all collection names

Loaders can also generate schemas dynamically via `createSchema()`:

```typescript
{
  name: 'dynamic-loader',
  createSchema: async ({ collection }) => {
    // Fetch schema from remote source
    const fields = await fetchSchemaDefinition(collection);
    return z.object(fields);
  },
  load: async (context) => { /* ... */ },
}
```

Source: [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) | [Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/)

### 1.7 Live Content Collections (Astro v6)

Astro v6 introduced **Live Content Collections** -- runtime data fetching using the same API:

```typescript
// src/live.config.ts (separate from content.config.ts)
import { defineLiveCollection, } from 'astro:content'

const news = defineLiveCollection({
  loader: myLiveLoader({ apiKey: 'xxx', },),
  schema: z.object({
    title: z.string(),
    body: z.string(),
  },),
},)

export const collections = { news, }
```

**LiveLoader interface**:

```typescript
interface LiveLoader<TData, TCollectionFilter, TEntryFilter,> {
  name: string
  loadCollection(context: {
    filter?: TCollectionFilter
  },): Promise<
    {
      entries: Array<{ id: string; data: TData; rendered?: { html: string }; cacheHint?: CacheHint }>
      cacheHint?: CacheHint
    } | { error: Error }
  >

  loadEntry(context: {
    id?: string
    filter?: TEntryFilter
  },): Promise<
    {
      entry: { id: string; data: TData; rendered?: { html: string }; cacheHint?: CacheHint } | null
      cacheHint?: CacheHint
    } | { error: Error }
  >
}

interface CacheHint {
  tags?: string[]
  lastModified?: Date
}
```

Usage:

```typescript
// In an Astro page (prerender: false)
const { entries, error, cacheHint, } = await getLiveCollection('news',)
if (error) { /* handle gracefully */ }

// Set cache headers from hints
Astro.response.headers.set('Cache-Control', 'public, max-age=600',)
Astro.response.headers.set('Cache-Tag', cacheHint.tags.join(',',),)
```

Key differences from build-time collections:

- No persistent data store -- fresh fetch on every request
- Requires an SSR adapter
- Integrates with route caching for automatic invalidation
- Error handling is explicit (discriminated union return type)

Source: [Live Content Collections Deep Dive](https://astro.build/blog/live-content-collections-deep-dive/) | [Astro 6.0](https://astro.build/blog/astro-6/)

### 1.8 Image & Asset Handling

Astro provides an `image()` schema helper in the content collections context:

```typescript
schema: ;
;(({ image, },) =>
  z.object({
    title: z.string(),
    cover: image(), // validates image exists, returns metadata
  },))
```

The `image()` helper:

- Validates the referenced image file exists at build time
- Returns image metadata (dimensions, format, etc.)
- Can be passed to `<Image />` or `<Picture />` components for optimization
- Supports format conversion (WebP), compression, and responsive sizes
- In the rendered DataEntry, image paths are tracked in `rendered.metadata.imagePaths`
- Remote images respect HTTP `Cache-Control` headers

Source: [Astro Images Guide](https://docs.astro.build/en/guides/images/) | [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/)

---

## 2. Contentlayer (Abandoned)

### 2.1 Core API: defineDocumentType

```typescript
// contentlayer.config.ts
import { defineDocumentType, makeSource, } from 'contentlayer/source-files'

const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: '**/*.md',
  contentType: 'markdown', // 'markdown' | 'mdx' | 'data'

  fields: {
    title: { type: 'string', required: true, },
    date: { type: 'date', required: true, },
    description: { type: 'string', },
    tags: { type: 'list', of: { type: 'string', }, },
  },

  computedFields: {
    url: {
      type: 'string',
      resolve: (doc,) => `/posts/${doc._raw.flattenedPath}`,
    },
    readingTime: {
      type: 'number',
      resolve: (doc,) => Math.ceil(doc.body.raw.split(/\s+/,).length / 200,),
    },
  },
}))

const GlobalConfig = defineDocumentType(() => ({
  name: 'GlobalConfig',
  filePathPattern: 'config/global.yaml',
  isSingleton: true, // exports single object, not array
  contentType: 'data',
  fields: {
    siteName: { type: 'string', required: true, },
  },
}))

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, GlobalConfig,],
},)
```

**Key properties of defineDocumentType**:

| Property          | Required | Description                                                                                                 |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `name`            | Yes      | Identifier; generates `allPosts` collection and TypeScript types                                            |
| `filePathPattern` | Yes      | Glob pattern relative to `contentDirPath`                                                                   |
| `fields`          | No       | Data schema with built-in types (string, number, boolean, date, enum, list, nested, reference, json, image) |
| `computedFields`  | No       | On-the-fly calculated fields with `resolve(doc)` functions                                                  |
| `contentType`     | No       | `'markdown'` (default), `'mdx'`, or `'data'`                                                                |
| `isSingleton`     | No       | Exports single object instead of array                                                                      |
| `description`     | No       | Documentation for generated types                                                                           |

### 2.2 Caching Strategy

- Generated files live in `.contentlayer/generated/` directory
- Contains: JSON representations, TypeScript type definitions, ES module index
- **Incremental builds**: Only rebuilds changed content
- Cached content persists between builds
- Changes are detected by file modification times

### 2.3 Why It Was Abandoned

1. **Financial**: Primary sponsor Stackbit was acquired by Netlify, killing funding
2. **Maintainer capacity**: Developer could allocate "one day a month"
3. **Framework incompatibility**: Issues with newer Next.js versions piled up (#575, #665)
4. **Documentation gaps**: Integration docs became stale
5. **Stability issues**: TypeErrors, peer dependency conflicts went unfixed
6. Last release: mid-2023

### 2.4 Successors

| Project                          | Approach                                             | Status              |
| -------------------------------- | ---------------------------------------------------- | ------------------- |
| **Content Collections (sdorra)** | Contentlayer-inspired, raw content, transform-based  | Actively maintained |
| **Velite**                       | Zod-based, rich built-in schemas, framework-agnostic | Actively maintained |
| **Contentlayer2 (timlrx)**       | Community fork of Contentlayer                       | Maintenance mode    |
| **Markdownlayer**                | Simpler, more efficient alternative                  | Smaller community   |

Source: [Contentlayer defineDocumentType](https://contentlayer.dev/docs/reference/source-files/define-document-type-eb9db60e) | [Contentlayer Abandoned - Alternatives](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives) | [Contentlayer makeSource](https://contentlayer.dev/docs/reference/source-files/make-source-a5ba4922)

---

## 3. Velite

### 3.1 Configuration and Collection Definition

```typescript
// velite.config.ts
import { defineCollection, defineConfig, s, } from 'velite'

const posts = defineCollection({
  name: 'Post', // TypeScript type name (singular)
  pattern: 'posts/**/*.md', // glob pattern
  single: false, // false = array, true = single object
  schema: s.object({
    slug: s.slug('posts',), // unique slug validation
    title: s.string().max(99,),
    date: s.isodate(), // date -> ISO string
    cover: s.image(), // image processing with blur hash
    description: s.string().max(999,).optional(),
    tags: s.array(s.string(),),
    draft: s.boolean().default(false,),
    metadata: s.metadata(), // { readingTime, wordCount }
    toc: s.toc(), // table of contents tree
    excerpt: s.excerpt({ length: 200, },),
    content: s.markdown(), // markdown -> HTML
    body: s.raw(), // raw unprocessed body
  },)
    .transform(data => ({
      ...data,
      permalink: `/blog/${data.slug}`,
    })),
},)

const siteConfig = defineCollection({
  name: 'SiteConfig',
  pattern: 'site.yml',
  single: true, // outputs single object, not array
  schema: s.object({
    title: s.string(),
    description: s.string(),
  },),
},)

export default defineConfig({
  root: 'content', // content directory (default: 'content')
  strict: false, // throw on validation errors?
  output: {
    data: '.velite', // generated data directory
    assets: 'public/static', // processed assets
    base: '/static/', // public URL base for assets
    name: '[name]-[hash:8].[ext]', // asset naming template
    clean: false, // clean output before build
    format: 'esm', // 'esm' | 'cjs'
  },
  collections: { posts, siteConfig, },
  markdown: {
    gfm: true,
    removeComments: true,
    copyLinkedFiles: true,
    remarkPlugins: [],
    rehypePlugins: [],
  },
  mdx: {/* same options as markdown */},
  prepare: ({ posts, siteConfig, },) => {
    // Hook: runs before file output, modify data
  },
  complete: () => {
    // Hook: runs after successful build
  },
},)
```

### 3.2 Built-in Schemas (the `s` Object)

The `s` object extends Zod with content-specific validators:

| Schema                   | Signature                            | Purpose                                                                                |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `s.isodate()`            | `string -> string`                   | Converts date strings to ISO format                                                    |
| `s.unique(by?)`          | `string -> string`                   | Validates uniqueness within scope                                                      |
| `s.slug(by?, reserved?)` | `string -> string`                   | Validates slug format + uniqueness                                                     |
| `s.file(options?)`       | `string -> string`                   | Processes file paths, copies to assets, returns public URL                             |
| `s.image(options?)`      | `string -> Image`                    | Processes images, returns `{ src, width, height, blurDataURL, blurWidth, blurHeight }` |
| `s.metadata()`           | `body -> { readingTime, wordCount }` | Extracts reading metrics from markdown body                                            |
| `s.excerpt(options?)`    | `body -> string`                     | Generates text excerpt from body (default: 260 chars)                                  |
| `s.markdown(options?)`   | `body -> string`                     | Converts markdown body to HTML                                                         |
| `s.mdx(options?)`        | `body -> string`                     | Compiles MDX body to function-body string                                              |
| `s.raw()`                | `body -> string`                     | Returns unprocessed document body                                                      |
| `s.toc(options?)`        | `body -> TocEntry[]`                 | Generates table of contents from headings                                              |
| `s.path(options?)`       | `-> string`                          | Flattens file path into content path                                                   |

The `Image` type returned by `s.image()`:

```typescript
interface Image {
  src: string // '/static/avatar-34kjfdsi.png'
  width: number
  height: number
  blurDataURL: string // base64 blur placeholder
  blurWidth: number
  blurHeight: number
}
```

### 3.3 Computed Fields via .transform()

Velite uses Zod's native `.transform()` for computed fields:

```typescript
// Simple computed fields
.transform(data => ({
  ...data,
  permalink: `/blog/${data.slug}`,
  wordCount: data.content.split(/\s+/).length,
}))

// With file metadata context
.transform((data, { meta }) => ({
  ...data,
  filePath: meta.path,
  // meta extends VeliteFile: { content, plain, path, ... }
}))

// Reusable computed field helper
const computedFields = <T extends { slug: string }>(data: T) => ({
  ...data,
  slugAsParams: data.slug.split('/').slice(1).join('/'),
});

// Apply to multiple collections
schema: s.object({ /* ... */ }).transform(computedFields)
```

### 3.4 Output

Velite outputs to the `.velite/` directory:

- JSON data files for each collection
- TypeScript type definitions (`.d.ts`)
- ESM/CJS entry files for importing into your app
- Processed assets (images with hashes) in `public/static/`

Usage in application code:

```typescript
import { posts, } from '.velite'
// posts is typed as Post[]
```

Source: [Velite Define Collections](https://velite.js.org/guide/define-collections) | [Velite Schemas](https://velite.js.org/guide/velite-schemas) | [Velite Configuration](https://velite.js.org/reference/config) | [Velite Introduction](https://velite.js.org/guide/introduction)

---

## 4. Content Collections (sdorra)

### 4.1 Core API

```typescript
// content-collections.ts
import { defineCollection, defineConfig, } from '@content-collections/core'
import { z, } from 'zod'

const posts = defineCollection({
  name: 'posts',
  directory: 'src/posts',
  include: '**/*.md',
  schema: (z,) => ({
    title: z.string().min(1,).max(160,),
    date: z.string(),
    author: z.object({
      name: z.string(),
      email: z.string().email().optional(),
    },),
    tags: z.array(z.string(),),
  }),

  // Content is RAW -- you process it yourself
  transform: async (context, document,) => {
    const { content, ...data } = document

    // Compile MDX (or use any library you want)
    const body = String(
      await compile(content, {
        outputFormat: 'function-body',
      },),
    )

    // Cross-collection reference resolution
    const authorDoc = context.documents(authors,)
      .find(a => a.name === data.author.name)

    return {
      ...data,
      body,
      slug: data.title.toLowerCase().replace(/\s/g, '-',),
      author: authorDoc,
    }
  },

  onSuccess: (docs,) => {
    console.log(`Generated ${docs.length} posts`,)
  },
},)

export default defineConfig({
  collections: [posts,],
},)
```

### 4.2 Key Design Differences from Contentlayer

1. **Raw content philosophy**: Content is just a string. No built-in markdown/MDX compilation. You choose your own tools in `transform()`.
2. **Flexible transform**: Full async transform function with access to cross-collection context.
3. **Schema via Zod**: Uses standard Zod (or any StandardSchema-compliant library as of v5.28+), not a custom field type system.
4. **Auto-generated `_meta`**: Each document gets `_meta: { path, collection, fileName, directory, extension }`.
5. **No vendor lock-in**: Since content processing is in your transform, switching libraries is trivial.

### 4.3 Type Generation

Types are generated at build time:

```typescript
import { allPosts, } from 'content-collections'

// allPosts is typed based on your schema + transform return type
allPosts.forEach(post => {
  post.title // string
  post._meta.path // string -- auto-generated
  post.slug // string -- from transform
},)
```

### 4.4 Framework Integration

Currently supports:

- `@content-collections/next` for Next.js
- `@content-collections/mdx` for MDX compilation
- CLI: `content-collections build` and `content-collections watch`

Source: [Content Collections by sdorra](https://sdorra.dev/posts/2024-01-15-content-collections) | [Content Collections GitHub](https://github.com/sdorra/content-collections) | [Content Collections Configuration](https://www.content-collections.dev/docs/configuration) | [Dub Migration Guide](https://dub.co/blog/content-collections)

---

## 5. Fumadocs

### 5.1 Collection Definition

```typescript
// source.config.ts
import { defineCollections, defineDocs, } from 'fumadocs-mdx/config'
import { z, } from 'zod'

// Low-level: define individual collections
export const blog = defineCollections({
  type: 'doc', // 'doc' for Markdown/MDX, 'meta' for JSON/YAML
  dir: './content/blog',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  },),
},)

// High-level: define doc + meta collections together
export const docs = defineDocs({
  dir: 'content/guides',
  docs: {
    schema: z.object({/* doc-specific schema */},),
    mdxOptions: {/* per-collection MDX config */},
  },
  meta: {
    schema: z.object({/* meta-specific schema */},),
  },
},)
```

### 5.2 Source API and Generated Files

When the dev server starts, Fumadocs generates a `.source` folder containing parsed collections:

```typescript
// In your app
import { docs, meta, } from '@/.source'
import { loader, } from 'fumadocs-core/source'
import { createMDXSource, } from 'fumadocs-mdx/runtime/next'

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta,),
},)
```

The `.source/index` file is fully typed. Collection types include:

- **Doc collections** (`type: 'doc'`): compile Markdown/MDX -> React Server Component
- **Meta collections** (`type: 'meta'`): transform YAML/JSON -> typed data arrays

### 5.3 Advanced Features

- `mdxOptions`: override default MDX config per collection
- `postprocess.includeProcessedMarkdown`: embed processed content accessible via `getText()`
- `postprocess.valueToExport`: export `vfile.data` properties as ESM exports
- Schema can be a function receiving build context: `schema: (ctx) => z.object({ path: z.string().default(ctx.path) })`

Source: [Fumadocs Collections](https://www.fumadocs.dev/docs/mdx/collections) | [Fumadocs Getting Started](https://www.fumadocs.dev/docs/mdx) | [Fumadocs MDX v14](https://www.fumadocs.dev/blog/mdx-v14)

---

## 6. Keystatic

### 6.1 Configuration

```typescript
// keystatic.config.ts
import { collection, config, fields, singleton, } from '@keystatic/core'

export default config({
  storage: { kind: 'local', }, // 'local' | 'github' | 'cloud'
  // storage: { kind: 'github', repo: 'org/repo', branchPrefix: 'content/' },

  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'content/posts/*',
      format: { contentField: 'content', }, // single file output
      schema: {
        title: fields.slug({ name: { label: 'Title', }, },),
        date: fields.date({ label: 'Date', },),
        author: fields.text({ label: 'Author', },),
        tags: fields.array(fields.text({ label: 'Tag', },), { label: 'Tags', },),
        image: fields.image({
          label: 'Cover Image',
          directory: 'public/images/posts',
          publicPath: '/images/posts/',
        },),
        content: fields.markdoc({
          label: 'Content',
          extension: 'md', // use .md instead of .mdoc
          components: {/* custom Markdoc components */},
        },),
      },
    },),
  },

  singletons: {
    settings: singleton({
      label: 'Site Settings',
      path: 'content/settings',
      schema: {
        siteName: fields.text({ label: 'Site Name', },),
        description: fields.text({ label: 'Description', multiline: true, },),
      },
    },),
  },
},)
```

### 6.2 Key Design Choices

- **Visual editor**: Keystatic provides a full admin UI generated from your schema
- **Markdoc under the hood**: Content fields use Markdoc (Stripe's markdown superset)
- **Three storage modes**: Local (filesystem), GitHub (API), Cloud (hosted)
- **File-based output**: Content is stored as Markdown/YAML/JSON files -- no database
- **Reader API**: Programmatic access to content for server-side rendering
- **Field types**: text, slug, URL, integer, number, date, datetime, checkbox, select, multiselect, array, object, blocks, image, file, markdoc, MDX, conditional, relationship, pathReference

### 6.3 Storage Architecture

- **Local mode**: Direct filesystem read/write
- **GitHub mode**: Content fetched via GitHub API; changes committed as PRs
- **Cloud mode**: Keystatic Cloud handles auth + image hosting; content stays in Git
- `branchPrefix` scopes GitHub branch interactions for content-only branches

Source: [Keystatic Configuration](https://keystatic.com/docs/configuration) | [Keystatic](https://keystatic.com/) | [Keystatic GitHub](https://github.com/Thinkmill/keystatic)

---

## 7. Markdoc

### 7.1 Parse -> Transform -> Render Pipeline

```typescript
import Markdoc from '@markdoc/markdoc'

// 1. PARSE: markdown-it tokenizer -> AST
const ast = Markdoc.parse(markdownString,)

// 2. VALIDATE (optional): check AST against schema
const errors = Markdoc.validate(ast, config,)
// errors: Array<{ type, lines, location, error: { id, level, message } }>

// 3. TRANSFORM: AST -> renderable tree using config
const content = Markdoc.transform(ast, config,)

// 4. RENDER: renderable tree -> output
const html = Markdoc.renderers.html(content,)
// or: Markdoc.renderers.react(content, React, { components })
// or: Markdoc.renderers.reactStatic(content)  // transpiles to JS
```

### 7.2 Config Object Structure

```typescript
const config = {
  tags: {
    callout: {
      render: 'Callout', // component name
      selfClosing: false,
      children: ['paragraph', 'tag', 'list',], // allowed child nodes
      attributes: {
        type: {
          type: String,
          default: 'note',
          matches: ['caution', 'check', 'note', 'warning',],
          errorLevel: 'critical',
        },
        title: { type: String, },
      },
      validate(node, config,) {
        // Custom validation logic
        // Return array of error objects or empty array
      },
      transform(node, config,) {
        // Custom AST transformation
      },
    },
  },

  nodes: {
    heading: {
      render: 'Heading',
      attributes: {
        level: { type: Number, required: true, },
        id: { type: String, },
      },
    },
  },

  variables: {
    user: { name: 'John', plan: 'pro', },
  },

  functions: {
    upper: {
      transform(params,) {
        return params[0].toUpperCase()
      },
    },
  },

  partials: {
    header: Markdoc.parse('# {% $title %}',),
  },
}
```

### 7.3 Validation System

Markdoc's validation is schema-based and declarative:

```typescript
// Attribute validation via custom types
const ImageSrc = {
  validate(value, config,) {
    if (!value.startsWith('https://',)) {
      return [{ id: 'image-src-https', level: 'error', message: 'Images must use HTTPS', },]
    }
    return []
  },
  transform(value, config,) {
    return value
  },
}

// Node/tag content validation
const provider = {
  render: 'Provider',
  validate(node, config,) {
    if (node.children.length !== 1) {
      return [{ id: 'provider-children', level: 'critical', message: 'Provider must have exactly one child', },]
    }
    return []
  },
}
```

**Error structure**: `{ id: string, level: 'critical' | 'error' | 'warning', message: string }`

### 7.4 Key Design Principle

Markdoc enforces **strict separation between code and content**. Unlike MDX which allows arbitrary JavaScript, Markdoc is fully declarative and machine-readable. This enables:

- Static analysis of all content
- Validation before rendering
- Programmatic content transformation
- No security concerns from user-authored content

Source: [Markdoc Overview](https://markdoc.dev/docs/overview) | [Markdoc Tags](https://markdoc.dev/docs/tags) | [Markdoc Validation](https://markdoc.dev/docs/validation) | [How Stripe builds with Markdoc](https://stripe.dev/blog/markdoc)

---

## 8. File Format Support Patterns

### 8.1 How Libraries Handle Multiple Formats

| Library                      | Markdown    | MDX           | JSON          | YAML          | TOML          | Custom                |
| ---------------------------- | ----------- | ------------- | ------------- | ------------- | ------------- | --------------------- |
| Astro glob                   | Yes         | Yes           | Yes           | Yes           | Yes           | Via custom loader     |
| Astro file                   | --          | --            | Yes           | Yes           | Yes           | Via `parser()` option |
| Contentlayer                 | Yes         | Yes           | Yes (as data) | Yes (as data) | No            | No                    |
| Velite                       | Yes         | Yes           | Yes           | Yes           | No            | Via custom loaders    |
| Content Collections (sdorra) | Yes         | Via transform | Via transform | Via transform | Via transform | Via transform         |
| Fumadocs                     | Yes         | Yes           | Yes (meta)    | Yes (meta)    | No            | Via custom sources    |
| Keystatic                    | Markdoc/MDX | MDX           | Yes           | Yes           | No            | No                    |

### 8.2 Extensible Format Loader Pattern

The dominant pattern (pioneered by Astro, adopted by others):

```
defineCollection({
  loader: <format-specific-loader>(options),
  schema: <validation-schema>,
})
```

**Astro's approach** is the most extensible:

```typescript
// Built-in format detection
file('data.json',) // auto-parses JSON
file('data.yaml',) // auto-parses YAML
file('data.toml',) // auto-parses TOML

// Custom format
file('data.csv', {
  parser: (text,) => csvParse(text, { columns: true, },),
},)

// Fully custom loader for any source
const myLoader = {
  name: 'custom',
  load: async ({ store, parseData, },) => {
    // Fetch from anywhere, any format
  },
}
```

### 8.3 Schema Validation for Non-Markdown Content

All libraries apply the same Zod schema validation regardless of source format:

```typescript
// Astro: JSON collection with same schema pattern
const products = defineCollection({
  loader: file('src/data/products.json',),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive(),
    inStock: z.boolean(),
  },),
},)

// Velite: YAML collection
const authors = defineCollection({
  name: 'Author',
  pattern: 'authors/*.yml',
  schema: s.object({
    name: s.string(),
    bio: s.string(),
    avatar: s.image(),
  },),
},)
```

The key insight: **schema validation is format-agnostic**. The loader parses the format into a JS object, then the schema validates that object. This separation of concerns is consistent across all libraries.

---

## 9. Asset Handling Patterns

### 9.1 Astro's Image Pipeline

```typescript
// Schema definition with image helper
schema: ;(({ image, },) =>
  z.object({
    cover: image(), // validates existence, provides metadata
  },))

// Usage in component
const { data, } = await getEntry('blog', 'post-1',)
// data.cover is an ImageMetadata object
<Image src={data.cover} alt='Cover' />
```

Pipeline:

1. Schema `image()` helper validates file exists at build time
2. Image metadata (dimensions, format) extracted
3. `<Image />` component handles optimization: format conversion (WebP), compression, responsive sizing
4. In build mode: hashed filenames (`cover.a1b2c3.webp`)
5. In dev mode: unhashed, served directly
6. Remote images cached per HTTP `Cache-Control` headers

### 9.2 Velite's Image Processing

```typescript
cover: s.image()
// Returns: { src, width, height, blurDataURL, blurWidth, blurHeight }
```

- Copies images to `output.assets` directory (default: `public/static/`)
- Generates blur hash placeholder (base64 encoded)
- Hashes filenames: `[name]-[hash:8].[ext]`
- Returns full metadata including dimensions

### 9.3 Comparison of Asset Strategies

| Aspect            | Astro                             | Velite                               | Contentlayer             |
| ----------------- | --------------------------------- | ------------------------------------ | ------------------------ |
| Image validation  | Schema `image()` helper           | `s.image()` schema                   | Basic `image` field type |
| Blur placeholders | Via `<Image />` component         | Built into `s.image()` output        | Not built-in             |
| Hash strategy     | SHA-based, 8-char prefix in build | Configurable `[name]-[hash:8].[ext]` | N/A                      |
| Dev vs Prod       | Unhashed in dev, hashed in prod   | Always hashed                        | N/A                      |
| Format conversion | WebP via `<Image />`              | Copy only                            | N/A                      |
| Responsive images | `<Picture />` component           | Manual                               | N/A                      |

---

## 10. Diagram-to-SVG Patterns

### 10.1 Mermaid Rendering

**rehype-mermaid** (recommended) -- rehype plugin using Playwright:

```typescript
import rehypeMermaid from 'rehype-mermaid'

// In unified pipeline
unified()
  .use(remarkParse,)
  .use(remarkRehype,)
  .use(rehypeMermaid, {
    strategy: 'inline-svg', // 'inline-svg' | 'img-svg' | 'img-png' | 'pre-mermaid'
    dark: true, // dark mode support (img-svg/img-png only)
    mermaidConfig: {}, // custom Mermaid options
    colorScheme: 'light',
    css: 'https://fonts.googleapis.com/css2?family=Inter',
    errorFallback: (node, error, file,) => {/* handle gracefully */},
    launchOptions: {}, // Playwright browser launch options
    browserType: 'chromium', // Playwright browser
  },)
```

Rendering strategies:

1. **inline-svg** (default): `<svg>` elements directly in HTML. Async, no dark mode.
2. **img-svg**: `<img>` with data-URI SVG. Supports dark mode via `<picture>`.
3. **img-png**: Base64-encoded PNG `<img>`. Supports dark mode.
4. **pre-mermaid**: Preserves `<pre class="mermaid">` for client-side rendering.

**remark-mermaidjs** -- remark-level plugin (same author, older):

- Works at the markdown AST level instead of HTML
- Also uses Playwright for headless rendering
- rehype-mermaid is the recommended successor

### 10.2 Excalidraw Rendering

Multiple CLI tools exist for Excalidraw-to-SVG conversion:

| Tool                            | Method               | Notes                                                       |
| ------------------------------- | -------------------- | ----------------------------------------------------------- |
| **excalidraw-brute-export-cli** | Playwright + Firefox | Docker images available, tested with Excalidraw v0.15.0     |
| **excalidraw-to-svg**           | Node library         | `npx excalidraw-to-svg <input> <output>`, pipeline-friendly |
| **excalidraw_export**           | Node package         | SVG + optional PDF (via rsvg-convert)                       |
| **@excalidraw/utils**           | Official SDK         | `exportToSvg()` function, embeds font subsets               |

### 10.3 Architecture Patterns for Diagram Rendering

Three common approaches:

**A. As a remark/rehype plugin** (inline in content pipeline):

```
markdown -> remark-parse -> remark-rehype -> rehype-mermaid -> HTML with SVGs
```

- Pros: Integrated into unified pipeline, automatic for all content
- Cons: Requires Playwright/browser for server-side, adds build time
- Used by: rehype-mermaid, remark-mermaidjs

**B. As a preprocessing step** (separate from content pipeline):

```
.mermaid/.excalidraw files -> diagram renderer -> .svg files -> referenced in markdown
```

- Pros: Cached independently, can watch files separately, no unified dependency
- Cons: Requires separate build step, manual file management
- Used by: Pagesmith's current approach, excalidraw CLI tools

**C. As client-side rendering** (deferred to browser):

```
markdown -> HTML with <pre class="mermaid"> -> browser loads mermaid.js -> renders in DOM
```

- Pros: No server-side browser needed, simpler build
- Cons: Requires JavaScript runtime, FOUC, no SSG-friendly

**Pagesmith's approach (B)** is architecturally sound for an SSG that targets zero client-side JS. The separate `diagrams` command with file watching keeps diagram rendering isolated from the markdown pipeline, which is important because:

1. Playwright is heavyweight and shouldn't block content rebuilds
2. Diagram files change less frequently than content
3. SVG output can be cached and referenced as static assets
4. Excalidraw rendering requires a different browser setup than Mermaid

Source: [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid) | [remark-mermaidjs](https://github.com/remcohaszing/remark-mermaidjs) | [excalidraw-brute-export-cli](https://github.com/realazthat/excalidraw-brute-export-cli) | [excalidraw-to-svg](https://github.com/JRJurman/excalidraw-to-svg)

---

## 11. Architectural Comparison Matrix

### 11.1 Data Flow Comparison

**Astro Content Layer**:

```
content.config.ts -> loaders (parallel) -> DataStore (KV, Devalue) -> getCollection/getEntry -> render()
                                              |
                                         persisted to disk
```

**Contentlayer**:

```
contentlayer.config.ts -> makeSource -> file walkers -> .contentlayer/generated/ (JSON + types)
                                                              |
                                                        import { allPosts }
```

**Velite**:

```
velite.config.ts -> defineConfig -> file walkers -> schema validation -> .velite/ (JSON + types)
                                                         |
                                                    s.markdown/s.mdx processing
                                                    s.image asset processing
```

**Content Collections (sdorra)**:

```
content-collections.ts -> defineConfig -> file walkers -> schema validation -> transform() -> generated types
                                                                                    |
                                                                              import { allPosts }
```

### 11.2 Feature Comparison

| Feature          | Astro                | Contentlayer            | Velite             | CC (sdorra)           | Fumadocs           | Keystatic         |
| ---------------- | -------------------- | ----------------------- | ------------------ | --------------------- | ------------------ | ----------------- |
| Schema engine    | Zod                  | Custom types            | Zod (extended)     | Zod/Standard          | Zod/Standard       | TypeScript fields |
| Type generation  | Auto                 | Auto                    | Auto               | Auto                  | Auto               | Auto              |
| Computed fields  | Via loader transform | `computedFields`        | `.transform()`     | `transform()`         | Schema functions   | N/A               |
| Custom loaders   | Yes (full API)       | No (files only)         | Custom loaders     | Via transform         | Custom sources     | N/A               |
| Remote sources   | Yes (loader API)     | Planned (never shipped) | No                 | Via transform         | Via custom sources | GitHub API        |
| Image processing | `image()` helper     | Basic                   | `s.image()` + blur | Manual                | Manual             | Built-in field    |
| Caching          | Digest + meta store  | Incremental file        | File-based         | File-based            | Build-time         | Git-based         |
| Dev hot reload   | File watchers + WS   | File watchers           | File watchers      | CLI watch             | Dev server         | Dev server        |
| Framework        | Astro only           | Next.js focused         | Any                | Any (Next.js adapter) | Next.js focused    | Any               |
| Status (2025)    | Active, v6           | Abandoned               | Active             | Active                | Active             | Active            |

---

## Sources

1. [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) -- comprehensive guide to defining and using collections
2. [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- defineCollection, getCollection, getEntry, render, type definitions
3. [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) -- LoaderContext, DataStore API, built-in loaders, custom loader patterns
4. [Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/) -- data store architecture, caching, dev vs build mode, parallel loading
5. [The Future of Astro Content Layer](https://astro.build/blog/future-of-astro-content-layer/) -- SQLite plans, current limitations, serialization with Devalue
6. [Live Content Collections Deep Dive](https://astro.build/blog/live-content-collections-deep-dive/) -- LiveLoader interface, cache hints, route caching integration
7. [Astro 6.0 Blog](https://astro.build/blog/astro-6/) -- live collections stable, v6 changes
8. [Astro Images Guide](https://docs.astro.build/en/guides/images/) -- image optimization pipeline, `<Image />` and `<Picture />` components
9. [Community Loaders for Astro](https://astro.build/blog/community-loaders/) -- ecosystem of third-party loaders
10. [Contentlayer defineDocumentType](https://contentlayer.dev/docs/reference/source-files/define-document-type-eb9db60e) -- API reference for document type definitions
11. [Contentlayer makeSource](https://contentlayer.dev/docs/reference/source-files/make-source-a5ba4922) -- source configuration, caching
12. [ContentLayer Abandoned - Alternatives](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives) -- why it was abandoned, successor projects
13. [Velite Define Collections](https://velite.js.org/guide/define-collections) -- collection definition, computed fields, schema patterns
14. [Velite Schemas](https://velite.js.org/guide/velite-schemas) -- all built-in schemas (s.markdown, s.image, s.toc, etc.)
15. [Velite Configuration](https://velite.js.org/reference/config) -- full config reference, output options, markdown/MDX options
16. [Content Collections by sdorra](https://sdorra.dev/posts/2024-01-15-content-collections) -- motivation, architecture, transform function, type generation
17. [Content Collections GitHub](https://github.com/sdorra/content-collections) -- source code, examples
18. [Fumadocs Collections](https://www.fumadocs.dev/docs/mdx/collections) -- defineCollections, defineDocs, collection types
19. [Fumadocs Getting Started](https://www.fumadocs.dev/docs/mdx) -- source API, MDX integration
20. [Keystatic Configuration](https://keystatic.com/docs/configuration) -- collections, singletons, storage modes, field types
21. [Keystatic GitHub](https://github.com/Thinkmill/keystatic) -- source code, architecture
22. [Markdoc Overview](https://markdoc.dev/docs/overview) -- parse/transform/render pipeline, AST architecture
23. [Markdoc Tags](https://markdoc.dev/docs/tags) -- custom tag schema definition
24. [Markdoc Validation](https://markdoc.dev/docs/validation) -- schema validation, error types, custom validators
25. [How Stripe builds with Markdoc](https://stripe.dev/blog/markdoc) -- architecture decisions, renderer system
26. [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid) -- rendering strategies, Playwright integration, config options
27. [remark-mermaidjs](https://github.com/remcohaszing/remark-mermaidjs) -- remark-level mermaid rendering
28. [excalidraw-brute-export-cli](https://github.com/realazthat/excalidraw-brute-export-cli) -- Playwright-based Excalidraw export
29. [excalidraw-to-svg](https://github.com/JRJurman/excalidraw-to-svg) -- Node library for Excalidraw conversion
30. [GitHub: Astro Content Layer commit](https://github.com/withastro/astro/commit/a79a8b0230b06ed32ce1802f2a5f84a6cf92dbe7) -- implementation details, Devalue serialization
31. [GitHub: MutableDataStore separation](https://github.com/withastro/astro/commit/6c1560fb0d19ce659bc9f9090f8050254d5c03f3) -- mutable vs immutable store split

---

## Gaps & Uncertainties

- **Astro DataStore internals**: The exact serialization format (Devalue configuration, file format on disk) is not fully documented publicly. The source code shows it uses Devalue but the on-disk format details would require source code inspection.
- **Astro SQLite migration timeline**: The LibSQL/SQLite backend was announced in June 2024 as "coming later this year" but has not shipped as of early 2026. The current KV store approach remains.
- **Velite performance at scale**: No public benchmarks exist for Velite with large collections (10k+ entries). Its in-memory processing approach may have similar limitations to early Contentlayer.
- **Content Collections (sdorra) caching details**: The exact caching/invalidation strategy is not well-documented beyond "file-based."
- **Fumadocs internal architecture**: The `.source` folder generation pipeline and how it interacts with Next.js build is not extensively documented.
- **Keystatic Reader API**: The programmatic content querying API is mentioned but not detailed in the main configuration docs.
- **Markdoc v2**: There are hints of ongoing development at Stripe but no public roadmap for a v2 release.
- **Excalidraw font embedding**: The 2025 SDK update mentions font subset embedding in SVGs but details on how this works programmatically in CI/build pipelines are sparse.
