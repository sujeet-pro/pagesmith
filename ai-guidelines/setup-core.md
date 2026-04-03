# Setup Guide: @pagesmith/core

Point any AI agent at this file to configure `@pagesmith/core` on a new or existing project. Follow every step in order.

## 1. Install

```bash
npm add @pagesmith/core
```

## 2. Create content directory

```bash
mkdir -p content/posts
```

Create a sample markdown file at `content/posts/hello-world/README.md`:

```md
---
title: Hello World
description: A first post to verify the setup.
date: 2025-01-01
tags:
  - getting-started
---

# Hello World

This is a sample post created during Pagesmith setup.
```

## 3. Create content.config.ts

Create `content.config.ts` at the project root:

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

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

export default defineCollections({ posts })
```

Adapt the schema and collection names to the project's actual content model.

## 4. Configure Vite

Update or create `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
})
```

If the project uses a framework plugin (React, Solid, Svelte), add it before the Pagesmith plugins.

## 5. Create SSR entry

Create `src/entry-server.tsx` (or `.ts` for non-JSX frameworks):

```tsx
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import posts from 'virtual:content/posts'

export function getRoutes(config: SsgRenderConfig): string[] {
  return [
    '/',
    ...posts.map((p) => `/${p.contentSlug}`),
  ]
}

export function render(url: string, config: SsgRenderConfig): string {
  // Implement rendering logic for each route
  // Return full HTML string including <!DOCTYPE html>
  return '<!DOCTYPE html><html><body>TODO</body></html>'
}
```

## 6. Configure TypeScript (if using JSX runtime)

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

## 7. Add CSS imports

Choose the appropriate CSS tier:

- **Content only** (embedding in existing app): `@pagesmith/core/css/content`
- **Standalone** (full page with TOC/sidebar): `@pagesmith/core/css/standalone`
- **Viewport**: `@pagesmith/core/css/viewport`
- **Fonts** (Open Sans + JetBrains Mono): `@pagesmith/core/css/fonts`

Import in your CSS or JS entry:

```css
@import '@pagesmith/core/css/content';
@import '@pagesmith/core/css/fonts';
```

## 8. Add markdown guidelines to the project

Copy the markdown guidelines into the project so future AI sessions know how to author content correctly.

Create `.pagesmith/markdown-guidelines.md` with the content from the Markdown Guidelines section below. This file should be referenced from CLAUDE.md/AGENTS.md.

## 9. Update CLAUDE.md / AGENTS.md

Add or merge the following into the project's `CLAUDE.md` (for Claude) or `AGENTS.md` (for Codex):

```markdown
## Content Layer (@pagesmith/core)

This project uses @pagesmith/core for content management.

- Content collections are defined in `content.config.ts`
- Content lives in `content/` with folder-based entries (`content/<collection>/<slug>/README.md`)
- Schemas use Zod — always import `z` from `@pagesmith/core`, not from `zod` directly
- The Vite plugin exposes collections as virtual modules: `import posts from 'virtual:content/posts'`
- Markdown rendering is lazy — call `entry.render()` only when HTML is needed
- Code block styling is handled by Expressive Code (inline) — do NOT add separate code block CSS or copy-button JS

### Markdown authoring rules

See `.pagesmith/markdown-guidelines.md` for the full markdown feature reference. Key rules:

- Use fenced code blocks with a language identifier
- One `# h1` per page
- Sequential heading depth (no skipping from h2 to h4)
- Prefer relative links for internal content
- Use GitHub alert syntax for callouts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`
- Code block features via meta string: `title="file.js"`, `showLineNumbers`, `mark={1-3}`, `ins={4}`, `del={5}`, `collapse={1-5}`

### Full API Reference

For the complete @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
```

## 10. Programmatic alternative (no Vite)

For build scripts or non-Vite projects, use the content layer API directly:

