---
title: Blog Site with Pagesmith
description: Build a fully custom blog with Pagesmith's core content layer, custom JSX layouts, and its own design system.
---

# Blog Site with Pagesmith

## Overview

The Blog Site example demonstrates how to build a fully custom site on top of `@pagesmith/core` and `@pagesmith/site` with its own JSX layouts, design system, and content pipeline. Unlike the Doc Site (which uses `@pagesmith/docs` for convention-based setup), this example uses the core content layer directly with `processMarkdown` from `@pagesmith/core/markdown`, custom layout components rendered via `@pagesmith/site/jsx-runtime`, and a `site.json5` configuration file. It supports multiple content types (articles, blogs, projects), series-based article grouping, tag indexes, and a rich navigation system -- all rendered as static HTML through the `pagesmithSsg` Vite plugin from `@pagesmith/site/vite`.

Source: [`examples/blog-site/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/blog-site) | Output: <a href="/pagesmith/examples/blog-site" target="_blank" rel="noopener noreferrer">Live Demo</a>

The diagram below highlights the custom-site flow: this pattern keeps routing and page assembly in your own entry server and layouts, while Pagesmith provides the markdown processing, JSX runtime, and static generation pieces underneath.

<figure>
  <img src="./diagrams/blog-site-assembly-light.svg" class="only-light" alt="Custom blog project files flowing through Pagesmith markdown, JSX, and SSG building blocks into generated pages, derived navigation, and search">
  <img src="./diagrams/blog-site-assembly-dark.svg" class="only-dark" alt="Custom blog project files flowing through Pagesmith markdown, JSX, and SSG building blocks into generated pages, derived navigation, and search">
  <figcaption>Custom blog project files flowing through Pagesmith markdown, JSX, and SSG building blocks into generated pages, derived navigation, and search</figcaption>
</figure>

## Prerequisites

- Node.js 20+
- [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) (the `vp` CLI)

## Project Setup

### package.json

```json
{
  "name": "@pagesmith/example-blog-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check"
  },
  "dependencies": {
    "@pagesmith/core": "*",
    "@pagesmith/site": "*",
    "json5": "^2.2.3",
    "pagefind": "^1.3.0"
  },
  "devDependencies": {
    "vite": "npm:@voidzero-dev/vite-plus-core@^0.1.13",
    "vite-plus": "^0.1.13"
  }
}
```

Install with:

```bash
vp install
```

### Project Structure

```text
blog-site/
  content/
    README.md           # Home page content (with hero/features frontmatter)
    site.json5          # Site-wide configuration
    redirects.json5     # URL redirect mappings
    articles/           # Technical articles (supports series grouping)
    blogs/              # Blog posts
    projects/           # Project showcases
  layouts/
    Article.tsx         # Article page layout (with series navigation)
    Blog.tsx            # Blog post layout
    Project.tsx         # Project page layout
    Home.tsx            # Home page with hero, features, and featured content
    Listing.tsx         # Section listing page (articles, blogs, or projects)
    Page.tsx            # Generic standalone page
    NotFound.tsx        # 404 page
    TagIndex.tsx        # Tag index page (lists all tags)
    TagListing.tsx      # Tag listing page (entries for a specific tag)
    types.ts            # Shared TypeScript types for all layout props
    utils.ts            # Utility functions (withBase for URL resolution)
    components/
      Footer.tsx        # Shared footer component
      Header.tsx        # Shared header with navigation
      Html.tsx          # Document shell (head, meta tags, stylesheets)
  src/
    entry-server.tsx    # SSR entry: filesystem scanning, markdown processing, routing
    theme.css           # Imports the custom design system
  styles/
    foundations/        # CSS tokens, reset, fonts
    layout/             # Header and grid styles
    code/               # Code block and syntax highlighting styles
    components/         # Component-specific styles
    content/            # Prose and TOC styles
    main.css            # Style entry point
  vite.config.ts
  index.html
  client.js
```

### vite.config.ts

The blog site uses `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`, with `@pagesmith/site` as the JSX import source:

```ts
import { defineConfig } from 'vite-plus'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'

export default defineConfig({
  base: '/my-blog',
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: '@pagesmith/site',
    },
  },
})
```

The `oxc.jsx.importSource` is set to `@pagesmith/site`, which provides the server-side JSX runtime at `@pagesmith/site/jsx-runtime`. This means all `.tsx` files in the project use Pagesmith's `h()` function for JSX compilation -- no React or other framework needed.

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pagesmith Blog Example</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/client.js"></script>
  </body>
</html>
```

### client.js

```js
import './styles/main.css'
import './runtime/main.ts'
```

## Content Configuration

Instead of `content.config.ts` with `defineCollection`, the blog site uses a `content/site.json5` for site-wide configuration and scans the filesystem directly:

