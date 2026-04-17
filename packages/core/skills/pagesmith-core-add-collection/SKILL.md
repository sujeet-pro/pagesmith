---
name: pagesmith-core-add-collection
description: Register a new content collection (markdown, JSON, JSON5, JSONC, YAML, TOML) with a Zod schema in a Pagesmith project. Use when the user wants to model a new content type — blog posts, authors, products, case studies, changelog entries — or when they ask how to validate frontmatter against a schema.
---

# Add A Pagesmith Content Collection

A collection is Pagesmith's unit of typed content. Every collection has a loader (how files are parsed), a directory (where the files live), and a Zod schema (validation).

## Read the locally installed reference first

Before editing `content.config.ts` or `vite.config.ts`, open `node_modules/@pagesmith/core/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for `defineCollection`, `defineCollections`, the built-in loader names, the shortcut factories, and the `pagesmithContent` Vite plugin signature. If it disagrees with this skill or general training data, follow the local file.

Run any verification commands (`npx vite build`, `npx vite dev`) through `npx` or `package.json` scripts so they resolve to the project's `node_modules/.bin` instead of a globally installed binary that may be a different version.

## Prerequisites

- `@pagesmith/core` installed, or `@pagesmith/site`/`@pagesmith/docs` (which re-export the same APIs).
- A `content.config.ts` at the project root. Create it if missing.

## Decide loader + directory

| Loader | File type | Best for |
| --- | --- | --- |
| `markdown` | `.md` | Pages, posts, guides, anything with prose |
| `json` | `.json` | Strict data (CI-friendly) |
| `json5` | `.json5` | Config-like content with comments |
| `jsonc` | `.jsonc` | VS Code-style JSON with comments |
| `yaml` | `.yml`, `.yaml` | Lists, records, human-edited data |
| `toml` | `.toml` | Tabular config where JSON is noisy |

Pick one loader per collection. You cannot mix file types in the same collection.

## Define the collection

```ts
// content.config.ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
  }),
})

const authors = defineCollection({
  loader: 'json5',
  directory: 'content/authors',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
    links: z.record(z.string()).default({}),
  }),
})

export default defineCollections({ posts, authors })
```

Always import `z` from `@pagesmith/core`. Do **not** `import { z } from 'zod'` — Pagesmith pins its own Zod version and dual copies break schema identity checks.

## Register with Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [pagesmithContent({ collections })],
})
```

If you also use `@pagesmith/site`, prefer `pagesmithSite({ collections })` instead of wiring `pagesmithContent` directly — it composes content, SSG, and shared assets.

## Read entries

From virtual modules (fastest, cache-friendly):

```ts
import posts from 'virtual:content/posts'

for (const entry of posts) {
  console.log(entry.data.title, entry.slug)
}
```

Through the content layer (full control, async):

```ts
import { createContentLayer, defineConfig } from '@pagesmith/core'
import collections from './content.config'

const layer = createContentLayer(defineConfig({ collections }))

const all = await layer.getCollection('posts')
const one = await layer.getEntry('posts', 'hello-world')
const rendered = await one?.render()
```

`render()` returns `{ html, headings, links, frontmatter, readingTime }` for markdown entries. For non-markdown loaders it just returns the parsed data.

## Shortcut factories

`@pagesmith/core` ships pre-configured factories with sensible schemas:

```ts
import { blogCollection, projectsCollection, docsCollection } from '@pagesmith/core'

const posts    = blogCollection({ directory: 'content/posts' })
const projects = projectsCollection()                        // directory defaults to 'content/projects'
const docs     = docsCollection({ directory: 'docs' })       // used by @pagesmith/docs under the hood
```

Each factory accepts a `schema:` override when you need to extend the defaults:

```ts
const posts = blogCollection({
  schema: (base) => base.extend({ newsletterBoost: z.boolean().default(false) }),
})
```

## Validation

- Schema validation runs on every `getCollection`/`getEntry` call.
- Invalid entries surface with the file path and the Zod error.
- For CI or pre-deploy checks, run the validator explicitly:

```ts
const results = await layer.validate('posts')
if (results.some(r => r.issues.some(i => i.severity === 'error'))) {
  process.exit(1)
}
```

Content validators (semantic rules that look at the markdown AST, not just frontmatter) are a separate concern — see `pagesmith-core-write-validator`.

## Verify

```bash
npx vite build              # build populates the virtual module
npx vite dev                # watch mode: add/edit files and see updates
```

- All markdown files should be found under `directory`.
- `entry.data` should match the schema.
- For markdown, `entry.render()` should return non-empty HTML.

## Gotchas

- `loader` must be a built-in name (`'markdown'`, `'json'`, …) or an instance of your own `Loader`. A string that doesn't match throws at config time.
- `directory` is relative to the project root (where `content.config.ts` lives), not to the config file of the consumer.
- Do not import Zod directly (`import { z } from 'zod'`) — use `z` re-exported from `@pagesmith/core`. Dual Zod versions cause the validator to silently skip schemas.
- `z.coerce.date()` is the right choice for ISO date strings from frontmatter; plain `z.date()` fails because YAML gives you a string.
- Every entry's file name (without extension) becomes its `slug`. Rename with care — URLs and links break.
- Collections in a Vite-powered project are watched automatically. Edit the schema and re-run dev if the change looks ignored.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `./references/core-guidelines.md`
- `./references/usage.md`
- Sibling skills: `pagesmith-core-add-loader`, `pagesmith-core-customize-markdown`, `pagesmith-core-write-validator`.
