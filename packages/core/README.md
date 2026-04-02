# @pagesmith/core

File-based content toolkit for Vite. Schema-validated collections, lazy markdown rendering with Expressive Code syntax highlighting, and runtime CSS/JS exports.

## Install

```bash
npm add @pagesmith/core
```

## Quick Start

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

const layer = createContentLayer(defineConfig({ collections: { posts } }))
const entries = await layer.getCollection('posts')
const rendered = await entries[0]?.render()
// rendered.html, rendered.headings, rendered.readTime
```

### Vite Integration

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'
import { defineConfig } from 'vite'

const collections = defineCollections({
  posts: defineCollection({
    loader: 'markdown',
    directory: 'content/posts',
    schema: z.object({ title: z.string(), date: z.coerce.date() }),
  }),
})

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    pagesmithSsg({ entry: './src/entry-server.tsx' }),
  ],
})
```

Import collections as virtual modules in your SSR entry:

```ts
import posts from 'virtual:content/posts'
```

## Content Layer API

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

### Content Entry

Each entry from `getCollection()` or `getEntry()` has:

- `slug` — URL-friendly identifier
- `collection` — collection name
- `filePath` — absolute source path
- `data` — validated data (frontmatter or parsed file content, typed by your Zod schema)
- `rawContent` — raw markdown body (markdown loader only)
- `render(options?)` — lazy markdown-to-HTML; returns `{ html, headings, readTime }` (cached)
- `clearRenderCache()` — force re-render on next call

## Collections

Define collections with `defineCollection()` and a Zod schema:

```ts
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).min(1),
    draft: z.boolean().optional().default(false),
  }),
  computed: {
    year: (entry) => new Date(entry.data.date).getFullYear(),
  },
  filter: (entry) => !entry.data.draft,
  slugify: (filePath, directory) => customSlug(filePath),
  transform: (entry) => ({ ...entry, data: { ...entry.data, title: entry.data.title.trim() } }),
  validators: [myCustomValidator],
  disableBuiltinValidators: false,
})
```

### Collection Options

| Option | Type | Description |
|---|---|---|
| `loader` | `string \| Loader` | `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`, or custom |
| `directory` | `string` | Directory containing collection files (relative to root) |
| `schema` | `z.ZodType` | Zod schema for validating entry data |
| `include` | `string[]` | Glob include patterns (defaults based on loader) |
| `exclude` | `string[]` | Glob exclude patterns |
| `computed` | `Record<string, fn>` | Computed fields derived from entry data |
| `validate` | `fn` | Custom validation hook (return string for error) |
| `filter` | `fn` | Filter entries (return false to exclude) |
| `slugify` | `fn` | Custom slug generation |
| `transform` | `fn` | Pre-validation transform |
| `validators` | `ContentValidator[]` | Custom content validators |
| `disableBuiltinValidators` | `boolean` | Disable built-in markdown validators |

### Loaders

| Type | Extensions | Description |
|---|---|---|
| `markdown` | `.md` | gray-matter frontmatter + markdown body |
| `json` | `.json` | JSON.parse |
| `json5` | `.json` | JSON5 (relaxed JSON with comments, trailing commas) |
| `jsonc` | `.json`, `.jsonc` | JSON with comments |
| `yaml` | `.yml`, `.yaml` | YAML |
| `toml` | `.toml` | TOML |

Custom loaders: implement `Loader { name, kind, extensions, load(filePath) }`.

## Markdown Pipeline

The pipeline is built with unified and processes markdown through these stages:

```
remark-parse → remark-gfm → remark-math → remark-frontmatter
  → remark-github-alerts → remark-smartypants → [user remark plugins]
  → remark-rehype
  → rehype-expressive-code (syntax highlighting)
  → rehype-mathjax → rehype-slug → rehype-autolink-headings
  → heading extraction → [user rehype plugins]
  → rehype-external-links → rehype-accessible-emojis → rehype-stringify
```

### Markdown Features