```json5
{
  origin: 'https://example.com',
  name: 'My Blog',
  title: 'My Blog — Thoughts on Software',
  description: 'A blog about software engineering, architecture, and best practices.',
  language: 'en',

  navItems: [
    { label: 'Articles', href: '/articles' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Projects', href: '/projects' },
  ],

  social: {
    github: 'https://github.com/example',
    twitter: 'https://twitter.com/example',
  },

  copyright: '© 2026 Example Author',

  search: {
    enabled: true,
    showImages: false,
  },

  pageTypes: {
    articles: {
      displayName: 'Articles',
      layout: 'Listing',
      itemLayout: 'Article',
    },
    blogs: {
      displayName: 'Blogs',
      layout: 'Listing',
      itemLayout: 'Blog',
    },
    projects: {
      displayName: 'Projects',
      layout: 'Listing',
      itemLayout: 'Project',
    },
  },

  featured: {
    articles: ['understanding-system-design'],
    series: ['web-fundamentals'],
  },
}
```

The `pageTypes` maps content directories to layouts. Each page type has a listing layout (section index) and an item layout (individual entries). The `featured` configuration controls which articles and series appear on the home page.

## Content Structure

```text
content/
  README.md               # Home page
  site.json5              # Site configuration
  articles/
    web-fundamentals/     # Series folder
      understanding-html/
        README.md
      css-deep-dive/
        README.md
    standalone-article/
      README.md
  blogs/
    hello-world/
      README.md
  projects/
    pagesmith/
      README.md
```

Each markdown file uses frontmatter for metadata:

```md
---
title: Understanding HTML
description: A deep dive into HTML semantics
tags: [html, web]
series: web-fundamentals
seriesOrder: 1
lastUpdatedOn: 2026-01-15
---
```

## Entry Server

The entry server (`src/entry-server.tsx`) handles filesystem scanning, markdown processing, route generation, layout selection, and rendering.

### Content Loading with processMarkdown

Instead of using `createContentLayer`, the blog site scans the `content/` directory and processes each markdown file with `processMarkdown`:

```ts
import { existsSync, readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import JSON5 from 'json5'
import { processMarkdown } from '@pagesmith/core/markdown'
import type { SsgRenderConfig } from '@pagesmith/core/vite'

const contentDir = resolve(import.meta.dirname, '../content')

// Read site config
const siteConfig = JSON5.parse(readFileSync(join(contentDir, 'site.json5'), 'utf-8'))

// Scan and process all markdown files
async function loadPages(base: string): Promise<LoadedPage[]> {
  const pages: LoadedPage[] = []
  for (const filePath of collectMarkdown(contentDir)) {
    const raw = readFileSync(filePath, 'utf-8')
    const result = await processMarkdown(raw)
    pages.push({
      filePath,
      slug: toContentSlug(filePath),
      html: result.html,
      headings: result.headings,
      frontmatter: result.frontmatter,
    })
  }
  return pages
}
```

### Layout Selection

All layouts are imported and selected based on the page type and content location:

```ts
import Article from '../layouts/Article'
import Blog from '../layouts/Blog'
import Home from '../layouts/Home'
import Listing from '../layouts/Listing'
import NotFound from '../layouts/NotFound'
import Page from '../layouts/Page'
import Project from '../layouts/Project'
import TagIndex from '../layouts/TagIndex'
import TagListing from '../layouts/TagListing'

const layouts = { Article, Blog, Home, Listing, NotFound, Page, Project, TagIndex, TagListing }
```

### Route Generation

Routes are generated from the filesystem structure plus derived routes for tags:

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  // Returns: ['/', '/articles', '/articles/my-post', '/blogs', '/blogs/hello-world',
  //           '/projects', '/projects/pagesmith', '/tags', '/tags/javascript', ...]
}
```

## Layouts with @pagesmith/site/jsx-runtime

All layouts use `@pagesmith/site/jsx-runtime` for server-side JSX rendering. Import `h` and `Fragment`:

```tsx
import { Fragment, h } from '@pagesmith/site/jsx-runtime'
```

### Key JSX Runtime Differences

The Pagesmith JSX runtime differs from React:

- Use **`class`** instead of `className`
- Use **`innerHTML`** instead of `dangerouslySetInnerHTML` to inject raw HTML
- Use **`innerHTML`** on `<script>` and `<style>` tags for inline content
- **No hydration** -- produces pure HTML strings

### Shared Components

**Html** -- the document shell that renders `<html>`, `<head>`, and `<body>`. Handles SEO metadata, OpenGraph tags, theme colors, CSS/JS references, and search integration:

```tsx
import { Fragment, h } from '@pagesmith/site/jsx-runtime'

export function Html({ title, description, site, children }: Props) {
  const cssPath = site.assets?.cssPath ?? withBase(site, '/assets/style.css')
  const searchEnabled = site.search?.enabled === true
  const baseUrl = site.baseUrl?.replace(/\/+$/, '') ?? ''

  return (
    <html lang={site.language || 'en'} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="stylesheet" href={`${baseUrl}/assets/fonts.css`} />
        <link rel="stylesheet" href={cssPath} />
        {searchEnabled ? (
          <link rel="stylesheet" href={`${baseUrl}/pagefind/pagefind-component-ui.css`} />
        ) : null}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? (
          <script src={`${baseUrl}/pagefind/pagefind-component-ui.js`} type="module" />
        ) : null}
      </head>
      <body>
        {children}
        {searchEnabled ? (
          <pagefind-modal reset-on-close="">
            <pagefind-modal-header>
              <pagefind-input />
            </pagefind-modal-header>
            <pagefind-modal-body>
              <pagefind-summary />
              <pagefind-results show-images={site.search?.showImages ? '' : undefined} />
            </pagefind-modal-body>
            <pagefind-modal-footer>
              <pagefind-keyboard-hints />
            </pagefind-modal-footer>
          </pagefind-modal>
        ) : null}
      </body>
    </html>
  )
}
```

**Header** -- site header with logo, navigation items, and search trigger.

**Footer** -- site footer with social links, copyright, and footer navigation.

### Layout Prop Types

Each layout receives typed props defined in `layouts/types.ts`:

```ts
import type { Heading } from '@pagesmith/core/schemas'

