---
title: Getting Started with @pagesmith/docs
description: Set up a convention-based docs site with navigation, search, and a default theme
order: 3
---

# Getting Started with @pagesmith/docs

`@pagesmith/docs` is a convention-based documentation site builder that sits on top of `@pagesmith/core`. It turns a directory of markdown files and a single JSON5 config into a complete docs site with navigation, sidebar, table of contents, Pagefind search, and a default theme -- all without writing any JavaScript or layout code.

This guide covers everything you need to go from an empty project to a running docs site.

## AI-First Setup

Paste this into your AI assistant to set up a complete docs site in under a minute:

> Install `@pagesmith/docs` and run `npx pagesmith init --ai`. Accept the defaults or customize when prompted. Then run `npx pagesmith dev --open` to start the dev server.

Your agent will create:
- `pagesmith.config.json5` -- site configuration
- `content/README.md` and starter sections
- AI context files and markdown guidelines
- Claude skills for docs maintenance (`/update-docs`, `/ps-update-all-docs`)

The rest of this guide explains each piece in detail for manual setup or customization.

---

## Install

```bash
npm add @pagesmith/docs
```

This pulls in `@pagesmith/core` as a dependency automatically. You do not need to install core separately when using the docs package.

After installation, the `pagesmith` CLI is available via `npx pagesmith` or through package scripts.

## Create a Configuration File

Every `@pagesmith/docs` site is driven by a `pagesmith.config.json5` file in the project root. This is the only required configuration.

```json5
{
  // Required: site identity
  name: 'My Docs',
  title: 'My Docs',
  description: 'Documentation for my project',
  origin: 'https://docs.example.com',

  // Optional: content and output paths (shown with defaults)
  contentDir: './content',
  outDir: './dist',

  // Optional: deployment under a subdirectory
  basePath: '/docs',

  // Optional: footer navigation
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'API Reference', path: '/reference' },
    { label: 'GitHub', path: 'https://github.com/example/repo' },
  ],

  // Optional: search (enabled by default)
  search: {
    enabled: true,
  },
}
```

### Configuration Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | directory name | Short site name shown in the header |
| `title` | `string` | same as `name` | Full site title used in page titles and meta tags |
| `description` | `string` | `"Documentation site powered by @pagesmith/docs"` | Meta description for the site |
| `origin` | `string` | `"https://example.com"` | Production URL origin (used for canonical links, sitemap) |
| `language` | `string` | `"en"` | HTML `lang` attribute |
| `contentDir` | `string` | `"./content"` | Path to the content directory, relative to the config file |
| `outDir` | `string` | `"./dist"` | Build output directory, relative to the config file |
| `publicDir` | `string` | `"./public"` | Static assets directory copied verbatim to output |
| `basePath` | `string` | `"/"` | URL prefix for deployment under a subdirectory. Can also be set via the `BASE_URL` environment variable or the `--base-path` CLI flag. Priority: CLI flag > `BASE_URL` env > config value > default `"/"` |
| `footerLinks` | `array` | `[]` | Links shown in the page footer. Each entry has `label` and `path` |
| `search` | `object` | `{ enabled: true }` | Search configuration. Set `{ enabled: false }` to disable |
| `theme` | `object` | -- | Theme overrides including `lightColor`, `darkColor`, and `layouts` |
| `analytics` | `object` | -- | Analytics config, currently supports `googleAnalytics` tracking ID |
| `markdown` | `object` | -- | Markdown pipeline config passed to `@pagesmith/core` (custom remark/rehype plugins) |

## Content Directory Structure

The content directory is the source of truth for your docs site. Top-level folders become navigation sections, and each markdown file becomes a page.

```text
content/
  README.md              # Home page (the site landing page)
  guide/
    README.md            # "Guide" section landing page
    meta.json5           # Section configuration (optional)
    getting-started/
      README.md          # /guide/getting-started
    advanced-usage/
      README.md          # /guide/advanced-usage
  reference/
    README.md            # "Reference" section landing page
    meta.json5           # Section configuration (optional)
    api/
      README.md          # /reference/api
    cli/
      README.md          # /reference/cli
```

Key conventions:

- **`content/README.md`** is always the home page, rendered at `/`.
- **Top-level folders** (e.g. `guide/`, `reference/`) become navigation sections visible in the header.
- **`README.md` inside a section folder** is the section landing page (e.g. `guide/README.md` serves `/guide`).
- **Subfolders with `README.md`** become individual pages. The folder name is the URL slug.
- All `.md` files are collected recursively. Nested subfolders create nested URL paths.
- Files and folders starting with `.` are ignored.
- Files with `draft: true` in frontmatter are excluded from the build.

## README.md Files as Pages

The docs system uses `README.md` as the entry file for each page. This is intentional: it mirrors how GitHub renders folder READMEs, so your content reads well both on the rendered site and when browsing the repository directly.

A simple page looks like:

```markdown
# Page Title

Your content here. The first `h1` heading is used as the page title
if no `title` frontmatter is provided.
```