**GitHub Flavored Markdown (remark-gfm):**
- Tables, strikethrough, task lists, autolinks

**GitHub Alerts (remark-github-alerts):**

```md
> [!NOTE]
> Informational note.

> [!TIP]
> Helpful tip.

> [!IMPORTANT]
> Important information.

> [!WARNING]
> Warning message.

> [!CAUTION]
> Cautionary message.
```

**Math (remark-math + rehype-mathjax):**

```md
Inline: $E = mc^2$

Block:
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

**Smart Typography (remark-smartypants):**
- "Curly quotes", em—dashes, el...lipses

**External Links (rehype-external-links):**
- Absolute URLs automatically get `target="_blank" rel="noopener noreferrer"`

**Accessible Emojis (rehype-accessible-emojis):**
- Emoji characters wrapped in `<span role="img" aria-label="...">` for screen readers

**Heading Links (rehype-slug + rehype-autolink-headings):**
- Auto-generated `id` attributes and anchor links on all headings

### Expressive Code Features

Syntax highlighting is handled by [Expressive Code](https://expressive-code.com/) with dual themes (default: `github-light` / `github-dark`). All styling is injected inline — no external CSS required.

**Dual Themes:**
Automatically switches between light and dark themes via `prefers-color-scheme` media query. Configure themes:

```ts
defineConfig({
  markdown: {
    shiki: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
})
```

**Line Numbers:**

````md
```js showLineNumbers
const x = 1
const y = 2
```
````

Or enable globally: `shiki: { defaultShowLineNumbers: true }`

**File Titles:**

````md
```js title="app.js"
export default function App() {}
```
````

**Line Highlighting (mark, ins, del):**

````md
```js mark={3} ins={4} del={5}
const a = 1
const b = 2
const c = 3  // highlighted
const d = 4  // inserted (green)
const e = 5  // deleted (red)
```
````

**Collapsible Sections:**

````md
```js collapse={1-5}
// These lines are collapsed by default
import { a } from 'a'
import { b } from 'b'
import { c } from 'c'
import { d } from 'd'
// Visible code starts here
export function main() {}
```
````

**Copy Button:**
Automatically added to all code blocks.

**Language Badges:**
Automatic language indicator on code blocks.

**Combined Example:**

````md
```ts title="server.ts" showLineNumbers mark={3} ins={7-8} collapse={1-2}
import express from 'express'
import cors from 'cors'
const app = express()  // highlighted
app.use(cors())

// New routes added
app.get('/api', handler)
app.post('/api', handler)
```
````

### Custom Plugins

Extend the pipeline with custom remark and rehype plugins:

```ts
defineConfig({
  markdown: {
    remarkPlugins: [myRemarkPlugin, [pluginWithOptions, { option: true }]],
    rehypePlugins: [myRehypePlugin],
  },
})
```

## Validation

### Schema Validation

Every entry is validated against its collection's Zod schema. Validation issues include field path, message, and severity (`'error'` | `'warn'`).

### Built-in Content Validators

For markdown collections, three validators run automatically on the parsed AST:

- **linkValidator** — warns on bare URLs, empty link text, suspicious protocols
- **headingValidator** — enforces single h1, sequential heading depth, non-empty text
- **codeBlockValidator** — warns on missing language, unknown language aliases

Disable with `disableBuiltinValidators: true`. Add custom validators via `validators` in the collection definition.

### Custom Validators

```ts
const myValidator: ContentValidator = {
  name: 'my-validator',
  validate(ctx) {
    // ctx.mdast — parsed markdown AST (shared across validators)
    // ctx.entry — the raw entry
    // return ValidationIssue[] or throw
  },
}
```

## Vite Plugins

### pagesmithContent

Virtual module plugin that exposes collections as importable modules:

```ts
pagesmithContent({
  collections,
  moduleId: 'virtual:content',     // default
  configPath: './content.config.ts', // default
  dts: true,                        // generate .d.ts
})
```

Import in your code:

```ts
import posts from 'virtual:content/posts'
// posts: ContentEntry<YourSchema>[]
```

### pagesmithSsg

Static site generation plugin:

```ts
pagesmithSsg({
  entry: './src/entry-server.tsx',
  pagefind: true,                    // run Pagefind after build (default)
  contentDirs: ['content'],          // copy companion assets
})
```

Your SSR entry must export:

```ts
export function getRoutes(config: SsgRenderConfig): string[]
export function render(url: string, config: SsgRenderConfig): string | Promise<string>
```

### sharedAssetsPlugin

Serves shared font assets (Open Sans, JetBrains Mono) bundled with `@pagesmith/core`.

## JSX Runtime

Server-side HTML generation. No browser runtime required.

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

```tsx
import { Fragment, HtmlString } from '@pagesmith/core'

function Page({ title, content }: { title: string; content: string }) {
  return (
    <html>
      <head><title>{title}</title></head>
      <body>
        <Fragment innerHTML={content} />
      </body>
    </html>
  )
}
```

- `h(tag, props, ...children)` — create HTML elements
- `Fragment` — render children or raw `innerHTML`
- `HtmlString` — wrapper that prevents double-escaping

## CSS Exports

| Import Path | Contents |
|---|---|
| `@pagesmith/core/css/content` | Prose typography + inline code styles |
| `@pagesmith/core/css/standalone` | Full layout + prose + TOC |
| `@pagesmith/core/css/viewport` | Responsive viewport base |
| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |

Code block styling is handled entirely by Expressive Code through inline styles injected during processing.

## Runtime Exports

```ts
import { getRuntimeCSS, getRuntimeJS, getContentCSS, getContentJS } from '@pagesmith/core/runtime'
```

Two tiers:
- **Standalone** (`getRuntimeCSS/JS`) — full site with layout, prose, TOC highlight
- **Content** (`getContentCSS/JS`) — markdown rendering only

## Frontmatter Schemas

Pre-defined schemas for common content types:

```ts
import { BaseFrontmatterSchema, BlogFrontmatterSchema, ProjectFrontmatterSchema } from '@pagesmith/core'
```

| Schema | Fields |
|---|---|
| `BaseFrontmatterSchema` | title, description, publishedDate, lastUpdatedOn, tags, draft |
| `BlogFrontmatterSchema` | extends base + category, featured, coverImage |
| `ProjectFrontmatterSchema` | extends base + gitRepo, links |

## AI Assistant Artifacts

Generate context files for AI assistants:

```ts
import { installAiArtifacts } from '@pagesmith/core/ai'

installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  includeLlms: true,
})
```

Generates: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, skills, `llms.txt`, `llms-full.txt`

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/core` | Main API barrel (defineCollection, createContentLayer, z, etc.) |
| `@pagesmith/core/jsx-runtime` | h, Fragment, HtmlString |
| `@pagesmith/core/jsx-dev-runtime` | JSX dev runtime (same as jsx-runtime) |
| `@pagesmith/core/markdown` | processMarkdown |
| `@pagesmith/core/css` | buildCss (LightningCSS) |
| `@pagesmith/core/css/content` | Content CSS file |
| `@pagesmith/core/css/standalone` | Standalone CSS file |
| `@pagesmith/core/css/viewport` | Viewport CSS file |
| `@pagesmith/core/css/fonts` | Bundled font faces |
| `@pagesmith/core/schemas` | Zod schemas and TypeScript types |
| `@pagesmith/core/loaders` | Loader classes and registry |
| `@pagesmith/core/assets` | Asset copying and hashing |
| `@pagesmith/core/runtime` | Pre-built CSS/JS accessors |
| `@pagesmith/core/ai` | AI assistant artifact generator |
| `@pagesmith/core/vite` | Vite plugins (pagesmithContent, pagesmithSsg, sharedAssetsPlugin) |
| `@pagesmith/core/create` | Project scaffolding utilities |

## License

MIT
