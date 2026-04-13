# @pagesmith/docs — AI Reference

Versioning note: files shipped in `node_modules/@pagesmith/docs/ai-guidelines/*` and `node_modules/@pagesmith/docs/schemas/*` match the exact installed package version. The Pagesmith docs site content in this repository reflects the latest implementation.

Link this file from your project's CLAUDE.md or AGENTS.md to give AI assistants a comprehensive reference for `@pagesmith/docs`.

```markdown
<!-- In your CLAUDE.md or AGENTS.md -->
For the full @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
For the full @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
```

---

## Overview

`@pagesmith/docs` is a convention-based documentation package built on `@pagesmith/core` and `@pagesmith/site`. Create a full docs site from a `pagesmith.config.json5` file and a content directory — with the docs preset, built-in Pagefind search, sidebar generation, listing pages, and an optional layout override system.

`@pagesmith/docs` includes both `@pagesmith/core` and `@pagesmith/site` — no separate install is required for the default docs flow.

## Requirements

- Node.js 24+

## Setup Prompt And Schemas

For agent-driven setup in an existing repository, start with the dedicated prompt file:

- Package path: `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- Hosted URL: [https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md](https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md)

Version-matched schema files are available under `node_modules/@pagesmith/docs/schemas/` and hosted under [https://projects.sujeet.pro/pagesmith/schemas/](https://projects.sujeet.pro/pagesmith/schemas/):

- `pagesmith-config.schema.json`
- `docs-root-meta.schema.json`
- `docs-section-meta.schema.json`
- `docs-page-frontmatter.schema.json`
- `docs-home-frontmatter.schema.json`

For GitHub repositories, prefer a GitHub Pages-style default when bootstrapping docs:

- `origin`: probe `https://<owner>.github.io` and use the resolved origin if it redirects
- `basePath`: default to `/<repo-name>`
- If you want root-hosted docs instead, edit `pagesmith.config.json5` manually after init

## Adoption Playbooks

- Bootstrap or retrofit docs in an existing repo: `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- Upgrade an existing docs integration and adopt the latest guidance/features: `node_modules/@pagesmith/docs/ai-guidelines/migration.md`
- Follow the manual path in `node_modules/@pagesmith/docs/README.md` when you want to wire the same structure without delegating the work to an agent

## Recommended Project Structure

This is the default layout that `pagesmith-docs init` creates. Keep `pagesmith.config.json5` at the repository root and point `contentDir` at the docs directory:

```
<project-root>/
  pagesmith.config.json5
  docs/
    README.md                 # Home page
    guide/
      meta.json5
      README.md
      getting-started/README.md
      configuration/README.md
    reference/
      meta.json5
      README.md
      overview/README.md
      api/README.md
  public/                     # Static assets (optional)
  gh-pages/                   # Build output (git-ignored)
  .github/workflows/gh-pages.yml
```

If your repository already follows those conventions, `pagesmith-docs dev`, `pagesmith-docs build`, `pagesmith-docs preview`, and `pagesmith-docs mcp --stdio` also work with no `pagesmith.config.json5` at all. Zero-config resolution uses `<repo-root>/docs` when it exists, falls back to `<repo-root>/content`, and writes output to `<repo-root>/gh-pages`.

Alternate layouts are still supported through `--config` and `contentDir`, but the root-config layout above should be the default story for both agents and manual setup.

## CLI Commands

`@pagesmith/docs` publishes the `pagesmith-docs` binary. The package also exposes `@pagesmith/docs/preset` for integration through `pagesmith-site`, but `pagesmith-docs` is the canonical docs command.

```bash
pagesmith-docs init [--ai] [--no-llms] [--config path]   # Initialize config + content + AI integrations
pagesmith-docs dev [--port N] [--open]                   # Development server with live reload
pagesmith-docs build [--out-dir path]                    # Production build with Pagefind indexing
pagesmith-docs preview [--port N]                        # Preview built site locally
pagesmith-docs mcp --stdio [--config path]               # Start stdio MCP server for docs tooling
```

### pagesmith-docs init

Creates a minimal `pagesmith.config.json5` and a starter `docs/` directory structure. The generated config includes a `$schema` pointer to the installed package schema, and rerunning `pagesmith-docs init` safely backfills missing scaffold fields instead of skipping the config file. Init defaults are derived from the repository name, git remote, and existing config values when present. With `--ai`, also installs AI assistant integrations (CLAUDE.md, skills, markdown guidelines). Add `--no-llms` to skip writing `llms.txt` and `llms-full.txt` when the project already maintains its own LLM files.
The generated config includes a `copyright` block by default, using the first git commit year when it can be detected and leaving `endYear: null` so the browser can advance the rendered year when needed.

When a GitHub remote is present, `pagesmith-docs init` defaults to GitHub Pages-style values:

- repo name -> `basePath: "/<repo-name>"`
- `https://<owner>.github.io` -> `origin`, following redirects when possible
- root hosting is a manual edit after init

