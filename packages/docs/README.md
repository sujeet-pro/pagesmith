# @pagesmith/docs

Convention-based documentation package built on `@pagesmith/core`. Create a full docs site from a `pagesmith.config.json5` file and a `content/` directory — with built-in Pagefind search, sidebar generation, and an optional layout override system.

## Install

```bash
npm add @pagesmith/docs
```

## Quick Start

1. Create `pagesmith.config.json5`:

```json5
{
  name: 'My Docs',
  title: 'My Docs',
  description: 'Project documentation',
  search: { enabled: true },
}
```

2. Add content in a `content/` directory:

```
content/
  README.md                 Home page
  guide/
    meta.json5              Section ordering
    getting-started/
      README.md             A page
    configuration/
      README.md             Another page
  reference/
    api/README.md
```

3. Run the dev server:

```bash
npx pagesmith dev
```

4. Build for production:

```bash
npx pagesmith build
```

## Content Structure

Content follows a folder convention:

- **`content/README.md`** — home page (renders with the `DocHome` layout)
- **Top-level folders** (`content/guide/`, `content/reference/`) — become navigation sections in the sidebar
- **Subfolders with `README.md`** (`content/guide/getting-started/README.md`) — become individual pages
- **`meta.json5` files** — control section ordering and metadata

### Frontmatter

All pages support these frontmatter fields:

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title (also used in sidebar and browser tab) |
| `description` | `string` | Meta description for SEO |
| `navLabel` | `string` | Override the label shown in top navigation |
| `sidebarLabel` | `string` | Override the label shown in sidebar |
| `order` | `number` | Manual sort order within a section |
| `draft` | `boolean` | Exclude page from build when `true` |

All fields are optional. Additional custom fields are passed through to layouts.

### Home Page Frontmatter

The home page (`content/README.md`) supports additional frontmatter for the default `DocHome` layout:

```yaml
---
layout: DocHome
title: My Project
tagline: A short description
description: Full meta description
install: npm install my-package
actions:
  - text: Get Started
    link: /guide/getting-started
    theme: brand
  - text: API Reference
    link: /reference/api
    theme: alt
features:
  - icon: '<svg>...</svg>'
    title: Feature Name
    details: Feature description text.
packages:
  - name: "@scope/pkg"
    description: Package description
    href: /reference/api
    tag: Core
codeExample:
  label: Example
  title: How it works
  code: |
    ```ts
    import { something } from 'my-package'
    ```
---

Markdown content below frontmatter is rendered after the structured sections.
```

| Field | Type | Description |
|---|---|---|
| `hero` | `object` | Hero section with `name`, `text`, `tagline`, `badge`, `actions` |
| `install` | `string` | Installation command snippet shown below hero |
| `features` | `array` | Feature cards with `icon` (SVG string), `title`, `details` |
| `packages` | `array` | Package cards with `name`, `description`, `href`, `tag`, `version` |
| `codeExample` | `object` | Code example section with `label`, `title`, `code` |
| `actions` | `array` | Call-to-action buttons with `text`, `link`, `theme` (`brand` or `alt`) |

### Section Meta (`meta.json5`)

Each section can have a `meta.json5` file to control page ordering and section metadata:

```json5
{
  displayName: 'Guide',
  description: 'Getting started guides',
  items: [
    'getting-started',
    'configuration',
    'layouts',
  ],
  // Optional: group pages into series
  series: [
    {
      slug: 'basics',
      displayName: 'The Basics',
      articles: ['getting-started', 'configuration'],
    },
  ],
  // Optional: start this sidebar section collapsed
  collapsed: true,
}
```

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | Section label in sidebar and navigation |
| `description` | `string` | Section description |
| `layout` | `string` | Layout for section index page |
| `itemLayout` | `string` | Layout for pages in this section |
| `orderBy` | `'manual' \| 'publishedDate'` | Page sort order |
| `items` | `string[]` | Manual page order (slugs) |
| `series` | `array` | Group pages into named series |
| `collapsed` | `boolean` | Start sidebar section collapsed |

Pages not listed in `items` appear after listed pages. When `orderBy` is `'publishedDate'`, pages are sorted by their `publishedDate` frontmatter field.

