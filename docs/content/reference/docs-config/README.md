---
title: Docs Configuration Reference
description: Full pagesmith.config.json5 reference — site metadata, paths, base URL, theme, search, edit links, and markdown options.
---

# Docs Configuration Reference

The `@pagesmith/docs` package is configured through a `pagesmith.config.json5` file placed at the root of your documentation project. This file uses the [JSON5](https://json5.org/) format, which supports comments, trailing commas, unquoted keys, and other conveniences that make configuration files more readable.

## DocsUserConfig Type

The full TypeScript type for the configuration file is:

```ts title="DocsUserConfig"
type DocsUserConfig = {
  name?: string
  title?: string
  description?: string
  origin?: string
  language?: string
  contentDir?: string
  outDir?: string
  publicDir?: string
  basePath?: string
  homeLink?: string
  footerLinks?: Array<{ label: string; path: string }>
  sidebar?: {
    collapsible?: boolean
  }
  search?: {
    enabled?: boolean
    showImages?: boolean
    showSubResults?: boolean
    pagefindFlags?: string[]
  }
  theme?: {
    lightColor?: string
    darkColor?: string
    layouts?: Record<string, string>
    socialImage?: string
  }
  editLink?: {
    repo: string
    branch?: string
    label?: string
  }
  lastUpdated?: boolean
  sitemap?: boolean
  analytics?: {
    googleAnalytics?: string
  }
  markdown?: MarkdownConfig
  home?: {
    configFile?: string
  }
  packages?: Record<string, { label: string }>
  favicon?: string | false
  icon?: string | false
  assets?: Record<string, string[]>
  server?: {
    devPort?: number
    previewPort?: number
    strictPort?: boolean
  }
}
```

## Configuration Fields

### Site Metadata

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | package.json name &rarr; directory name | Short site name displayed in the header and used for OpenGraph `og:site_name`. Falls back to `title`, then package.json `name` (scope stripped), then directory name. |
| `title` | `string` | package.json name &rarr; directory name | Full site title used in `<title>` tags and document metadata. Falls back to `name`, then package.json `name` (scope stripped), then directory name. |
| `description` | `string` | package.json description &rarr; placeholder | Site-level description used for the default meta description and OpenGraph tags. |
| `origin` | `string` | package.json homepage &rarr; placeholder | The canonical origin URL of the site (e.g. `https://pagesmith.dev`). Used for canonical links, OpenGraph URLs, and sitemap generation. Should not include a trailing slash. |
| `language` | `string` | `"en"` | The language code set on the `<html lang>` attribute. |

### Directory Paths

| Field | Type | Default | Description |
|---|---|---|---|
| `contentDir` | `string` | `"docs/"` if exists, else `"content/"` | Path to the content directory, relative to the config file. This directory contains your markdown documentation organized in folders. Smart detection checks for a `docs/` directory first. |
| `outDir` | `string` | `"gh-pages"` | Output directory for the static build. Can be overridden by the `--out-dir` CLI flag. |
| `publicDir` | `string` | `"public"` | Directory for static files that are copied as-is to the build output (favicons, images, etc.). |

### Base Path

| Field | Type | Default | Description |
|---|---|---|---|
| `basePath` | `string` | `"/"` | Base URL path prefix for deployment under a subdirectory (e.g. `"/docs"` or `"/pagesmith"`). Trailing slashes are automatically stripped. |

The base path follows a priority resolution order:

1. `--base-path` CLI flag (highest priority)
2. `BASE_URL` environment variable
3. `basePath` in `pagesmith.config.json5`
4. Auto-detected from git remote URL (repo name as base path)
5. Default: `"/"` (root)

This resolution order allows CI/CD pipelines to override the base path without modifying the config file. For example, GitHub Pages deployments commonly set `BASE_URL` in the build environment.

### Home Link

| Field | Type | Default | Description |
|---|---|---|---|
| `homeLink` | `string` | Same as `basePath` | Override the header logo link destination. Useful when the docs site is part of a larger site and you want the logo to link to the parent site root instead of the docs root. |

### Footer Links

| Field | Type | Default | Description |
|---|---|---|---|
| `footerLinks` | `Array<{ label: string; path: string }>` | `[]` | Links displayed in the page footer. Each entry has a `label` (display text) and `path` (URL or path). External URLs are supported. |

Example:

```json5 title="pagesmith.config.json5"
footerLinks: [
  { label: 'Guide', path: '/guide' },
  { label: 'Reference', path: '/reference' },
  { label: 'GitHub', path: 'https://github.com/your-org/your-repo' },
]
```

### Sidebar Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `sidebar.collapsible` | `boolean` | `true` | Enable collapsible sidebar section groups. When true, section headings in the sidebar become toggleable, and sections can specify `collapsed: true` in their `meta.json5` to start collapsed. |

Example:

```json5 title="pagesmith.config.json5"
sidebar: {
  collapsible: true,
}
```

When collapsible sidebars are enabled, each section's `meta.json5` can control its initial state:

```json5 title="content/reference/meta.json5"
{
  displayName: "Reference",
  collapsed: true,  // Start collapsed (only when sidebar.collapsible is true)
}
```

### Search Configuration

Search is powered by [Pagefind](https://pagefind.app/), which indexes your built HTML pages for fast client-side full-text search.

| Field | Type | Default | Description |
|---|---|---|---|
| `search.enabled` | `boolean` | `true` | Enable or disable the built-in Pagefind search. When enabled, the search index is built during `pagesmith build` and the search UI (modal with `Ctrl+K` / `Cmd+K` shortcut) is included. |
| `search.showImages` | `boolean` | `false` | Whether to display page thumbnail images in search results. |
| `search.showSubResults` | `boolean` | `true` | Whether to show sub-results (individual sections within a page) in search results. When enabled, Pagefind breaks pages into sections by heading and shows matching sections as separate results. |
| `search.pagefindFlags` | `string[]` | `[]` | Extra CLI flags passed directly to the Pagefind binary during the build step. Useful for advanced configuration like custom selectors or exclusion rules. |

Example:

```json5 title="pagesmith.config.json5"
search: {
  enabled: true,
  showImages: false,
  showSubResults: true,
  pagefindFlags: ['--verbose'],
}
```

### Theme Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `theme.lightColor` | `string` | `"#f8fafc"` | The `theme-color` meta tag value for light mode. Affects the browser chrome color on mobile devices. |
| `theme.darkColor` | `string` | `"#020617"` | The `theme-color` meta tag value for dark mode. |
| `theme.layouts` | `Record<string, string>` | `{}` | A map of layout names to file paths for overriding the default theme layouts. Paths are resolved relative to the project root (the directory containing `pagesmith.config.json5`). |
| `theme.socialImage` | `string` | auto-detect | Path to default Open Graph social sharing image. Checked in order: config value, then `public/og-image.png` (or `.jpg`). Per-page override via `socialImage` frontmatter. |

The default theme provides three built-in layout keys:

| Layout Key | Default Component | Description |
|---|---|---|
| `home` | `DocHome` | Landing page with hero section and features grid |
| `page` | `DocPage` | Standard 3-column documentation page with sidebar and TOC |
| `notFound` | `DocNotFound` | 404 error page |

When overriding a layout, the module must export a component function as `default` or as one of the recognized named exports:

- `home`: `default`, `DocHome`, or `Home`
- `page`: `default`, `DocPage`, or `Page`
- `notFound`: `default`, `DocNotFound`, or `NotFound`

Custom layouts referenced in `meta.json5` section configuration (via `layout` or `itemLayout`) must also be registered in `theme.layouts`.

Example:

```json5 title="pagesmith.config.json5"
theme: {
  lightColor: '#ffffff',
  darkColor: '#0a0a0a',
  layouts: {
    home: './theme/layouts/CustomHome.tsx',
    page: './theme/layouts/CustomPage.tsx',
  },
}
```

### Edit Link

| Field | Type | Default | Description |
|---|---|---|---|
| `editLink.repo` | `string` | — | Repository URL (e.g. `"https://github.com/user/repo"`). When set, an "Edit this page" link appears on every documentation page. |
| `editLink.branch` | `string` | `"main"` | Branch name for the edit link URL. |
| `editLink.label` | `string` | `"Edit this page"` | Custom label for the edit link. |

Example:

```json5 title="pagesmith.config.json5"
editLink: {
  repo: 'https://github.com/my-org/my-project',
  branch: 'main',
},
```

The edit link generates a URL like `https://github.com/my-org/my-project/edit/main/docs/content/guide/getting-started/README.md` pointing to the source file of each page.

### Last Updated

| Field | Type | Default | Description |
|---|---|---|---|
| `lastUpdated` | `boolean` | `false` | Show a git-based "last updated" timestamp on each documentation page. Uses `git log` to determine when each content file was last modified. |

Example:

```json5 title="pagesmith.config.json5"
lastUpdated: true,
```

When enabled, each page displays a "Last updated: January 15, 2026" line below the content.

### Sitemap

| Field | Type | Default | Description |
|---|---|---|---|
| `sitemap` | `boolean` | `true` | Generate `sitemap.xml` during build. Skipped when `origin` is still the placeholder value (`https://example.com`). Set to `false` to disable. |

The sitemap is generated from all non-draft pages and placed at the build output root.

### Analytics Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `analytics.googleAnalytics` | `string` | `undefined` | Google Analytics measurement ID (e.g. `"G-XXXXXXXXXX"`). When provided, the Google Analytics script tags are automatically injected into every page. |

Example:

```json5 title="pagesmith.config.json5"
analytics: {
  googleAnalytics: 'G-ABC123DEF4',
}
```

### Markdown Configuration

The `markdown` field accepts a `MarkdownConfig` object that customizes the unified markdown processing pipeline used for all content.

| Field | Type | Default | Description |
|---|---|---|---|
| `markdown.remarkPlugins` | `any[]` | `[]` | Additional remark plugins injected into the pipeline after the built-in plugins (remark-gfm, remark-math, remark-frontmatter) and before the remark-to-rehype conversion. |
| `markdown.rehypePlugins` | `any[]` | `[]` | Additional rehype plugins injected into the pipeline after the built-in plugins (Expressive Code, rehype-mathjax, rehype-slug, rehype-autolink-headings, heading extraction) and before final HTML serialization. |
| `markdown.shiki` | `object` | `undefined` | Configuration for syntax highlighting via Expressive Code. |
| `markdown.shiki.themes` | `{ light: string; dark: string }` | `{ light: "github-light", dark: "github-dark" }` | Dual theme names for light and dark mode syntax highlighting. Any theme supported by Expressive Code is accepted. |
| `markdown.shiki.langAlias` | `Record<string, string>` | `undefined` | Map of custom language aliases to language identifiers. For example, `{ "dockerfile": "docker" }` lets you use `dockerfile` as a code block language tag. |
| `markdown.shiki.defaultShowLineNumbers` | `boolean` | `true` | Whether to show line numbers on code blocks by default. Individual blocks can override this with `showLineNumbers=false`. |

Example:

```json5 title="pagesmith.config.json5"
markdown: {
  shiki: {
    themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    langAlias: { hbs: 'handlebars' },
    defaultShowLineNumbers: false,
  },
}
```

### Home Page Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `home.configFile` | `string` | `"content/home.json5"` | Path to a JSON5 file containing home page data (hero content, feature cards, etc.). Resolved relative to the project root. The home page layout reads this file for its structured content when the home page markdown frontmatter does not provide `hero` or `features` data. |

### Packages Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `packages` | `Record<string, { label: string }>` | `undefined` | Multi-package navigation labels. Maps a section slug (matching a top-level directory in `contentDir`) to a display label. Useful for monorepo documentation sites that cover multiple packages, allowing each section to carry a distinct label in the navigation. |

Example:

```json5 title="pagesmith.config.json5"
packages: {
  core: { label: '@pagesmith/core' },
  docs: { label: '@pagesmith/docs' },
}
```

## Section-Level Configuration (meta.json5)

In addition to the root `pagesmith.config.json5`, each content section (top-level directory in `contentDir`) can have a `meta.json5` file and the content root itself can have one.

### Root meta.json5 (content/meta.json5)

Controls the root-level navigation and site-wide overrides:

```ts title="DocsRootMeta Type"
type DocsRootMeta = {
  displayName?: string
  description?: string
  headerLinks?: Array<{ label: string; path: string }>
  footerLinks?: Array<{ label: string; path: string }>
}
```

Example:

```json5 title="content/meta.json5"
{
  headerLinks: [
    { label: "Guide", path: "/guide" },
    { label: "Reference", path: "/reference" },
  ],
}
```

### Section meta.json5 (content/\<section\>/meta.json5)

Controls section-level behavior:

```ts title="DocsSectionMeta Type"
type DocsSectionMeta = {
  displayName?: string     // Section heading in sidebar
  description?: string
  layout?: string          // Layout for this section's index page
  itemLayout?: string      // Layout for items within this section
  orderBy?: 'manual' | 'publishedDate'
  collapsed?: boolean      // Start collapsed (when sidebar.collapsible is true)
  items?: string[]         // Manual ordering of items by slug
  series?: Array<{
    slug: string
    displayName: string
    shortName?: string
    description?: string
    articles: string[]
  }>
}
```

Example:

```json5 title="content/guide/meta.json5"
{
  displayName: "Guide",
  items: [
    "getting-started",
    "collections-and-loaders",
    "validation-and-rendering",
  ],
}
```

The `series` field allows grouping related articles under a named series, which is useful for multi-part tutorials or sequential learning paths.

### Auto-generated Build Files

The build automatically generates these files in the output directory:

| File | Condition | Description |
|---|---|---|
| `.nojekyll` | Always | Prevents GitHub Pages from ignoring `_`-prefixed directories (required for Pagefind). |
| `sitemap.xml` | `origin` is set and `sitemap` is not `false` | XML sitemap of all non-draft pages for search engine indexing. |
| `robots.txt` | Not already in output (from `publicDir` or `assets`) | Basic robots.txt with `Allow: /` and a `Sitemap:` reference when sitemap was generated. |

Additionally, `llms.txt` and `llms-full.txt` are automatically copied from the project root to the build output if they exist — no `assets` mapping needed.

## Complete Example

Here is a complete `pagesmith.config.json5` showing all available fields:

```json5 title="pagesmith.config.json5"
{
  // Site metadata
  name: 'My Project',
  title: 'My Project Documentation',
  description: 'Comprehensive documentation for My Project',
  origin: 'https://my-project.dev',
  language: 'en',

  // Directory paths
  contentDir: './content',
  outDir: './gh-pages',
  publicDir: './public',

  // Deployment base path
  basePath: '/my-project',

  // Header logo link override
  homeLink: '/',

  // Footer navigation
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'API', path: '/reference' },
    { label: 'GitHub', path: 'https://github.com/org/my-project' },
  ],

  // Sidebar behavior
  sidebar: {
    collapsible: true,
  },

  // Search (Pagefind)
  search: {
    enabled: true,
    showImages: false,
    showSubResults: true,
  },

  // Theme customization
  theme: {
    lightColor: '#ffffff',
    darkColor: '#111111',
    layouts: {
      home: './theme/CustomHome.tsx',
    },
    socialImage: '/og-image.png',
  },

  // Edit link on each page
  editLink: {
    repo: 'https://github.com/org/my-project',
    branch: 'main',
  },

  // Git-based last updated timestamps
  lastUpdated: true,

  // Sitemap generation
  sitemap: true,

  // Analytics
  analytics: {
    googleAnalytics: 'G-XXXXXXXXXX',
  },

  // Markdown pipeline
  markdown: {
    shiki: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },

  // Home page data source
  home: {
    configFile: './content/home.json5',
  },

  // Multi-package labels
  packages: {
    core: { label: '@pagesmith/core' },
    docs: { label: '@pagesmith/docs' },
  },
}
```

## Resolved Configuration

Internally, the user config is resolved into a `ResolvedDocsConfig` with absolute paths and applied defaults. The full resolved type is:

```ts title="ResolvedDocsConfig"
type ResolvedDocsConfig = {
  rootDir: string          // Directory containing pagesmith.config.json5
  contentDir: string       // Absolute path to content directory
  outDir: string           // Absolute path to output directory
  publicDir: string        // Absolute path to public directory
  basePath: string         // Resolved base path (no trailing slash)
  homeLink?: string        // Header logo link destination
  name: string             // Resolved site name
  title: string            // Resolved site title
  description: string      // Resolved description
  origin: string           // Resolved origin URL
  language: string         // Resolved language code
  footerLinks: FooterLink[]
  sidebar: {
    collapsible: boolean   // Defaults to true
  }
  search: {
    enabled: boolean       // Defaults to true
    showImages: boolean    // Defaults to false
    showSubResults: boolean // Defaults to true
    pagefindFlags: string[]
  }
  editLink?: { repo: string; branch: string; label: string; editPattern: string }
  lastUpdated: boolean        // Defaults to false
  sitemap: boolean            // Defaults to true
  socialImage?: string
  favicon: string | false      // Resolved favicon path (false disables)
  icon: string | false         // Resolved icon/logo path (false disables)
  appleTouchIcon: string | false
  faviconFallback: string | false
  theme?: { lightColor?: string; darkColor?: string; layouts?: Record<string, string> }
  analytics?: { googleAnalytics?: string }
  markdown?: MarkdownConfig
  homeConfigFile?: string  // Absolute path to home config JSON5
  packages?: Record<string, { label: string }>
  assets: Map<string, string[]>  // Resolved asset mappings
  server: {
    devPort: number          // Defaults to 3000
    previewPort: number      // Defaults to 4000
    strictPort: boolean      // Defaults to false
  }
}
```

The resolution logic in `resolveDocsConfig()` works as follows:

- `rootDir` is set to the directory containing `pagesmith.config.json5`.
- `contentDir`, `outDir`, and `publicDir` are resolved to absolute paths from `rootDir`.
- `basePath` follows the priority chain: CLI `--base-path` > `BASE_URL` env > config `basePath` > auto-detected from git remote (repo name) > `"/"`. Trailing slashes are stripped.
- `name` falls back to `title`, then package.json `name` (scope stripped), then directory name.
- `title` falls back to `name`, then package.json `name` (scope stripped), then directory name.
- `name`, `title`, `description`, and `origin` fall back to package.json fields before using placeholder defaults.
- `contentDir` resolves to `docs/` if the directory exists, otherwise `content/`.
- `sidebar.collapsible` defaults to `true`.
- `search.enabled` defaults to `true`, `search.showImages` defaults to `false`, `search.showSubResults` defaults to `true`.
- `homeConfigFile` resolves to the absolute path of `home.configFile` or defaults to `content/home.json5` in the project root.