### Dev Server

The dev server uses incremental rebuilds for fast iteration:
- **Content changes** (markdown files) trigger a fast content-only rebuild, skipping CSS/JS bundling and Pagefind indexing.
- **Config or theme changes** trigger a full rebuild.
- Rebuild timing is logged to the console.

### Shared CLI Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--port <number>` | number | 3000/4000 | Server port (dev/preview) |
| `--config <path>` | string | `pagesmith.config.json5` | Config file path |
| `--open` | boolean | `false` | Open browser on start |
| `--out-dir <path>` | string | Config `outDir` | Override output directory |
| `--base-path <path>` | string | Config `basePath` | Override URL base path |

Useful `init` flags for non-interactive setup:

| Option | Type | Description |
|---|---|---|
| `--yes` | boolean | Accept detected defaults without prompting |
| `--name <value>` | string | Override detected project name |
| `--title <value>` | string | Override detected site title |
| `--origin <url>` | string | Override detected site origin |
| `--base-path <path>` | string | Override detected GitHub Pages-style base path |
| `--content-dir <path>` | string | Choose docs content directory |
| `--search` / `--no-search` | boolean | Enable or disable built-in search |
| `--starter-content` / `--no-starter-content` | boolean | Create or skip starter docs pages |
| `--ai` | boolean | Install AI artifacts during init |
| `--no-llms` | boolean | Skip root `llms.txt` / `llms-full.txt` generation |

## Configuration (pagesmith.config.json5)

When the config file is committed, keep `$schema` pointing at the installed version-matched schema file: `./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json` from the repo root, or the equivalent relative path for custom config locations.

| Field | Type | Default | Description |
|---|---|---|---|
| `preset` | `string` | `@pagesmith/docs` | Explicit preset for the `pagesmith-site` CLI |
| `presets` | `string[]` | — | Preset list; the first item is used when `preset` is absent |
| `name` | `string` | pkg name | Site name (shown in header) |
| `title` | `string` | pkg name | Browser tab title |
| `description` | `string` | pkg desc | Default meta description |
| `origin` | `string` | git GitHub Pages host / pkg homepage | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'docs/' or 'content/'` | Content directory path. The same defaults apply in zero-config mode when the config file is omitted entirely. |
| `outDir` | `string` | `'gh-pages'` | Build output directory |
| `publicDir` | `string` | `'public'` | Static assets directory |
| `basePath` | `string` | git repo name or `'/'` | URL base path (CLI `--base-path` wins; `BASE_URL` only overrides when it is set to a non-root value) |
| `homeLink` | `string` | `basePath` | Header logo link destination |
| `maintainer` | `object` | package.json author | Maintainer credit used by the default footer sign-off (`{ name, link? }`) |
| `footerLinks` | `array` | top-level nav links | Footer links rendered either as a flat link grid (`[{ label, path }]`) or grouped columns (`[{ header?, links: [...] }]`). On wide screens, the footer uses up to 4 evenly spaced columns. When omitted, the major section links from the top nav are reused. |
| `footerText` | `string` | — | Override only the Pagesmith sign-off segment in the footer's bottom legal line |
| `copyright` | `object` | — | Footer copyright config (`{ projectName?, startYear?, endYear?: number \| null }`). Leave `endYear` as `null` or omit it to render the build year and let the browser advance it later. |
| `sidebar.collapsible` | `boolean` | `true` | Enable collapsible sidebar sections |
| `search.enabled` | `boolean` | `true` | Enable Pagefind search |
| `search.showImages` | `boolean` | `false` | Show images in search results |
| `search.showSubResults` | `boolean` | `true` | Show section-level results |
| `search.pagefindFlags` | `string[]` | `[]` | Extra CLI flags for pagefind |
| `theme.lightColor` | `string` | — | Light theme meta color |
| `theme.darkColor` | `string` | — | Dark theme meta color |
| `theme.defaultColorScheme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Default color scheme (auto follows OS) |
| `theme.defaultTheme` | `'paper' \| 'high-contrast'` | `'paper'` | Default theme variant |
| `theme.defaultTextSize` | `'small' \| 'base' \| 'large'` | `'base'` | Default text size before user overrides are applied |
| `theme.layouts` | `Record<string, string>` | — | Layout override file paths |
| `theme.socialImage` | `string` | auto-detect | Default OG image for social sharing |
| `analytics.googleAnalytics` | `string` | — | Google Analytics tracking ID |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config |
| `packages` | `Record<string, { label }>` | — | Multi-package section labels |
| `editLink` | `object \| false` | auto-detected | Edit link config (`{ repo, branch?, label? }`) or `false` to disable the default git-remote detection |
| `editLink.repo` | `string` | auto-detected | Repository URL (e.g. `https://github.com/user/repo`) |
| `editLink.branch` | `string` | `'main'` | Branch name for edit links |
| `editLink.label` | `string` | `'Edit this page'` | Link text displayed on each page |
| `lastUpdated` | `boolean` | `true` | Show git-based last updated timestamp on pages |
| `sitemap` | `boolean` | `true` | Generate sitemap.xml (when origin is set) |
| `favicon` | `string \| false` | auto-detect | Path to favicon or `false` to disable |
| `assets` | `Record<string, string[]>` | — | Asset mapping (output path → source files/folders) |
| `home.configFile` | `string` | `content/home.json5` | Path to home page configuration file |
| `icon` | `string \| false` | auto-generated | SVG string or path for header logo icon. Set to `false` to disable |
| `server.host` | `string` | `'127.0.0.1'` | Interface to bind the dev and preview servers to. Use `0.0.0.0` only when you intentionally want LAN exposure. |
| `server.devPort` | `number` | `3000` | Default port for the dev server |
| `server.previewPort` | `number` | `4000` | Default port for the preview server |
| `server.strictPort` | `boolean` | `false` | Fail if port is in use instead of finding next available |