export type BaseLayoutProps = {
  content: string
  frontmatter: Record<string, any>
  headings: Heading[]
  slug: string
  site: SiteConfig
}

export type ArticleLayoutProps = BaseLayoutProps & {
  pages: PageMeta[]
  pageType?: PageTypeData
  allTags?: Map<string, TagPageData>
  seriesNav?: SeriesNav
}

export type HomeLayoutProps = BaseLayoutProps & {
  featuredArticles?: ArticleSummary[]
  featuredSeries?: SeriesData[]
  stats?: { totalArticles: number; totalSeries: number }
}
```

### The withBase Utility

All layouts use `withBase` to resolve paths relative to the site's base URL:

```ts
export function withBase(site: Pick<SiteConfig, 'baseUrl'> | string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path
  }
  const base = typeof site === 'string' ? site : site.baseUrl
  const normalizedBase = base && base !== '/' ? base.replace(/\/+$/, '') : ''
  return normalizedBase ? `${normalizedBase}${path}` : path
}
```

### Series Navigation

Articles support series grouping through frontmatter. The entry server computes series navigation (prev/next links) and passes it to layouts:

```ts
type SeriesNav = {
  series: {
    slug: string
    displayName: string
    shortName: string
    description?: string
    articles: string[]
  }
  articles: Array<{ slug: string; title: string; url: string }>
  prev?: { slug: string; title: string; url: string }
  next?: { slug: string; title: string; url: string }
}
```

## CSS and Styling

The blog site has its own complete design system, independent from the `@pagesmith/docs` theme. Styles are organized under `styles/`:

```text
styles/
  main.css              # Entry point that imports all style modules
  foundations/
    reset.css           # CSS reset
    tokens.css          # Design tokens (colors, spacing, typography, radii)
    fonts.css           # Font declarations
  layout/
    header.css          # Header layout
    grid.css            # Grid system
  code/                 # Syntax highlighting and code block styles
  components/           # Component-specific styles
  content/
    prose.css           # Prose typography for rendered markdown
    toc.css             # Table of contents styles
```

The theme CSS entry (`src/theme.css`) imports the main stylesheet:

```css
@import "../styles/main.css";
```

The `sharedAssetsPlugin()` copies bundled web fonts from `@pagesmith/site`. The client entry (`client.js`) imports both CSS and runtime JS:

```js
import './styles/main.css'
import './runtime/main.ts'
```

You can also use `@pagesmith/site` CSS imports within your custom styles:

| Import path | Contents |
|---|---|
| `@pagesmith/site/css/standalone` | Full bundle (reset, tokens, prose, code, layout, TOC) |
| `@pagesmith/site/css/content` | Content-only bundle (reset, prose, code, viewport) |
| `@pagesmith/site/css/fonts` | Bundled web fonts (Open Sans, JetBrains Mono) |
| `@pagesmith/site/css/viewport` | Viewport / responsive base only |

## Pagefind Search

Search is configured in `content/site.json5`:

```json5
{
  search: {
    enabled: true,
    showImages: false,
  },
}
```

The `Html` component conditionally includes Pagefind Component UI CSS/JS assets and renders `<pagefind-modal>` with `<pagefind-input>` and related web components. Keyboard shortcuts and modal behavior are handled by Component UI, not by `new PagefindUI({ ... })`. Content areas are marked with `data-pagefind-body` for indexing.

## Development and Building

```bash
# Start the dev server with hot reload
vp dev

# Build the static site (runs SSG + Pagefind indexing)
vp build

# Type-check the project
vp check
```

## Key Concepts

- **`processMarkdown`** from `@pagesmith/core/markdown` converts raw markdown to HTML, headings, and frontmatter.
- **`@pagesmith/site/jsx-runtime`** provides `h()` and `Fragment()` for server-side JSX rendering with zero framework overhead.
- **`innerHTML`** (not `dangerouslySetInnerHTML`) injects raw HTML in Pagesmith JSX; use `class` (not `className`).
- **`site.json5`** drives content type configuration, navigation, and featured content.
- **Layout selection** maps content directories to layout components via `pageTypes` configuration.
- **Series navigation** provides prev/next links within article series.
- **Tag indexes** are automatically generated from frontmatter tags.
- **Custom design system** -- the blog site owns its entire CSS; `@pagesmith/site` styles are optional.
- **`pagesmithSsg`** handles SSG, dev middleware, and Pagefind indexing.
