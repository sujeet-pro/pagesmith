# @pagesmith/docs — AI Reference

Link this file from your project's CLAUDE.md or AGENTS.md to give AI assistants a comprehensive reference for `@pagesmith/docs`.

```markdown
<!-- In your CLAUDE.md or AGENTS.md -->
For the full @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
For the full @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
```

---

## Overview

`@pagesmith/docs` is a convention-based documentation package built on `@pagesmith/core`. Create a full docs site from a `pagesmith.config.json5` file and a `content/` directory — with built-in Pagefind search, sidebar generation, and an optional layout override system.

`@pagesmith/docs` includes `@pagesmith/core` — no need to install core separately.

## CLI Commands

```bash
pagesmith init [--ai] [--config path]   # Initialize config + content + AI integrations
pagesmith dev [--port N] [--open]        # Development server with live reload
pagesmith build [--out-dir path]         # Production build with Pagefind indexing
pagesmith preview [--port N]             # Preview built site locally
```

### pagesmith init

Creates `pagesmith.config.json5` and a starter `content/` directory structure. With `--ai`, also installs AI assistant integrations (CLAUDE.md, skills, markdown guidelines).

### Shared CLI Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--port <number>` | number | 3000/4173 | Server port |
| `--config <path>` | string | `pagesmith.config.json5` | Config file path |
| `--open` | boolean | `false` | Open browser on start |
| `--out-dir <path>` | string | Config `outDir` | Override output directory |
| `--base-path <path>` | string | Config `basePath` | Override URL base path |

## Configuration (pagesmith.config.json5)

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Site name (shown in header) |
| `title` | `string` | — | Browser tab title |
| `description` | `string` | — | Default meta description |
| `origin` | `string` | — | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'content'` | Content directory path |
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
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config |
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
  sidebar: { collapsible: true },
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'API', path: '/reference/api' },
    { label: 'GitHub', path: 'https://github.com/example/repo' },
  ],
  search: { enabled: true },
}
```

## Content Structure

```
content/
  README.md                 # Home page (DocHome layout)
  meta.json5                # Root-level header/footer overrides
  guide/
    meta.json5              # Section metadata and ordering
    README.md               # Section index page
    getting-started/
      README.md             # Guide page
      architecture.svg      # Sibling asset
    advanced/
      README.md
  reference/
    meta.json5
    api/
      README.md
```

- `content/README.md` — home page (renders with `DocHome` layout)
- Top-level folders — become navigation sections in sidebar
- Subfolders with `README.md` — become individual pages
- `meta.json5` — control section ordering and metadata

## Frontmatter

### Page Frontmatter

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title (sidebar + browser tab) |
| `description` | `string` | Meta description for SEO |
| `navLabel` | `string` | Override label in top navigation |
| `sidebarLabel` | `string` | Override label in sidebar |
| `order` | `number` | Manual sort order within section |
| `draft` | `boolean` | Exclude page from build when `true` |

### Home Page Frontmatter

| Field | Type | Description |
|---|---|---|
| `layout` | `string` | Set to `DocHome` for home layout |
| `tagline` | `string` | Short description below title |
| `install` | `string` | Install command snippet |
| `actions` | `array` | CTA buttons (`{ text, link, theme: 'brand' \| 'alt' }`) |
| `features` | `array` | Feature cards (`{ icon?, title, details }`) |
| `packages` | `array` | Package cards (`{ name, description, href, tag }`) |
| `codeExample` | `object` | Code example (`{ label, title, code }`) |

## Section Meta (meta.json5)

```json5
{
  displayName: 'Guide',
  description: 'Step-by-step guides.',
  orderBy: 'manual',
  items: ['getting-started', 'configuration', 'advanced'],
  series: [
    {
      slug: 'basics',
      displayName: 'The Basics',
      articles: ['getting-started', 'configuration'],
    },
  ],
  collapsed: true,
}
```

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | Section label in sidebar |
| `description` | `string` | Section description |
| `layout` | `string` | Layout for section index page |
| `itemLayout` | `string` | Layout for pages in this section |
| `orderBy` | `'manual' \| 'publishedDate'` | Page sort order |
| `items` | `string[]` | Manual page order (slugs) |
| `series` | `array` | Group pages into named series |
| `collapsed` | `boolean` | Start sidebar section collapsed |

Pages not listed in `items` appear after listed pages.

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

### Layout Props

**All layouts** receive: `content`, `frontmatter`, `headings`, `slug`, `site`.

**Page layout** additionally: `sidebarSections`, `prev`, `next`.

**Home layout** additionally: `frontmatter.hero`, `frontmatter.features`, `frontmatter.packages`, `frontmatter.install`.

Layouts use `@pagesmith/core/jsx-runtime`:

```tsx
import { Fragment } from '@pagesmith/core/jsx-runtime'

export default function DocPage(props) {
  const { content, frontmatter, headings, slug, site, sidebarSections, prev, next } = props
  return (
    <html lang={site.language}>
      <head><title>{frontmatter.title} — {site.title}</title></head>
      <body>
        <main data-pagefind-body="">
          <div class="prose" innerHTML={content} />
        </main>
      </body>
    </html>
  )
}
```

## Navigation

- **Top nav** — auto-generated from top-level content folders; override with `headerLinks` in `content/meta.json5`
- **Sidebar** — auto-generated from section structure; order from `meta.json5` `items`
- **Prev/next** — auto-generated from flattened sidebar items
- **Footer** — configured via `footerLinks` in config

## Search

Pagefind full-text search is bundled. Enable with `search.enabled: true` (default). Trigger with `Cmd+K` / `Ctrl+K`.

## Programmatic API

```ts
import { build, startDev, preview, defineDocsConfig } from '@pagesmith/docs'

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

## When Adding New Pages

1. Create `content/<section>/<slug>/README.md` with title and description frontmatter
2. Add the slug to the section's `meta.json5` `items` array
3. Write content following the markdown guidelines in `.pagesmith/markdown-guidelines.md`
4. Run `npx pagesmith dev` to verify rendering

## Key Rules

- `@pagesmith/docs` depends on `@pagesmith/core` — no need to install core separately
- No `vite.config.ts` or `content.config.ts` needed — docs uses `pagesmith.config.json5`
- Top-level folders in `content/` define the main navigation
- Pagefind search is bundled — no separate `pagefind` dependency needed
- All markdown features from `@pagesmith/core` are available
- Code block styling is inline via Expressive Code — do NOT import separate code block CSS