### Config Validation

The build validates `pagesmith.config.json5` automatically:
- **Warnings**: Missing `name`, `title`, `description`, or `origin` fields (suppressed when provided by package.json)
- **Errors**: Invalid config field types, unsupported markdown config keys, non-existent `contentDir`, non-existent asset sources, non-existent layout files
- Errors halt the build; warnings are logged but the build continues

### Example Configuration

```json5
{
  $schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
  name: 'My Docs',
  title: 'My Docs',
  description: 'Documentation for My Project',
  origin: 'https://my-org.github.io',
  contentDir: './content',
  outDir: '../gh-pages',
  basePath: '/my-project',
  maintainer: {
    name: 'Sujeet Jaiswal',
    link: 'https://sujeet.pro',
  },
  copyright: {
    projectName: 'My Docs',
    startYear: 2024,
    endYear: null,
  },
  sidebar: { collapsible: true },
  footerLinks: [
    {
      header: 'Docs',
      links: [
        { label: 'Guide', path: '/guide' },
        { label: 'API', path: '/reference/api' },
      ],
    },
    {
      header: 'Project',
      links: [{ label: 'GitHub', path: 'https://github.com/my-org/my-project' }],
    },
  ],
  search: { enabled: true },
  editLink: {
    repo: 'https://github.com/my-org/my-project',
    branch: 'main',
    label: 'Edit this page',
  },
  lastUpdated: true,
  assets: {
    "/": ["llms.txt"],
  },
}
```

## Asset Mapping

Copy specific files or folders to the build output:

```json5
{
  assets: {
    "/": ["llms.txt", "llms-full.txt", "robots.txt"],  // copies to output root
    "/api": ["openapi.json"],                            // copies to output/api/
    "/downloads": ["releases"],                          // copies releases/ folder recursively
  },
}
```

Source paths are relative to the config file directory. Folders are copied recursively. All sources are validated at build time — non-existent files cause a build error.

This is useful for hosting `llms.txt` files, `robots.txt`, API specs, or any static files alongside the documentation.

### Auto-generated Build Files

The build automatically generates these files:

- **`.nojekyll`** — always generated for GitHub Pages
- **`sitemap.xml`** — when `origin` is set and `sitemap` is not `false`
- **`robots.txt`** — when not already provided
- **`llms.txt`** / **`llms-full.txt`** — auto-copied from project root if present

