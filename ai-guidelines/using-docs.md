# Using @pagesmith/docs

Guidelines for AI assistants generating code or content that uses `@pagesmith/docs`.

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

2. Add content in `content/`:

```
content/
  README.md                 → Home page (DocHome layout)
  guide/
    meta.json5              → Section ordering and metadata
    getting-started/
      README.md             → A page
    configuration/
      README.md             → Another page
  reference/
    api/README.md
```

3. Run:

```bash
npx pagesmith dev     # Development server
npx pagesmith build   # Production build
npx pagesmith preview # Preview built site
```

## Configuration (`pagesmith.config.json5`)

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Site name (header) |
| `title` | `string` | — | Browser tab title |
| `description` | `string` | — | Default meta description |
| `origin` | `string` | — | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'content'` | Content directory path |
| `outDir` | `string` | `'dist'` | Build output directory |
| `basePath` | `string` | `'/'` | URL base path |
| `homeLink` | `string` | `basePath` | Header logo link |
| `footerLinks` | `array` | `[]` | Footer links (`{ label, path }`) |
| `sidebar.collapsible` | `boolean` | `false` | Collapsible sidebar sections |
| `search.enabled` | `boolean` | `true` | Pagefind search |
| `theme.layouts` | `Record` | — | Layout override paths |
| `analytics.googleAnalytics` | `string` | — | GA tracking ID |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config |

## Content Structure

- `content/README.md` → home page (DocHome layout)
- Top-level folders → navigation sections in sidebar
- Subfolders with `README.md` → individual pages
- `meta.json5` files → section ordering and metadata

## Page Frontmatter

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title |
| `description` | `string` | Meta description |
| `navLabel` | `string` | Override top nav label |
| `sidebarLabel` | `string` | Override sidebar label |
| `order` | `number` | Manual sort order |
| `draft` | `boolean` | Exclude from build |

All fields are optional.

## Home Page Frontmatter (additional)

| Field | Type | Description |
|---|---|---|
| `layout` | `string` | Set to `DocHome` for home layout |
| `tagline` | `string` | Short description |
| `install` | `string` | Install command snippet |
| `actions` | `array` | CTA buttons (`{ text, link, theme }`) |
| `features` | `array` | Feature cards (`{ icon, title, details }`) |
| `packages` | `array` | Package cards (`{ name, description, href, tag }`) |
| `codeExample` | `object` | Code example (`{ label, title, code }`) |

## Section Meta (`meta.json5`)

```json5
{
  displayName: 'Guide',
  items: ['getting-started', 'configuration'],
  series: [{ slug: 'basics', displayName: 'The Basics', articles: ['getting-started'] }],
  collapsed: true,
}
```

## Layout Overrides

Override default layouts via `theme.layouts`:

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

Layout components use `@pagesmith/core/jsx-runtime`:

```tsx
import { Fragment } from '@pagesmith/core/jsx-runtime'

export default function DocPage(props) {
  const { content, frontmatter, headings, slug, site, sidebarSections, prev, next } = props
  return <html><body><main><Fragment innerHTML={content} /></main></body></html>
}
```

## Layout Props

All layouts receive: `content`, `frontmatter`, `headings`, `slug`, `site`.

Page layout adds: `sidebarSections`, `prev`, `next`.

Home layout adds: `frontmatter.hero`, `frontmatter.features`, `frontmatter.packages`, `frontmatter.install`.

## Programmatic API

```ts
import { build, startDev, preview, defineDocsConfig } from '@pagesmith/docs'

await build({ configPath: './pagesmith.config.json5' })
await startDev({ port: 3000 })
await preview({ port: 4173 })
```

## Key Rules

- `@pagesmith/docs` depends on `@pagesmith/core` — no need to install core separately
- No `vite.config.ts` or `content.config.ts` needed — docs uses `pagesmith.config.json5`
- Top-level folders in `content/` define the main navigation
- Pagefind search is bundled — no separate `pagefind` dependency needed
- Runtime JS provides: TOC highlighting, search modal, sidebar toggle — copy buttons are Expressive Code
- All markdown features from `@pagesmith/core` are available (see markdown-guidelines.md)
