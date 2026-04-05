# @pagesmith/docs

Convention-based documentation package built on `@pagesmith/core`. Create a full docs site from a `pagesmith.config.json5` file and a content directory — with built-in Pagefind search, sidebar generation, and an optional layout override system.

Package docs shipped inside npm (`node_modules/@pagesmith/docs/docs/*`) are version-matched to the installed package. The hosted docs site in this repository tracks the latest implementation.

## Install

```bash
npm add @pagesmith/docs
```

## Quick Start

### AI-first (recommended)

If you use an agent workflow, initialize docs and assistant context together:

```bash
npx pagesmith init --ai
```

This scaffolds config/content plus AI guidance and Claude docs skills (`/update-docs`, `/ps-update-all-docs`).
If your project already has custom root `llms.txt` files, use `npx pagesmith init --ai --no-llms` to skip regenerating them.

1. Create `pagesmith.config.json5`:

```json5
{
  // basePath: '/my-project',  // uncomment if hosting under a subdirectory
}
```

2. Add content in a `docs/` directory:

```
docs/
  README.md                 Home page
  guide/
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

For pre-1.0 upgrade notes, see `docs/agents/migration.md`.

## Content Structure

Content follows a folder convention:

- **`docs/README.md`** (or `content/README.md`) — home page (renders with the `DocHome` layout)
- **Top-level folders** (`content/guide/`, `content/reference/`) — become navigation sections in the sidebar
- **Subfolders with `README.md`** (`content/guide/getting-started/README.md`) — become individual pages
- **`meta.json5` files** — control section ordering and metadata

The content directory defaults to `docs/` if it exists, otherwise `content/`.

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
| `socialImage` | `string` | Open Graph image path for social sharing (per-page override) |

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
| `name` | `string` | `pkg name` | Site name (header). Falls back to package.json name. |
| `title` | `string` | `pkg name` | Browser tab title |
| `description` | `string` | `pkg desc` | Default meta description |
| `origin` | `string` | `pkg homepage` | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'docs/' or 'content/'` | Path to content directory |
| `outDir` | `string` | `'gh-pages'` | Build output directory |
| `publicDir` | `string` | `'public'` | Static assets directory |
| `basePath` | `string` | `'/'` | URL base path (overridden by `BASE_URL` env) |
| `homeLink` | `string` | `basePath` | Header logo link destination |
| `footerLinks` | `array` | `[]` | Footer navigation links (`{ label, path }`) |
| `sidebar.collapsible` | `boolean` | `true` | Enable collapsible sidebar sections |
| `search.enabled` | `boolean` | `true` | Enable Pagefind search |
| `search.showImages` | `boolean` | `false` | Show images in search results |
| `search.showSubResults` | `boolean` | `true` | Show section-level results |
| `search.pagefindFlags` | `string[]` | `[]` | Extra CLI flags for pagefind |
| `theme.lightColor` | `string` | — | Light theme meta color |
| `theme.darkColor` | `string` | — | Dark theme meta color |
| `theme.layouts` | `Record<string, string>` | — | Layout override file paths |
| `analytics.googleAnalytics` | `string` | — | Google Analytics tracking ID |
| `editLink` | `object` | — | Edit link config (`{ repo, branch?, label? }`) |
| `lastUpdated` | `boolean` | `false` | Show git-based last updated timestamp on pages |
| `sitemap` | `boolean` | `true` | Generate sitemap.xml (when origin is set) |
| `theme.socialImage` | `string` | — | Default OG image for social sharing |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config (from `@pagesmith/core`) |
| `packages` | `Record<string, { label }>` | — | Multi-package section labels |

### Example Configuration

```json5
{
  origin: 'https://docs.example.com',
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
  editLink: {
    repo: 'https://github.com/example/repo',
  },
  lastUpdated: true,
}
```

## CLI

### `pagesmith dev`

Start a development server with live reload. Uses incremental rebuilds -- content changes trigger a fast content-only rebuild, while config or theme changes trigger a full rebuild. Shows a startup summary with page/section counts and clickable section URLs.

```bash
pagesmith dev [--port 3001] [--open] [--config path] [--out-dir path] [--base-path path] [--log-level level]
```

### `pagesmith build`

Build the static site for production. Pages are processed in parallel for faster builds. Outputs a build summary with page count, section count, and timing.

```bash
pagesmith build [--out-dir path] [--base-path path] [--config path]
```

### `pagesmith preview`

Preview the built site locally.

```bash
pagesmith preview [--port 4000] [--open] [--config path] [--out-dir path] [--base-path path] [--log-level level]
```

### `pagesmith mcp`

Start the stdio MCP server for docs-aware AI tooling.

```bash
pagesmith mcp --stdio [--config path] [--root path]
```

The MCP server exposes docs-focused tools (`docs_validate_config`, `docs_resolve_config`, `docs_list_pages`, `docs_get_page`, `docs_search_pages`) and package resources for versioned guidance (`pagesmith://docs/agents/usage`, `pagesmith://docs/llms-full`, `pagesmith://docs/reference`).

## Auto-generated Files

The build automatically generates:

- **`.nojekyll`** — always generated for GitHub Pages compatibility
- **`sitemap.xml`** — generated when `origin` is set (disable with `sitemap: false`)
- **`robots.txt`** — generated if not already provided via `publicDir` or `assets`
- **`llms.txt`** / **`llms-full.txt`** — auto-copied from project root if present

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
- **Breadcrumbs** — auto-generated from the slug path on non-home pages with depth > 1. No configuration needed.
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
await preview({ port: 4000 })
```

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/docs` | Main API (build, startDev, preview, defineDocsConfig) |
| `@pagesmith/docs/schemas` | Zod schemas for config, layout props, page data |
| `@pagesmith/docs/preset` | Docs preset for integration |
| `@pagesmith/docs/theme` | Theme/runtime export surface |
| `@pagesmith/docs/mcp` | Stdio MCP server entry (`createDocsMcpServer`, `startDocsMcpServer`) |

## Further Reading

- **[REFERENCE.md](REFERENCE.md)** — complete AI reference covering config, CLI, content structure, frontmatter, markdown pipeline, layout overrides, and GitHub Pages deployment
- **[`@pagesmith/core` README](../core/README.md)** — content layer, collections, markdown pipeline, Vite plugins, JSX runtime, and CSS exports
- **[`@pagesmith/core` REFERENCE.md](../core/REFERENCE.md)** — full core API reference for AI assistants

### AI agent guidance (shipped inside the package)

These files are available at `node_modules/@pagesmith/docs/` after installation:

| File | Purpose |
|---|---|
| `REFERENCE.md` | Full reference for config, CLI, content, markdown, layouts, deployment |
| `docs/agents/usage.md` | Agent rules, integration shape, copy-paste prompts |
| `docs/agents/recipes.md` | Step-by-step recipes for common tasks |
| `docs/agents/errors.md` | Error catalog with patterns and fixes |
| `docs/llms.txt` | Compact AI context index |
| `docs/llms-full.txt` | Full AI context with all file pointers |

## License

MIT
