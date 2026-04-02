# Pagesmith Doc Site Example

A documentation site built entirely with `@pagesmith/docs` and configured through `pagesmith.config.json5`. Demonstrates how to create a full docs site from configuration alone, with optional layout overrides for the home and page layouts. No `vite.config.ts` or `content.config.ts` is needed -- `@pagesmith/docs` handles everything.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:doc-site
```

## Project Structure

```
doc-site/
  content/
    README.md             Site home page content (with hero/features frontmatter)
    blog/
      README.md           Blog section index
      meta.json5          Blog section ordering configuration
      building-a-doc-site/README.md
      organizing-content-with-series/README.md
    guide/
      README.md           Guide section index
      meta.json5          Guide section ordering configuration
      getting-started/README.md
      configuration/README.md
      layouts/README.md
    reference/
      README.md           Reference section index
      cli/README.md
      schemas/README.md
    api/
      README.md           API section index
      content-layer/README.md
      markdown/README.md
  theme/
    layouts/
      DocHome.tsx         Custom home page layout override
      DocPage.tsx         Custom documentation page layout override
  pagesmith.config.json5  Site configuration
  package.json
```

## How It Works

### Content Convention

This example relies on `@pagesmith/docs` convention: all content lives under a `content/` directory. Top-level folders (`blog/`, `guide/`, `reference/`, `api/`) automatically become navigation sections in the sidebar. Each folder contains markdown files (as `README.md` inside named subdirectories) that are rendered as documentation pages. The root `content/README.md` serves as the home page.

Section ordering and page ordering within sections are controlled by `meta.json5` files inside each section directory.

### Site Configuration (`pagesmith.config.json5`)

The `pagesmith.config.json5` file configures the entire site with a single JSON5 object:

```json5
{
  name: 'Pagesmith',
  title: 'Example Docs',
  description: 'Documentation site built with @pagesmith/docs',
  origin: 'https://projects.sujeet.com',
  contentDir: './content',
  outDir: '../../gh-pages/examples/doc-site',
  basePath: '/pagesmith/examples/doc-site',
  homeLink: '/pagesmith',
  sidebar: {
    collapsible: true,
  },
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'API', path: '/api' },
    { label: 'Reference', path: '/reference' },
    { label: 'Blog', path: '/blog' },
  ],
  search: {
    enabled: true,
    showImages: false,
  },
}
```

Key configuration options:

| Option | Description |
|--------|-------------|
| `name` | Site name shown in the header logo |
| `title` | Browser tab title suffix |
| `description` | Default meta description |
| `origin` | Production URL origin for canonical links |
| `contentDir` | Path to the content directory |
| `outDir` | Build output directory |
| `basePath` | URL base path for all routes |
| `homeLink` | Where the logo links to (can differ from basePath) |
| `sidebar.collapsible` | Enables collapsible sidebar sections with `<details>` elements |
| `footerLinks` | Navigation links shown in the site footer |
| `search.enabled` | Enables Pagefind full-text search |

### Layout Overrides (`theme/layouts/`)

The `theme/layouts/` directory contains two custom layout components that override the defaults provided by `@pagesmith/docs`:

**`DocHome.tsx`** -- replaces the default home page layout. It uses `@pagesmith/core/jsx-runtime` for rendering and receives props including `content`, `frontmatter`, `slug`, and `site`. The home page supports `hero` (with `name`, `text`, `tagline`, `actions`) and `features` (with `icon`, `title`, `details`) defined in the frontmatter of `content/README.md`.

**`DocPage.tsx`** -- replaces the default documentation page layout. It receives the full set of props: `content`, `frontmatter`, `headings`, `slug`, `site`, `sidebarSections`, `prev`, and `next`. The component renders:

- Site header with navigation links and search trigger.
- Three-column layout: sidebar, main content, and table-of-contents aside.
- Collapsible sidebar sections when `sidebar.collapsible` is enabled in config.
- Previous/next navigation footer links.
- Pagefind search modal.

Both layout overrides are picked up automatically by `@pagesmith/docs` from the `theme/layouts/` directory based on the component name (`DocHome` for the home page, `DocPage` for documentation pages).

### Build and Dev Commands

The `dev` and `build` scripts invoke the `@pagesmith/docs` CLI directly:

```bash
# dev server
node ../../packages/docs/dist/cli/bin.mjs dev --config ./pagesmith.config.json5

# production build
node ../../packages/docs/dist/cli/bin.mjs build --config ./pagesmith.config.json5
```

The docs CLI handles the entire pipeline: Vite setup, markdown processing, sidebar generation from the `content/` tree, Pagefind search indexing, and static site output.

## Content Structure

Content follows the `@pagesmith/docs` folder convention:

```
content/
  README.md                 Home page (special: uses DocHome layout)
  guide/                    "Guide" nav section
    README.md               Section index page
    meta.json5              Page ordering within section
    getting-started/README.md
    configuration/README.md
    layouts/README.md
  blog/                     "Blog" nav section
    README.md               Section index page
    meta.json5              Page ordering within section
    building-a-doc-site/README.md
    organizing-content-with-series/README.md
  reference/                "Reference" nav section
    README.md               Section index
    cli/README.md
    schemas/README.md
  api/                      "API" nav section
    README.md               Section index
    content-layer/README.md
    markdown/README.md
```

Top-level folders automatically become sidebar navigation sections. Each `README.md` inside a named subdirectory becomes a page. The `meta.json5` files control the order of pages within a section.

## CSS and Styling

Styles are provided entirely by `@pagesmith/docs`'s built-in theme. No custom CSS is needed unless you want to override specific styles. The theme includes:

- CSS reset and design tokens
- Three-column documentation layout (sidebar, content, TOC)
- Prose formatting for markdown content
- Search modal and sidebar modal styles
- Responsive design for mobile/tablet/desktop
- Light/dark color scheme support

## Development

```bash
# From the monorepo root
vp run dev:eg:doc-site

# Or from the example directory
node ../../packages/docs/dist/cli/bin.mjs dev --config ./pagesmith.config.json5
```

Starts the docs dev server with HMR.

## Building

```bash
# From the monorepo root
vp run build -- --filter @pagesmith/example-doc-site

# Or from the example directory
node ../../packages/docs/dist/cli/bin.mjs build --config ./pagesmith.config.json5
```

The build:

1. Scans `content/` for all markdown files and `meta.json5` ordering files.
2. Generates sidebar navigation from the folder structure.
3. Processes markdown through the `@pagesmith/core` pipeline.
4. Renders each page using layout overrides (or defaults if none provided).
5. Runs Pagefind to index the output for full-text search.
6. Writes all files to `outDir`.

## Key Files

| File | Purpose |
|------|---------|
| `pagesmith.config.json5` | Site configuration (name, paths, sidebar, search, footer) |
| `content/README.md` | Home page content with hero and features frontmatter |
| `content/guide/` | Guide documentation section |
| `content/blog/` | Blog posts section |
| `content/reference/` | Reference documentation section |
| `content/api/` | API documentation section |
| `theme/layouts/DocHome.tsx` | Custom home page layout override using `@pagesmith/core/jsx-runtime` |
| `theme/layouts/DocPage.tsx` | Custom documentation page layout override with sidebar and TOC |