## Icons

The favicon is auto-detected from `public/favicon.svg`, then `public/favicon.ico`, then a bundled default. Set `favicon` in config to override, or `false` to disable.

Additional icon files are auto-detected from the `public/` directory:

| File | HTML Output | Purpose |
|---|---|---|
| `public/favicon.svg` | `<link rel="icon" type="image/svg+xml">` | Primary favicon (SVG) |
| `public/favicon.ico` | `<link rel="icon" sizes="32x32">` | ICO fallback (rendered when SVG is primary) |
| `public/apple-touch-icon.png` | `<link rel="apple-touch-icon">` | iOS home screen icon (180x180 recommended) |

When the primary favicon is SVG and an ICO file also exists, both are linked — modern browsers use the SVG while older browsers fall back to ICO. The apple-touch-icon is always auto-detected independently of the favicon setting.

## Security Defaults

All generated pages include security-hardened meta tags by default:

**Content Security Policy** — `<meta http-equiv="Content-Security-Policy">` with a restrictive self-only policy:
- `default-src 'self'` — only load resources from the same origin
- `script-src 'self' 'unsafe-inline'` — same-origin scripts + inline scripts (needed for theme initialization and the built-in code renderer's copy/collapse runtime)
- `style-src 'self' 'unsafe-inline'` — same-origin styles + inline styles (needed for Shiki token colors and theme initialization)
- `img-src 'self' data:` — same-origin images + data URIs
- `font-src 'self'` — same-origin fonts only
- `connect-src 'self'` — same-origin fetch/XHR (covers Pagefind search)
- `object-src 'none'` — blocks all plugin content
- `base-uri 'self'` — prevents base tag injection
- `form-action 'self'` — restricts form submissions

When `analytics.googleAnalytics` is configured, the CSP automatically adds Google Analytics domains to `script-src` and `connect-src`.

**Referrer Policy** — `<meta name="referrer" content="strict-origin-when-cross-origin">` sends the origin (not the full URL path) on cross-origin requests and the full referrer for same-origin requests.

To customize CSP beyond these defaults, override the page layout via `theme.layouts`.

## Performance Defaults

All generated pages include performance optimizations:

- **Font preload** — `<link rel="preload">` for Open Sans (body font) as `font/woff2` with CORS, eliminating the font discovery delay
- **Font display swap** — `font-display: swap` on all font faces for instant text rendering with fallback fonts
- **GA preconnect** — when `analytics.googleAnalytics` is configured, `<link rel="preconnect">` to `googletagmanager.com` for earlier connection establishment
- **Deferred scripts** — all JavaScript loaded with `defer` for non-blocking parsing

## Content Structure

In the example below, `content/` means whatever your `contentDir` points to.

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

- `<contentDir>/README.md` — home page (renders with `DocHome` layout)
- Content directory defaults to `docs/` if it exists, otherwise `content/`.
- Top-level folders — define the main docs categories shown in the header and sidebar
- Markdown files inside a top-level folder — become pages for that category, even when nested; nested folders keep their URL path but section navigation stays flat
- `meta.json5` — controls section ordering and series metadata. When series are present, unlisted pages fall into an automatic `Miscellaneous` group.
- Entries starting with `.` or `_` — are ignored during docs discovery

## Frontmatter

### Page Frontmatter

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title (sidebar + browser tab) |
| `description` | `string` | Meta description for SEO |
| `layout` | `string` | Per-page layout override |
| `navLabel` | `string` | Override label in top navigation |
| `sidebarLabel` | `string` | Override label in sidebar |
| `order` | `number` | Manual sort order within section |
| `draft` | `boolean` | Exclude page from build when `true` |
| `chrome` | `object` | Per-page shell toggles (`header`, `sidebar`, `toc`, `footer`) |
| `socialImage` | `string` | Open Graph image for social sharing (per-page override) |

### Home Page Frontmatter

| Field | Type | Description |
|---|---|---|
| `layout` | `string` | Built-in layouts include `home`, `page`, `listing`, and `notFound` |
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
When `series` is present, pages not referenced by any series are collected into an automatic `Miscellaneous` group.

## Layout Overrides

Override default layouts via `theme.layouts`:

```json5
{
  theme: {
    layouts: {
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
      listing: './theme/layouts/DocListing.tsx',
      notFound: './theme/layouts/DocNotFound.tsx',
    },
  },
}
```

### Layout Props

**All layouts** receive: `content`, `frontmatter`, `headings`, `slug`, `site`.

**Page layout** additionally: `sidebarSections`, `prev`, `next`.

**Listing layout** additionally: `listingCards`, `listingGroups`, `listingTotal`.

**Home layout** additionally: `frontmatter.hero`, `frontmatter.features`, `frontmatter.packages`, `frontmatter.install`.

Layouts use `@pagesmith/site/jsx-runtime`:

```tsx
import { Fragment } from '@pagesmith/site/jsx-runtime'

export default function DocPage(props) {
  const { content, frontmatter, headings, slug, site, sidebarSections, prev, next } = props
  return (
    <html lang={site.language}>
      <head><title>{frontmatter.title} — {site.title}</title></head>
      <body>
        <main>
          <article data-pagefind-body="">
            <div class="prose" innerHTML={content} />
          </article>
        </main>
      </body>
    </html>
  )
}
```

## Navigation

- **Top nav** — auto-generated from top-level content folders; override with `headerLinks` in your content root's `meta.json5` (for example `docs/meta.json5`)
- **Sidebar** — auto-generated per top-level section as a flat page list. Nested files stay in the same section, and `series` groups plus `items` ordering come from `meta.json5`.
- **Breadcrumbs** — auto-generated from the content slug path on every non-home page with depth > 1 (e.g. `guide/getting-started/intro` shows "Guide / Getting Started / Intro"). No configuration needed.
- **Prev/next** — auto-generated from flattened sidebar items on every non-home page
- **Footer** — renders either a flat link grid or grouped link columns. On wide screens it uses up to 4 evenly spaced columns. Uses `footerLinks` when configured, otherwise falls back to the top nav items. The bottom legal line combines `copyright` with the Pagesmith sign-off, and `footerText` overrides only the sign-off segment.

## Search

Pagefind full-text search is bundled. Enable with `search.enabled: true` (default). Trigger with `Cmd+K` / `Ctrl+K`. When overriding layouts, put `data-pagefind-body` on the content-only wrapper, ideally the page `<article>` or a dedicated home-page body wrapper, rather than the full shell that includes navigation or footer chrome.

## Programmatic API

```ts
import {
  build, startDev, preview, defineDocsConfig, validateConfig,
  resolveDocsConfig, loadDocsConfig, reportConfigIssues, withBase,
  docsPreset, Html, buildSiteModel, getPrevNext, getSitePayload,
} from '@pagesmith/docs'

await build({ configPath: './pagesmith.config.json5' })
await startDev({ port: 3000 })
await preview({ port: 4000 })

// Config validation
const config = resolveDocsConfig('./pagesmith.config.json5')
const issues = validateConfig(config)
reportConfigIssues(issues)

// Load raw user config (without resolution)
const userConfig = loadDocsConfig('./pagesmith.config.json5')

// URL helper
const url = withBase('/guide/getting-started', config.basePath)
```

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/docs` | Main API (build, startDev, preview, defineDocsConfig, validateConfig, resolveDocsConfig, loadDocsConfig, reportConfigIssues, withBase, docsPreset, Html, buildSiteModel, getPrevNext, getSitePayload) |
| `@pagesmith/docs/schemas` | Zod schemas for config, layout props, page data |
| `@pagesmith/docs/preset` | Docs preset for Vite integration (`docsPreset`) |
| `@pagesmith/docs/theme` | Theme/runtime export surface (`Html`) |
| `@pagesmith/docs/mcp` | Stdio MCP server entry (`createDocsMcpServer`, `startDocsMcpServer`) |

## GitHub Pages Deployment

Create `.github/workflows/gh-pages.yml`:

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm ci
      - run: npx pagesmith-docs build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: gh-pages

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## When Adding New Pages

1. Create `<contentDir>/<section>/<slug>/README.md` with title and description frontmatter
2. Add the slug to the section's `meta.json5` `items` array
3. Write content following the markdown guidelines below
4. Run `npx pagesmith-docs dev` to verify rendering

## Markdown Guidelines

The markdown pipeline processes content through unified with these plugins in order:

```
remark-parse → remark-gfm → remark-frontmatter
  → remark-github-alerts → remark-smartypants
  → remark-math (when `markdown.math` is `true` or `'auto'` detects math markers)
  → lang-alias transform → remark-rehype
  → rehype-mathjax (when math is enabled, before the built-in code renderer)
  → applyPagesmithCodeRenderer (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → docs link/asset transforms → rehype-stringify
```

In `pagesmith.config.json5`, the `markdown` field is intentionally JSON-safe:

- `allowDangerousHtml?: boolean`
- `math?: boolean | 'auto'`
- `shiki.themes`, `shiki.langAlias`, `shiki.defaultShowLineNumbers`

Function-based `remarkPlugins` and `rehypePlugins` remain available through the lower-level `@pagesmith/core` APIs, not through the JSON5 docs config.

### Supported features

| Feature | Syntax | Notes |
|---|---|---|
| GFM tables | `\| col \| col \|` | Alignment via `:---`, `:---:`, `---:` |
| Strikethrough | `~~text~~` | |
| Task lists | `- [x] done` / `- [ ] todo` | |
| Footnotes | `[^id]` + `[^id]: text` | |
| Alerts | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` | GitHub-compatible |
| Inline math | `$E = mc^2$` | No spaces inside delimiters |
| Block math | `$$...$$` | Rendered via MathJax |
| Smart quotes | `"text"` → curly quotes | Automatic |
| Em dash | `---` | Automatic |
| External links | `[text](https://...)` | Auto `target="_blank"` |
| Heading anchors | Auto `id` + wrapped anchor | All headings |
| Accessible emoji | Unicode emoji | Auto `role="img"` + `aria-label` |

### Code block features (Built-in renderer)

| Meta | Example | Description |
|---|---|---|
| `title="..."` | `` ```js title="app.js" `` | File title |
| `showLineNumbers` | `` ```js showLineNumbers `` | Line numbers |
| `mark={lines}` | `` ```js mark={3,5-7} `` | Highlight lines |
| `ins={lines}` | `` ```js ins={4} `` | Inserted lines (green) |
| `del={lines}` | `` ```js del={5} `` | Deleted lines (red) |
| `collapse={lines}` | `` ```js collapse={1-5} `` | Collapsible section |
| `wrap` | `` ```js wrap `` | Text wrapping |
| `frame="..."` | `` ```js frame="terminal" `` | Frame style |

### Key rules

- Always use a language identifier on fenced code blocks
- One `# h1` per page — validators enforce this
- Sequential heading depth — no jumping from h2 to h4
- Prefer relative links for internal content
- Do NOT add manual copy-button JS inside markdown content — the built-in renderer injects its own copy/collapse runtime
- Do NOT omit the shared Pagesmith CSS bundles — code block chrome and tabs depend on them
- Code block themes default to `github-light` / `github-dark` with auto light/dark switching

## Build Performance

Pages are processed with bounded concurrency using `os.availableParallelism() * 2` workers, taking advantage of async parallelism while preventing memory blowup at scale.

## Key Rules

- `@pagesmith/docs` depends on `@pagesmith/core` — no need to install core separately
- No `vite.config.ts` or `content.config.ts` needed — docs uses `pagesmith.config.json5`
- Top-level folders in your content directory define the main navigation
- Pagefind search is bundled — no separate `pagefind` dependency needed
- All markdown features from `@pagesmith/core` are available
- Code block styling ships in the shared Pagesmith CSS bundles — include the normal docs/theme CSS so rendered markdown code blocks look correct
- Config is validated at build time — missing fields and non-existent asset references are reported
- `name`, `title`, `description`, and `origin` auto-fallback to `package.json` fields — most projects need only `basePath` in config
- Build auto-generates `.nojekyll`, `sitemap.xml`, `robots.txt`, and copies `llms.txt` if present

## Related Docs

- **Setup prompt:** `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- **Agent prompts and rules:** `node_modules/@pagesmith/docs/ai-guidelines/usage.md`
- **Step-by-step recipes:** `node_modules/@pagesmith/docs/ai-guidelines/recipes.md`
- **Error catalog:** `node_modules/@pagesmith/docs/ai-guidelines/errors.md`
- **JSON schemas:** `node_modules/@pagesmith/docs/schemas/*.schema.json`
- **User README:** `node_modules/@pagesmith/docs/README.md`
- **Core package reference:** `node_modules/@pagesmith/core/REFERENCE.md`
- **Core package README:** `node_modules/@pagesmith/core/README.md`
