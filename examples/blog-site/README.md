# Pagesmith Blog Site

A fully custom blog/portfolio site built on `@pagesmith/core` with its own JSX layout system, modular CSS architecture, and client-side runtime. Demonstrates how to build a complex, multi-section site with custom page types, series navigation, tag indexing, and featured content -- all without using `@pagesmith/docs`.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:blog-site
```

## Project Structure

```
blog-site/
  content/
    articles/             Long-form articles organized by series (via meta.json5)
    blogs/                Blog posts
    projects/             Project showcases
    README.md             Home page content
    site.json5            Site-wide configuration (nav, social, page types, featured)
    redirects.json5       URL redirect mappings
  layouts/
    Article.tsx           Article detail layout with series prev/next navigation
    Blog.tsx              Blog post layout
    Home.tsx              Home page layout with featured content and stats
    Listing.tsx           Section index layout (articles, blogs, projects)
    NotFound.tsx          404 page layout
    Page.tsx              Generic page layout
    Project.tsx           Project detail layout
    TagIndex.tsx          All-tags index layout
    TagListing.tsx        Single-tag listing layout
    components/
      Footer.tsx          Site footer component
      Header.tsx          Site header with navigation and search
      Html.tsx            HTML document wrapper (head, meta, assets)
    types.ts              Layout prop type definitions
    utils.ts              Shared layout utilities (URL helpers)
  styles/
    main.css              CSS entry point (imports all partials)
    foundations/
      reset.css           CSS reset
      tokens.css          Design tokens (colors, spacing, typography)
      fonts.css           Font-face declarations
    content/
      prose.css           Prose/article content styles
      toc.css             Table of contents styles
    code/
      inline.css          Inline code styles
    layout/
      grid.css            Page grid layout
      header.css          Header styles
      footer.css          Footer styles
      sidebar.css         Sidebar navigation styles
    components/
      article-card.css    Article card component
      article-header.css  Article header component
      article-nav.css     Prev/next article navigation
      series-nav.css      Series navigation sidebar
      tag-cloud.css       Tag cloud component
      home.css            Home page component styles
      not-found.css       404 page styles
  runtime/
    main.ts               Runtime entry -- imports sidebar and TOC modules
    sidebar.ts            Sidebar scroll-to-current enhancement
    toc-highlight.ts      TOC heading highlight on scroll
  src/
    entry-server.tsx      SSR entry -- content loading, routing, and rendering
    theme.css             Imports styles/main.css
  client.js               Client entry -- imports styles/main.css and runtime/main.ts
  index.html              Dev-mode HTML shell
  vite.config.ts          Vite config with Pagesmith SSG plugin
  package.json