## Configuration (`pagesmith.config.json5`)

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Site name (shown in header) |
| `title` | `string` | — | Browser tab title |
| `description` | `string` | — | Default meta description |
| `origin` | `string` | — | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'content'` | Path to content directory |
| `outDir` | `string` | `'dist'` | Build output directory |
| `publicDir` | `string` | `'public'` | Static assets directory |
| `basePath` | `string` | `'/'` | URL base path (overridden by `BASE_URL` env) |
| `homeLink` | `string` | `basePath` | Header logo link destination |
| `footerLinks` | `array` | `[]` | Footer navigation links (`{ label, path }`) |
| `sidebar.collapsible` | `boolean` | `false` | Enable collapsible sidebar sections |
| `search.enabled` | `boolean` | `true` | Enable Pagefind search |
| `search.showImages` | `boolean` | `false` | Show images in search results |
| `search.showSubResults` | `boolean` | `true` | Show section-level results |
| `search.pagefindFlags` | `string[]` | `[]` | Extra CLI flags for pagefind |
| `theme.lightColor` | `string` | — | Light theme meta color |
| `theme.darkColor` | `string` | — | Dark theme meta color |
| `theme.layouts` | `Record<string, string>` | — | Layout override file paths |
| `analytics.googleAnalytics` | `string` | — | Google Analytics tracking ID |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config (from `@pagesmith/core`) |
| `packages` | `Record<string, { label }>` | — | Multi-package section labels |

### Example Configuration

```json5
{
  name: 'My Docs',
  title: 'My Docs',
  description: 'Documentation for My Project',
  origin: 'https://docs.example.com',
  contentDir: './content',
  outDir: './dist',
  basePath: '/docs',
  sidebar: {
    collapsible: true,
  },
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'API', path: '/api' },
    { label: 'GitHub', path: 'https://github.com/example/repo' },
  ],
  search: {
    enabled: true,
    showSubResults: true,
  },
  theme: {
    layouts: {
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
    },
  },
  analytics: {
    googleAnalytics: 'G-XXXXXXXXXX',
  },
}
```

## CLI

### `pagesmith dev`

Start a development server with hot reload.

```bash
pagesmith dev [--port 3001] [--open] [--config path] [--out-dir path] [--base-path path]
```

### `pagesmith build`

Build the static site for production.

```bash
pagesmith build [--out-dir path] [--base-path path] [--config path]
```

### `pagesmith preview`

Preview the built site locally.

```bash
pagesmith preview [--port 4173] [--config path]
```

## Layout Overrides

Override the default layouts by specifying file paths in `theme.layouts`:

```json5
{
  theme: {
    layouts: {
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
      notFound: './theme/layouts/DocNotFound.tsx',
    },
  },
}
```

Layout components are TSX files using `@pagesmith/core/jsx-runtime`:

```tsx
// theme/layouts/DocPage.tsx
import { Fragment } from '@pagesmith/core/jsx-runtime'

export default function DocPage(props) {
  const { content, frontmatter, headings, slug, site, sidebarSections, prev, next } = props
  return (
    <html lang={site.language}>
      <head>
        <title>{frontmatter.title} — {site.title}</title>
      </head>
      <body>
        <main>
          <Fragment innerHTML={content} />
        </main>
      </body>
    </html>
  )
}
```

### Layout Props

**All layouts** receive:

| Prop | Type | Description |
|---|---|---|
| `content` | `string` | Rendered HTML content |
| `frontmatter` | `Record<string, any>` | Page frontmatter |
| `headings` | `Heading[]` | Extracted headings (`{ depth, text, slug }`) |
| `slug` | `string` | Page slug |
| `site` | `ResolvedDocsConfig` | Full resolved site configuration |

**Page layout** additionally receives:

| Prop | Type | Description |
|---|---|---|
| `sidebarSections` | `SidebarSection[]` | Sidebar navigation structure |
| `prev` | `{ title, path } \| undefined` | Previous page link |
| `next` | `{ title, path } \| undefined` | Next page link |

**Home layout** additionally receives:

| Prop | Type | Description |
|---|---|---|
| `frontmatter.hero` | `object` | Hero section data |
| `frontmatter.features` | `array` | Feature cards |
| `frontmatter.packages` | `array` | Package cards |
| `frontmatter.install` | `string` | Install command |

### Export Resolution

Layouts are resolved in order: `default` export, then named export matching the layout name (`DocPage`, `DocHome`, `DocNotFound`).

## Navigation

- **Top nav** — auto-generated from top-level content folders. Override with `headerLinks` in `content/meta.json5`.
- **Sidebar** — auto-generated from folder structure within each section. Ordering from `meta.json5` `items` array.
- **Prev/next** — auto-generated from flattened sidebar items.
- **Footer** — configured via `footerLinks` in config.

## Search

Pagefind full-text search is bundled and runs at build time. Enable with `search.enabled: true` (default). Users trigger search with `Cmd+K` / `Ctrl+K` or the search button in the header.

## Markdown Features

All markdown features from `@pagesmith/core` are available, including:

- GitHub Flavored Markdown (tables, strikethrough, task lists)
- GitHub Alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`)
- Math blocks (LaTeX via MathJax)
- Expressive Code syntax highlighting (dual themes, line numbers, file titles, mark/ins/del, collapse, copy button)
- Smart typography (curly quotes, em-dashes, ellipses)
- Accessible emojis
- Auto-linked headings
- External link handling (`target="_blank"`)

See the [`@pagesmith/core` README](../core/README.md) for the full markdown feature reference.

## Programmatic API

```ts
import { build, startDev, preview, defineDocsConfig } from '@pagesmith/docs'

const config = defineDocsConfig({
  name: 'My Docs',
  title: 'My Docs',
  search: { enabled: true },
})

await build({ configPath: './pagesmith.config.json5' })
await startDev({ port: 3000 })
await preview({ port: 4173 })
```

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/docs` | Main API (build, startDev, preview, defineDocsConfig) |
| `@pagesmith/docs/schemas` | Zod schemas for config, layout props, page data |
| `@pagesmith/docs/preset` | Docs preset for integration |

## License

MIT
