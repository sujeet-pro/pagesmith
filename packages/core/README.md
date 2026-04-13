# @pagesmith/core

Headless content layer for Pagesmith. Schema-validated collections, lazy markdown rendering with a built-in Shiki-backed code renderer, validation, loaders, and optional Vite content access.

## Requirements

- Node.js 24+

## Choose The Package

- Use `@pagesmith/core` when you want a custom app or site architecture, framework-specific rendering, or direct control over collections, routing, and rendering.
- Pair `@pagesmith/core` with `@pagesmith/site` when you need the Pagesmith JSX runtime, shared CSS/runtime behavior, Vite SSG helpers, or the `pagesmith-site` CLI.
- Use `@pagesmith/docs` when you want a convention-based docs site with `pagesmith.config.json5`, built-in navigation, search, and docs-specific AI guidance.

## Install

```bash
npm add @pagesmith/core
```

## Adoption Paths

- AI-first bootstrap or retrofit: start with `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`
- Follow-up usage patterns and prompts: `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- Upgrade an existing integration: start with `node_modules/@pagesmith/core/ai-guidelines/migration.md`
- Manual setup: follow the Quick Start and Vite Integration sections below

## Setup Prompt

For agent-driven setup in an existing repository, start with the dedicated prompt file:

- Package path: `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`
- Hosted URL: [https://projects.sujeet.pro/pagesmith/prompts/setup-core.md](https://projects.sujeet.pro/pagesmith/prompts/setup-core.md)

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

For AI-first setup, usage prompts, and upgrade notes, see `ai-guidelines/setup-core.md`, `ai-guidelines/usage.md`, and `ai-guidelines/migration.md`.

### Framework-hosted rendering

If your app already owns routing and build tooling, stop at the content layer:

```ts
import { createContentLayer, defineConfig } from '@pagesmith/core'
import collections from './content.config'

const layer = createContentLayer(defineConfig({ collections }))
const entry = await layer.getEntry('posts', 'hello-world')
const rendered = await entry?.render()
```

This is the recommended shape for integrations such as Next.js. Add `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content` only when you want Pagesmith's shipped prose and code-block UI in the browser.

### Vite Integration

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
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
    ...pagesmithSsg({ entry: './src/entry-server.tsx' }),
  ],
})
```

Import collections as virtual modules in your SSR entry:

```ts
import posts from 'virtual:content/posts'
// markdown entries: { id, contentSlug, html, headings, frontmatter }[]
// data loaders: { id, contentSlug, data }[]
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
remark-parse → remark-gfm → remark-frontmatter
  → remark-github-alerts → remark-smartypants
  → remark-math (when `markdown.math` is `true` or `'auto'` detects math markers)
  → [user remark plugins] → lang-alias transform → remark-rehype
  → rehype-mathjax (when math is enabled, before the built-in code renderer)
  → applyPagesmithCodeRenderer (syntax highlighting, frames, copy, collapse)
  → rehype-code-tabs → rehype-scrollable-tables
  → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → [user rehype plugins] → rehype-stringify
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

### Built-in Code Block Features

Pagesmith ships a built-in Shiki-backed code renderer with dual themes (default: `github-light` / `github-dark`), frames, copy buttons, collapse controls, line numbers, and line highlighting. Shared chrome and layout styles ship in Pagesmith's CSS bundles, and the shared content runtime handles tabs, copy, and collapse interactions in the browser.

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

`markdown.allowDangerousHtml` defaults to `true` so trusted content can embed raw HTML. Disable it when rendering untrusted markdown. `markdown.math` defaults to `'auto'`, which only enables the math plugins for content that contains math markers.

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

## Build A Site On Top Of Core

`@pagesmith/core` intentionally stops at the content layer.

Use `@pagesmith/site` for:

- `pagesmithSsg`, `sharedAssetsPlugin`, and `SsgRenderConfig`
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/ssg-utils`
- the `pagesmith-site` CLI

For framework-hosted apps that already own routing and build tooling, `@pagesmith/site` can stay limited to `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content`.

Typical split:

```ts
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

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
| `@pagesmith/core/markdown` | processMarkdown |
| `@pagesmith/core/schemas` | Zod schemas and TypeScript types |
| `@pagesmith/core/loaders` | Loader classes and registry |
| `@pagesmith/core/assets` | Asset copying and hashing |
| `@pagesmith/core/ai` | AI assistant artifact generator |
| `@pagesmith/core/vite` | Vite content plugin (`pagesmithContent`) |
| `@pagesmith/core/create` | Project scaffolding utilities |
| `@pagesmith/core/mcp` | Core MCP server and helper utilities |

## Further Reading

- **[REFERENCE.md](REFERENCE.md)** — complete reference covering the content layer API, collections, loaders, markdown pipeline, validators, frontmatter schemas, and Vite content plugin
- **`node_modules/@pagesmith/core/ai-guidelines/setup-core.md`** — canonical bootstrap/retrofit prompt for `@pagesmith/core`
- **`node_modules/@pagesmith/core/ai-guidelines/usage.md`** — follow-up prompts and integration rules after setup
- **`node_modules/@pagesmith/core/ai-guidelines/migration.md`** — upgrade playbook for existing integrations
- **`node_modules/@pagesmith/site/README.md`** — site toolkit with JSX, CSS/runtime bundles, SSG helpers, and `pagesmith-site`
- **`node_modules/@pagesmith/site/REFERENCE.md`** — full site reference for Pagesmith site-building
- **`node_modules/@pagesmith/docs/README.md`** — convention-based docs site package with built-in navigation, search, and theme
- **`node_modules/@pagesmith/docs/REFERENCE.md`** — full docs reference for AI assistants

### AI agent guidance (shipped inside the package)

These files are available at `node_modules/@pagesmith/core/` after installation:

| File | Purpose |
|---|---|
| `REFERENCE.md` | Full API reference for content layer, collections, markdown, validation, and Vite content access |
| `ai-guidelines/setup-core.md` | Bootstrap/retrofit prompt for installing `@pagesmith/core` in an existing repo |
| `ai-guidelines/usage.md` | Agent rules, integration shape, copy-paste prompts |
| `ai-guidelines/recipes.md` | Step-by-step recipes for common tasks |
| `ai-guidelines/errors.md` | Error catalog with patterns and fixes |
| `ai-guidelines/migration.md` | Upgrade playbook and copy-paste prompt for existing integrations |
| `ai-guidelines/llms.txt` | Compact AI context index |
| `ai-guidelines/llms-full.txt` | Full AI context with all file pointers |

## License

MIT