```

## How It Works

### Content Configuration

Unlike the framework examples, this site does **not** use `content.config.mjs`, `defineCollection`, or `virtual:content/*` modules. Instead, the `src/entry-server.tsx` directly scans the `content/` directory for markdown files using `processMarkdown` from `@pagesmith/core/markdown` and the Node.js filesystem API. Site-wide settings are read from `content/site.json5` (parsed with the `json5` package).

### Site Configuration (`content/site.json5`)

The `site.json5` file configures the entire site:

```json5
{
  name: 'My Blog',
  title: 'My Blog -- Thoughts on Software',
  navItems: [
    { label: 'Articles', href: '/articles' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Projects', href: '/projects' },
  ],
  social: { github: '...', twitter: '...' },
  copyright: '...',
  search: { enabled: true, showImages: false },
  pageTypes: {
    articles: { displayName: 'Articles', layout: 'Listing', itemLayout: 'Article' },
    blogs: { displayName: 'Blogs', layout: 'Listing', itemLayout: 'Blog' },
    projects: { displayName: 'Projects', layout: 'Listing', itemLayout: 'Project' },
  },
  featured: {
    articles: ['understanding-system-design'],
    series: ['web-fundamentals'],
  },
}
```

The `pageTypes` configuration maps content directories to their display names and layout assignments. The `featured` configuration specifies which articles and series appear on the home page.

### Vite Configuration (`vite.config.ts`)

The Vite config registers two plugins:

- **`sharedAssetsPlugin()`** -- serves shared fonts from `@pagesmith/core`.
- **`pagesmithSsg({ entry, contentDirs })`** -- drives static site generation.

JSX uses `@pagesmith/core`'s lightweight JSX runtime:

```ts
oxc: {
  jsx: {
    runtime: 'automatic',
    importSource: '@pagesmith/core',
  },
}
```

### Server-Side Rendering (`src/entry-server.tsx`)

The SSR entry is a comprehensive module that handles the full rendering pipeline:

1. **Content loading** -- recursively collects all markdown files from `content/`, processes them with `processMarkdown`, and builds page metadata.
2. **Page types** -- groups pages by section (articles, blogs, projects), builds series from `meta.json5` definitions in subdirectories, and tracks featured content.
3. **Tag indexing** -- collects all tags across pages and builds a tag-to-pages index.
4. **Layout resolution** -- determines the correct layout component for each page based on: frontmatter `layout` field, section defaults from `pageTypes` config, or whether the page is a home/section-index.
5. **Route generation** -- `getRoutes()` produces routes for all content pages plus `/tags` and `/tags/{tag}` routes.
6. **Rendering** -- `render()` calls the resolved layout component with the page's content, frontmatter, headings, site config, page type data, series navigation, and tag data.

### Layout Components

Nine JSX layout components in the `layouts/` directory handle different page types. All use `@pagesmith/core/jsx-runtime` for rendering (not React or any other framework):

| Layout | Used For |
|--------|----------|
| `Home.tsx` | Site home page with featured articles, featured series, and site stats |
| `Article.tsx` | Individual article with series prev/next navigation |
| `Blog.tsx` | Blog post detail page |
| `Project.tsx` | Project showcase page |
| `Listing.tsx` | Section index (articles, blogs, or projects listing) |
| `TagIndex.tsx` | All tags overview page |
| `TagListing.tsx` | Pages tagged with a specific tag |
| `Page.tsx` | Generic standalone page |
| `NotFound.tsx` | 404 error page |

Shared components in `layouts/components/`:

| Component | Purpose |
|-----------|---------|
| `Html.tsx` | Full HTML document wrapper (head, meta tags, CSS/JS links, body) |
| `Header.tsx` | Site header with navigation, search trigger, and mobile menu |
| `Footer.tsx` | Site footer with links and copyright |

### Layout Types (`layouts/types.ts`)

Comprehensive TypeScript type definitions for all layout props, including:

- `SiteConfig` -- full site configuration shape
- `BaseLayoutProps` -- content, frontmatter, headings, slug, and site config
- `ArticleLayoutProps` -- extends base with page metadata, page type data, tags, and series navigation
- `HomeLayoutProps` -- extends base with featured articles, featured series, and stats
- `SeriesNav` -- prev/next navigation within a series
- `TagPageData` -- tag-to-pages mapping for tag pages

### Client Runtime (`runtime/`)

Progressive enhancements organized into focused modules:

- **`runtime/main.ts`** -- entry point that imports and initializes all modules.
- **`runtime/sidebar.ts`** -- scrolls the active sidebar item into view on page load.
- **`runtime/toc-highlight.ts`** -- uses `IntersectionObserver` to highlight the current heading in the table of contents.

## Content Structure

Content is organized by section under the `content/` directory:

| Path | Description |
|------|-------------|
| `content/README.md` | Home page content |
| `content/site.json5` | Site-wide configuration |
| `content/redirects.json5` | URL redirect mappings |
| `content/articles/` | Long-form articles, organized by series via `meta.json5` files |
| `content/blogs/` | Blog posts with date and tags |
| `content/projects/` | Project showcase pages |

Articles support series grouping through `meta.json5` files in subdirectories that define series metadata (display name, description, article order).

## CSS and Styling

The site uses a modular CSS architecture under `styles/` with clear separation of concerns:

```
styles/
  main.css                CSS entry point (imports all partials)
  foundations/
    reset.css             Box-sizing, margin reset, font smoothing
    fonts.css             @font-face declarations
    tokens.css            CSS custom properties (colors, spacing, type scale)
  content/
    prose.css             Article content formatting (headings, lists, tables, code)
    toc.css               Table of contents styles
  code/
    inline.css            Inline code highlight styles
  layout/
    grid.css              Three-column page grid (sidebar, main, aside)
    header.css            Header with nav, search, mobile menu
    footer.css            Footer styles
    sidebar.css           Sidebar navigation with collapsible sections
  components/
    article-card.css      Card component for article listings
    article-header.css    Article title and metadata header
    article-nav.css       Prev/next article navigation
    series-nav.css        Series sidebar navigation
    tag-cloud.css         Tag cloud component
    home.css              Home page hero and featured sections
    not-found.css         404 page styles
```

The `client.js` entry imports `styles/main.css` so Vite processes it into a hashed CSS asset. Shared font assets are served by `sharedAssetsPlugin()`.

## Development

```bash
vp dev
```

Starts the Vite dev server with HMR.

## Building

```bash
vp build
```

Runs static site generation:

1. Scans `content/` for all markdown files and `site.json5`.
2. Processes markdown with `processMarkdown` from `@pagesmith/core/markdown`.
3. Builds page type data, series, tag indexes, and featured content lists.
4. Calls `getRoutes()` to discover all pages (content + tag pages).
5. Calls `render()` for each route, resolving the layout and rendering JSX to HTML.
6. Runs Pagefind to index the output for full-text search.
7. Writes all files to the configured output directory.

## Key Files

| File | Purpose |
|------|---------|
| `content/site.json5` | Site configuration (nav, social, page types, featured content) |
| `vite.config.ts` | Registers `sharedAssetsPlugin` and `pagesmithSsg` plugins |
| `src/entry-server.tsx` | Full SSR pipeline: content scanning, routing, layout resolution |
| `layouts/` | Nine JSX layout components using `@pagesmith/core/jsx-runtime` |
| `layouts/types.ts` | TypeScript type definitions for layout props and site config |
| `layouts/utils.ts` | Shared utility: `withBase()` for URL prefixing |
| `layouts/components/` | Shared components: `Html`, `Header`, `Footer` |
| `styles/main.css` | CSS entry point importing all style partials |
| `runtime/main.ts` | Client runtime entry (sidebar scroll, TOC highlight) |
| `client.js` | Client entry importing styles and runtime |
