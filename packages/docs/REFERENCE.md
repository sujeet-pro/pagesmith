# @pagesmith/docs — AI Reference

Link this file from your project's CLAUDE.md or AGENTS.md to give AI assistants a comprehensive reference for `@pagesmith/docs`.

```markdown
<!-- In your CLAUDE.md or AGENTS.md -->
For the full @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
For the full @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
```

---

## Overview

`@pagesmith/docs` is a convention-based documentation package built on `@pagesmith/core`. Create a full docs site from a `pagesmith.config.json5` file and a content directory — with built-in Pagefind search, sidebar generation, and an optional layout override system.

`@pagesmith/docs` includes `@pagesmith/core` — no need to install core separately.

## Recommended Project Structure

```
<project-root>/
  docs/
    pagesmith.config.json5
    content/
      README.md               # Home page
      guide/
        meta.json5
        getting-started/README.md
      reference/
        meta.json5
        api/README.md
    public/                   # Static assets (optional)
  gh-pages/                   # Build output (git-ignored)
  .github/workflows/gh-pages.yml
```

## CLI Commands

```bash
pagesmith init [--ai] [--config path]   # Initialize config + content + AI integrations
pagesmith dev [--port N] [--open]        # Development server with live reload
pagesmith build [--out-dir path]         # Production build with Pagefind indexing
pagesmith preview [--port N]             # Preview built site locally
```

### pagesmith init

Creates a minimal `pagesmith.config.json5` and a starter `docs/` directory structure. Site metadata (name, description) is auto-detected from `package.json`. With `--ai`, also installs AI assistant integrations (CLAUDE.md, skills, markdown guidelines).

### Dev Server

The dev server uses incremental rebuilds for fast iteration:
- **Content changes** (markdown files) trigger a fast content-only rebuild, skipping CSS/JS bundling and Pagefind indexing.
- **Config or theme changes** trigger a full rebuild.
- Rebuild timing is logged to the console.

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
| `name` | `string` | pkg name | Site name (shown in header) |
| `title` | `string` | pkg name | Browser tab title |
| `description` | `string` | pkg desc | Default meta description |
| `origin` | `string` | pkg homepage | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'docs/' or 'content/'` | Content directory path |
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
| `theme.socialImage` | `string` | auto-detect | Default OG image for social sharing |
| `analytics.googleAnalytics` | `string` | — | Google Analytics tracking ID |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config |
| `packages` | `Record<string, { label }>` | — | Multi-package section labels |
| `editLink` | `object` | — | Edit link config (`{ repo, branch?, label? }`) |
| `editLink.repo` | `string` | — | Repository URL (e.g. `https://github.com/user/repo`) |
| `editLink.branch` | `string` | `'main'` | Branch name for edit links |
| `editLink.label` | `string` | `'Edit this page'` | Link text displayed on each page |
| `lastUpdated` | `boolean` | `false` | Show git-based last updated timestamp on pages |
| `sitemap` | `boolean` | `true` | Generate sitemap.xml (when origin is set) |
| `favicon` | `string \| false` | auto-detect | Path to favicon or `false` to disable |
| `assets` | `Record<string, string[]>` | — | Asset mapping (output path → source files/folders) |

### Config Validation

The build validates `pagesmith.config.json5` automatically:
- **Warnings**: Missing `name`, `title`, `description`, or `origin` fields (suppressed when provided by package.json)
- **Errors**: Non-existent `contentDir`, non-existent asset sources, non-existent layout files
- Errors halt the build; warnings are logged but the build continues

### Example Configuration

```json5
{
  name: 'My Docs',
  title: 'My Docs',
  description: 'Documentation for My Project',
  origin: 'https://my-org.github.io',
  contentDir: './content',
  outDir: '../gh-pages',
  basePath: '/my-project',
  sidebar: { collapsible: true },
  footerLinks: [
    { label: 'Guide', path: '/guide' },
    { label: 'API', path: '/reference/api' },
    { label: 'GitHub', path: 'https://github.com/my-org/my-project' },
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
- `script-src 'self' 'unsafe-inline'` — same-origin scripts + inline scripts (needed for Expressive Code and theme initialization)
- `style-src 'self' 'unsafe-inline'` — same-origin styles + inline styles (needed for Expressive Code syntax highlighting)
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
- Content directory defaults to `docs/` if it exists, otherwise `content/`.
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
| `socialImage` | `string` | Open Graph image for social sharing (per-page override) |

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
- **Breadcrumbs** — auto-generated from the content slug path on every non-home page with depth > 1 (e.g. `guide/getting-started/intro` shows "Guide / Getting Started / Intro"). No configuration needed.
- **Prev/next** — auto-generated from flattened sidebar items
- **Footer** — configured via `footerLinks` in config

## Search

Pagefind full-text search is bundled. Enable with `search.enabled: true` (default). Trigger with `Cmd+K` / `Ctrl+K`.

## Programmatic API

```ts
import { build, startDev, preview, defineDocsConfig, validateConfig, resolveDocsConfig } from '@pagesmith/docs'

await build({ configPath: './pagesmith.config.json5' })
await startDev({ port: 3000 })
await preview({ port: 4173 })

// Config validation
const config = resolveDocsConfig('./pagesmith.config.json5')
const issues = validateConfig(config)
```

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/docs` | Main API (build, startDev, preview, defineDocsConfig, validateConfig) |
| `@pagesmith/docs/schemas` | Zod schemas for config, layout props, page data |
| `@pagesmith/docs/preset` | Docs preset for integration |

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
          node-version: 22
      - run: npm ci
      - run: cd docs && npx pagesmith build
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

1. Create `content/<section>/<slug>/README.md` with title and description frontmatter
2. Add the slug to the section's `meta.json5` `items` array
3. Write content following the markdown guidelines below
4. Run `npx pagesmith dev` to verify rendering

## Markdown Guidelines

The markdown pipeline processes content through unified with these plugins in order:

```
remark-parse → remark-gfm → remark-math → remark-frontmatter
  → remark-github-alerts → remark-smartypants → [user remark plugins]
  → remark-rehype
  → rehype-expressive-code (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-mathjax → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → [user rehype plugins] → rehype-stringify
```

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

### Code block features (Expressive Code)

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
- Do NOT add manual copy-button JS — Expressive Code handles it
- Do NOT import separate code block CSS — styles are injected inline
- Code block themes default to `github-light` / `github-dark` with auto light/dark switching

## Build Performance

Pages are processed with bounded concurrency using `os.availableParallelism() * 2` workers, taking advantage of async parallelism while preventing memory blowup at scale.

## Key Rules

- `@pagesmith/docs` depends on `@pagesmith/core` — no need to install core separately
- No `vite.config.ts` or `content.config.ts` needed — docs uses `pagesmith.config.json5`
- Top-level folders in `content/` define the main navigation
- Pagefind search is bundled — no separate `pagefind` dependency needed
- All markdown features from `@pagesmith/core` are available
- Code block styling is inline via Expressive Code — do NOT import separate code block CSS
- Config is validated at build time — missing fields and non-existent asset references are reported
- `name`, `title`, `description`, and `origin` auto-fallback to `package.json` fields — most projects need only `basePath` in config
- Build auto-generates `.nojekyll`, `sitemap.xml`, `robots.txt`, and copies `llms.txt` if present
