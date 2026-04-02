# @pagesmith/docs

Convention-based documentation site generator. Create a docs site from markdown files and a single config file. Ships with bundled fonts (Open Sans, JetBrains Mono), CSS, search (Pagefind), and a default theme -- no external dependencies required.

## Quick Start

```bash
npm install @pagesmith/docs
```

Create `pagesmith.config.json5` in your project root:

```json5
{
  name: 'My Docs',
  title: 'My Docs',
  description: 'Documentation for my project',
  origin: 'https://example.com',
  contentDir: './content',
  outDir: './dist',
  search: {
    enabled: true,
  },
}
```

Add content files:

```
content/
  README.md              # Home page (uses DocHome layout)
  guide/
    meta.json5            # Section metadata and ordering
    README.md             # Section index page
    getting-started/
      README.md           # Guide page
    advanced/
      README.md
  reference/
    meta.json5
    README.md
    api/
      README.md
```

Run the dev server:

```bash
npx pagesmith dev
```

Build for production:

```bash
npx pagesmith build
```

## Config File (`pagesmith.config.json5`)

All fields are optional unless noted.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Site name shown in the header logo |
| `title` | `string` | HTML `<title>` base text |
| `description` | `string` | Default meta description |
| `origin` | `string` | Production URL origin (e.g. `https://example.com`) |
| `language` | `string` | HTML `lang` attribute (default: `'en'`) |
| `contentDir` | `string` | Path to content directory (default: `'./content'`) |
| `outDir` | `string` | Build output directory (default: `'./dist'`) |
| `publicDir` | `string` | Static assets directory copied to output |
| `basePath` | `string` | URL prefix for subdirectory deployment (e.g. `'/docs'`). Overridden by `BASE_URL` env var. |
| `footerLinks` | `Array<{ label, path }>` | Links shown in the page footer |
| `search` | `object` | Search configuration (see below) |
| `theme` | `object` | Theme customization (see below) |
| `analytics` | `object` | `{ googleAnalytics: 'G-XXXXXX' }` |
| `markdown` | `object` | Markdown pipeline configuration passed to `@pagesmith/core` |
| `home` | `object` | `{ configFile: './path' }` for external home config |
| `packages` | `Record<string, { label }>` | Multi-package nav labels. Maps section slug to display label. |

### Search config

```json5
{
  search: {
    enabled: true,          // Enable Pagefind search
    showImages: false,       // Show images in results (default: false)
    showSubResults: true,    // Show sub-sections in results (default: true)
    pagefindFlags: [],       // Extra CLI flags for pagefind binary
  },
}
```

Search uses Pagefind, auto-indexed at build time. No configuration beyond `enabled: true` is needed.

### Theme config

```json5
{
  theme: {
    lightColor: '#f8fafc',   // theme-color meta for light mode
    darkColor: '#020617',    // theme-color meta for dark mode
    layouts: {               // Layout overrides (see SKILL-overrides.md)
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
      notFound: './theme/layouts/NotFound.tsx',
    },
  },
}
```

### Full example

```json5
{
  name: 'Pagesmith',
  title: 'Pagesmith',
  description: 'File-based CMS and static site generator',
  origin: 'https://pagesmith.dev',
  contentDir: './content',
  outDir: '../gh-pages',
  basePath: '/pagesmith',
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'Reference', path: '/reference' },
    { label: 'GitHub', path: 'https://github.com/example/repo' },
  ],
  search: {
    enabled: true,
  },
}
```

## Content Structure

The `content/` directory maps directly to site navigation:

- **Top-level folders** become nav sections (e.g. `content/guide/` becomes the "Guide" section)
- **`README.md`** in any folder is the index page for that route
- **Subfolders with `README.md`** become individual pages within a section
- **`content/README.md`** is the home page and uses the `DocHome` layout by default

### Folder-based pages

Each page can be a single `README.md` or a folder containing `README.md` plus sibling assets (images):

```
content/guide/getting-started/
  README.md          # Page content
  architecture.svg   # Referenced in markdown as ./architecture.svg
```

## Frontmatter

Standard page frontmatter:

```yaml
---
title: Getting Started          # Required — page title and sidebar label
description: Learn the basics   # Required — meta description
navLabel: Start Here            # Optional — override label in top nav
sidebarLabel: Basics            # Optional — override label in sidebar
order: 1                        # Optional — manual sort order
draft: true                     # Optional — exclude from production build
---
```

### Home page frontmatter

The root `content/README.md` supports special fields for the home page layout:

```yaml
---
layout: DocHome
title: My Project
tagline: A short tagline
description: Longer description for meta tags
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
    details: Short description of the feature.
packages:
  - name: "@scope/core"
    description: Core package description
    href: /reference/api
    tag: Core
---
```

Home page sections are all optional. Omit a key and that section is not rendered.

## Section Meta (`meta.json5`)

Place a `meta.json5` file in any content section folder to control ordering, display, and grouping.

```json5
{
  displayName: 'Guide',
  description: 'Learn how to use the project.',
  orderBy: 'manual',          // 'manual' (default) or 'publishedDate'
  items: [                     // Explicit page order (slugs)
    'getting-started',
    'configuration',
    'advanced',
  ],
  layout: 'page',             // Default layout for section index
  itemLayout: 'page',         // Default layout for items in this section
  series: [                    // Group pages into series
    {
      slug: 'basics',
      displayName: 'Getting Started',
      description: 'Start here.',
      articles: ['getting-started', 'configuration'],
    },
  ],
}
```

- `items` controls sidebar order. Pages not listed appear after listed ones.
- `series` groups pages into named sequences with prev/next navigation.
- `displayName` overrides the folder name in the sidebar heading.

## CLI Commands

```bash
# Development server with hot reload
npx pagesmith dev [--port 3000] [--open] [--config path/to/config.json5]

# Production build
npx pagesmith build [--out-dir ./dist] [--base-path /docs] [--config path/to/config.json5]

# Preview the built site
npx pagesmith preview [--port 4173] [--config path/to/config.json5]
```

## Navigation

Navigation is auto-generated from the content directory structure:

- **Header nav**: Auto-generated from top-level content folders. Override with `navItems` in config or `headerLinks` in `content/meta.json5`.
- **Sidebar**: Auto-generated from the current section's pages and subpages. Order controlled by `meta.json5` `items` array.
- **Prev/Next links**: Auto-generated at the bottom of each page based on sidebar order.
- **Footer links**: Set via `footerLinks` in config.

### Root meta.json5

Place a `meta.json5` at `content/meta.json5` to override header and footer links site-wide:

```json5
{
  headerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'Reference', path: '/reference' },
  ],
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'GitHub', path: 'https://github.com/example/repo' },
  ],
}
```

## Bundled Assets

Everything needed to render the site is bundled with the package:

- **Fonts**: Open Sans (text) and JetBrains Mono (code) -- no Google Fonts requests
- **CSS**: Complete default theme with light/dark mode, responsive layout, syntax highlighting
- **JS**: Sidebar toggle, search modal, table of contents scroll tracking
- **Search**: Pagefind indexed at build time, search UI included

No CDN links, no external requests. The built site is fully self-contained.