## Frontmatter Options

Frontmatter is optional. When provided, it is written in YAML between `---` fences at the top of the markdown file.

```yaml
---
title: Getting Started
description: Learn how to set up your first docs site.
navLabel: Start Here
sidebarLabel: Quick Start
order: 1
draft: false
---
```

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title. Falls back to the first h1 heading, then to the slug converted to title case |
| `description` | `string` | Page description used in meta tags and sidebar |
| `navLabel` | `string` | Override the label shown in the top navigation bar for section landing pages |
| `sidebarLabel` | `string` | Override the label shown in the sidebar for this page |
| `order` | `number` | Numeric sort order within a section. Lower numbers appear first. Pages without `order` sort alphabetically after ordered pages |
| `draft` | `boolean` | When `true`, the page is excluded from the build entirely |

Additional frontmatter fields are passed through to layout components, so you can define custom fields and access them in layout overrides.

## Home Page Setup

The root `content/README.md` is rendered using the `home` layout. It supports special frontmatter fields to build a hero section and features grid without writing HTML.

```yaml
---
title: My Project
tagline: The Best Documentation Tool
description: Build beautiful docs sites with zero configuration.
actions:
  - text: Get Started
    link: /guide/getting-started
    theme: brand
  - text: View on GitHub
    link: https://github.com/example/repo
    theme: alt
features:
  - title: Fast Setup
    details: Go from zero to a published docs site in under five minutes.
  - title: Built-in Search
    details: Full-text search powered by Pagefind, no configuration needed.
  - title: Markdown First
    details: Write in markdown, get a polished site with navigation and TOC.
---

## Additional Content

Any markdown below the frontmatter is rendered in a content section below the hero and features.
```

### Hero Fields

The home layout builds the hero from frontmatter. You can either use the top-level convenience fields (`title`, `tagline`, `description`, `actions`) or provide an explicit `hero` object:

```yaml
---
hero:
  name: My Project
  text: The documentation framework
  tagline: Convention over configuration
  actions:
    - text: Quick Start
      link: /guide
      theme: brand
---
```

Each action in the `actions` array has:

- `text` -- the button label
- `link` -- the URL (internal path or external URL)
- `theme` -- visual style, either `"brand"` (primary color) or `"alt"` (secondary style)

### Features Fields

The `features` array renders a card grid below the hero:

```yaml
features:
  - title: Feature Name
    icon: "rocket symbol or emoji"
    details: A short description of the feature.
```

Each feature has `title` (required), `details` (required), and an optional `icon` string.

## Running the Dev Server

Start the development server with live reload:

```bash
npx pagesmith dev
```

The dev server defaults to port 3000. Use `--port` to change it:

```bash
npx pagesmith dev --port 8080
```

Use `--open` to automatically open the site in your default browser:

```bash
npx pagesmith dev --open
```

The dev server watches the content directory and rebuilds pages on change. A WebSocket connection triggers automatic browser reload when content is updated.

## Building for Production

Build a static site:

```bash
npx pagesmith build
```

The output goes to the configured `outDir` (default `./dist`). The build:

1. Processes all markdown files through the markdown pipeline
2. Renders each page using the appropriate layout
3. Bundles the theme CSS and runtime JavaScript
4. Copies static assets from `publicDir`
5. Runs Pagefind to generate the search index (if search is enabled)

Override the output directory or base path from the CLI:

```bash
npx pagesmith build --out-dir ./public --base-path /my-docs
```

## Previewing the Build

Preview the built site locally:

```bash
npx pagesmith preview
```

This starts a static file server pointing at the output directory. Use `--port` to change the default port (4173):

```bash
npx pagesmith preview --port 5000
```

## CLI Reference

```text
pagesmith dev [options]       Start a docs dev server
pagesmith build [options]     Build a docs site
pagesmith preview [options]   Preview the built docs site

Options:
  --port <number>             Server port (dev: 3000, preview: 4173)
  --open                      Open browser on server start
  --out-dir <path>            Output directory (overrides config)
  --base-path <path>          Base URL path prefix (overrides config)
  --config <path>             Config file path (default: pagesmith.config.json5)
```

## Package Scripts

A typical `package.json` setup:

```json
{
  "scripts": {
    "dev": "pagesmith dev",
    "build": "pagesmith build",
    "preview": "pagesmith preview"
  },
  "dependencies": {
    "@pagesmith/docs": "^0.1.0"
  }
}
```

## Search

Pagefind full-text search is enabled by default. It indexes your content during `pagesmith build` and provides a search modal triggered by `Cmd+K` / `Ctrl+K`.

To disable search:

```json5
{
  search: { enabled: false },
}
```

Search works automatically with no additional configuration. The search index is regenerated on every build.

## What to Read Next

- [Meta and Navigation](/guide/meta-and-navigation) -- control sidebar ordering, series grouping, and header links
- [Layout Overrides](/guide/layout-overrides) -- replace built-in layouts with custom components