```ts
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
})

const layer = createContentLayer(defineConfig({ collections: { posts } }))
const entries = await layer.getCollection('posts')

for (const entry of entries) {
  const rendered = await entry.render()
  // rendered.html, rendered.headings, rendered.readTime
}
```

---

## Markdown Guidelines

The markdown pipeline processes content through unified with these plugins in order:

```
remark-parse → remark-gfm → remark-math → remark-frontmatter
  → remark-github-alerts → remark-smartypants → [user remark plugins]
  → remark-rehype
  → rehype-expressive-code (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-mathjax → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → [user rehype plugins] → rehype-stringify
```

### Supported features

| Feature | Syntax | Notes |
|---|---|---|
| GFM tables | `\| col \| col \|` | Alignment via `:---`, `:---:`, `---:` |
| Strikethrough | `~~text~~` | |
| Task lists | `- [x] done` / `- [ ] todo` | |
| Footnotes | `[^id]` + `[^id]: text` | |
| Alerts | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` | GitHub-compatible |
| Inline math | `$E = mc^2$` | No spaces inside delimiters |
| Block math | `$$...$$` | Rendered via MathJax |
| Smart quotes | `"text"` → curly quotes | Automatic |
| Em dash | `---` | Automatic |
| External links | `[text](https://...)` | Auto `target="_blank"` |
| Heading anchors | Auto `id` + wrapped anchor | All headings |
| Accessible emoji | Unicode emoji | Auto `role="img"` + `aria-label` |

### Code block features (Expressive Code)

| Meta | Example | Description |
|---|---|---|
| `title="..."` | `` ```js title="app.js" `` | File title |
| `showLineNumbers` | `` ```js showLineNumbers `` | Line numbers |
| `mark={lines}` | `` ```js mark={3,5-7} `` | Highlight lines |
| `ins={lines}` | `` ```js ins={4} `` | Inserted lines (green) |
| `del={lines}` | `` ```js del={5} `` | Deleted lines (red) |
| `collapse={lines}` | `` ```js collapse={1-5} `` | Collapsible section |
| `wrap` | `` ```js wrap `` | Text wrapping |
| `frame="..."` | `` ```js frame="terminal" `` | Frame style |

### Key rules

- Always use a language identifier on fenced code blocks
- One `# h1` per page — validators enforce this
- Sequential heading depth — no jumping from h2 to h4
- Prefer relative links for internal content
- Do NOT add manual copy-button JS — Expressive Code handles it
- Do NOT import separate code block CSS — styles are injected inline
- Code block themes default to `github-light` / `github-dark` with auto light/dark switching

### Available loaders

| Type | Extensions | Description |
|---|---|---|
| `markdown` | `.md` | Frontmatter + markdown body |
| `json` | `.json` | JSON |
| `json5` | `.json` | Relaxed JSON |
| `jsonc` | `.json`, `.jsonc` | JSON with comments |
| `yaml` | `.yml`, `.yaml` | YAML |
| `toml` | `.toml` | TOML |

### Built-in validators

Three validators run automatically on markdown collections:

- **linkValidator** — warns on bare URLs, empty link text, suspicious protocols
- **headingValidator** — enforces single h1, sequential depth, non-empty text
- **codeBlockValidator** — warns on missing language, unknown meta properties

### CSS exports

| Import | Contents |
|---|---|
| `@pagesmith/core/css/content` | Prose + inline code |
| `@pagesmith/core/css/standalone` | Full layout + prose + TOC |
| `@pagesmith/core/css/viewport` | Responsive viewport base |
| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |

### Frontmatter schemas

Pre-built schemas from `@pagesmith/core`:

- `BaseFrontmatterSchema` — title, description, publishedDate, lastUpdatedOn, tags, draft
- `BlogFrontmatterSchema` — extends base + category, featured, coverImage
- `ProjectFrontmatterSchema` — extends base + gitRepo, links

Use them directly or extend with `.extend()` / `.merge()`.
