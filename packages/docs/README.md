# @pagesmith/docs

Convention-based documentation package built on the Pagesmith content + site stack. Create a full docs site from a `pagesmith.config.json5` file and a content directory — with the docs preset, built-in Pagefind search, sidebar generation, listing pages, and an optional layout override system.

Package guidance shipped inside npm (`node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/*` and `node_modules/@pagesmith/docs/schemas/*`) is version-matched to the installed package. The hosted docs site in this repository tracks the latest implementation.

## Requirements

- Node.js 24+

## Install

```bash
npm add @pagesmith/docs
```

`@pagesmith/docs` pulls in the underlying site/content pieces for you, so the default docs preset, theme, CLI flow, and shared runtime come along together.

## Quick Start

### AI-first (recommended)

If you use an agent workflow, initialize docs and assistant context together:

```bash
npx pagesmith-docs init --yes --ai
```

This scaffolds a root `pagesmith.config.json5`, a docs content directory, starter pages, and version-matched AI guidance. The generated config includes a `$schema` pointer to the installed package schema, and rerunning `pagesmith-docs init` safely backfills missing scaffold fields instead of silently skipping the config file. If your assistant supports generated Pagesmith skills, they are installed too. If you use a different agent, paste the prompt files below directly into that agent instead of relying on tool-specific slash commands.

Copy-paste playbooks:

- Fresh setup or retrofit: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
- Upgrade an existing integration: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`

If your project already has custom root `llms.txt` files, use `npx pagesmith-docs init --ai --no-llms` to skip regenerating them.

For agent-driven setup in an existing repository, use the dedicated prompt file instead of a vague install request:

- Package path: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
- Hosted URL: [https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md](https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md)

That prompt tells the agent to inspect existing docs-like folders, confirm the chosen docs directory, detect a GitHub Pages-friendly `origin` and `basePath`, prefer running `npx pagesmith-docs init` with explicit values, wire `docs:dev` / `docs:build` / `docs:preview` scripts, update `CLAUDE.md` / `AGENTS.md`, and use the version-matched schema files under `node_modules/@pagesmith/docs/schemas/`.

Typical non-interactive init flow for a GitHub repo:

```bash
npx pagesmith-docs init --yes --ai --content-dir docs --base-path /my-repo --origin https://my-user.github.io
```

If `https://my-user.github.io` redirects to a custom host, use the redirected origin. If you want docs hosted at the root instead of `/<repo-name>`, edit `pagesmith.config.json5` manually after init.
`pagesmith-docs init` also writes a `copyright` block by default, seeding `startYear` from the first git commit year when available and leaving `endYear: null` for build/browser-time year updates.

### Manual setup

Use the same layout that `pagesmith-docs init` creates by default:

```text
<repo-root>/
  pagesmith.config.json5
  docs/
    README.md
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
```

If your repository already follows those conventions, `npx pagesmith-docs dev`, `npx pagesmith-docs build`, `npx pagesmith-docs preview`, and the docs MCP can also run with no `pagesmith.config.json5` at all. In zero-config mode, Pagesmith resolves `<repo-root>/docs` as the content directory when it exists, falls back to `<repo-root>/content`, and writes the build to `<repo-root>/gh-pages`.

1. Create `pagesmith.config.json5` at the repository root:

```json5
{
  $schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
  // origin: 'https://my-user.github.io',
  // basePath: '/my-project',  // uncomment if hosting under a subdirectory
  contentDir: 'docs',
}
```

2. Add content in the configured `contentDir` (shown here as `docs/`):

```
docs/
  README.md                 Home page
  guide/
    getting-started/
      README.md             A page
    configuration/
      README.md             Another page
  reference/
    api/README.md
```

3. Run the dev server:

```bash
npx pagesmith-docs dev
```

4. Build for production:

```bash
npx pagesmith-docs build
```

For upgrade playbooks and pre-1.0 notes, see `skills/pagesmith-docs-setup/references/migration.md`.

## Playbooks

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` — copy-paste prompt for fresh setup or retrofitting docs into an existing repo
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` — copy-paste prompt for upgrading an existing `@pagesmith/docs` integration and adopting the latest guidance/features
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md` — agent operating rules plus follow-up prompts after the docs integration exists

## Content Structure

Content follows a folder convention. In the examples below, `docs/` means whatever your `contentDir` points to:

- **`docs/README.md`** — home page (renders with the `DocHome` layout)
- **Top-level folders** (`docs/guide/`, `docs/reference/`) — define the top-level docs categories shown in the header and sidebar
- **Markdown files inside a top-level folder** — become pages for that category, even when nested; nested folders keep their URL path but the section sidebar stays flat
- **`meta.json5` files** — control section ordering and series metadata; when series exist, unlisted pages fall into an automatic `Miscellaneous` group
- **Entries starting with `.` or `_`** — are ignored during docs discovery

The content directory defaults to `docs/` if it exists, otherwise `content/`.

### Frontmatter

All pages support these frontmatter fields:

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title (also used in sidebar and browser tab) |
| `description` | `string` | Meta description for SEO |
| `layout` | `string` | Per-page layout override |
| `navLabel` | `string` | Override the label shown in top navigation |
| `sidebarLabel` | `string` | Override the label shown in sidebar |
| `order` | `number` | Manual sort order within a section |
| `draft` | `boolean` | Exclude page from build when `true` |
| `chrome` | `object` | Per-page shell toggles (`header`, `sidebar`, `toc`, `footer`) |
| `socialImage` | `string` | Open Graph image path for social sharing (per-page override) |

All fields are optional. Additional custom fields are passed through to layouts.

### Home Page Frontmatter

The home page (`<contentDir>/README.md`, usually `docs/README.md`) supports additional frontmatter for the default `DocHome` layout:

```yaml
---
layout: DocHome
title: My Project
tagline: A short description
description: Full meta description
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
    details: Feature description text.
packages:
  - name: "@scope/pkg"
    description: Package description
    href: /reference/api
    tag: Core
codeExample:
  label: Example
  title: How it works
  code: |
    ```ts
    import { something } from 'my-package'
    ```
---

Markdown content below frontmatter is rendered after the structured sections.
```

The default `DocHome` layout accepts either a structured `hero` object or the flatter top-level fields shown above (`title`, `tagline`, `description`, `badge`, `actions`). The layout normalizes both shapes into the same hero UI.

| Field | Type | Description |
|---|---|---|
| `hero` | `object` | Hero section with `name`, `text`, `tagline`, `badge`, `actions` |
| `tagline` | `string` | Flat hero subtitle; normalized into the default hero when `hero` is omitted |
| `badge` | `string` | Flat hero badge; normalized into the default hero when `hero` is omitted |
| `install` | `string` | Installation command snippet shown below hero |
| `features` | `array` | Feature cards with `icon` (SVG string), `title`, `details` |
| `packages` | `array` | Package cards with `name`, `description`, `href`, `tag`, `version` |
| `codeExample` | `object` | Code example section with `label`, `title`, `code` |
| `actions` | `array` | Call-to-action buttons with `text`, `link`, `theme` (`brand` or `alt`) either at the top level or inside `hero` |

### Section Meta (`meta.json5`)

Each section can have a `meta.json5` file to control page ordering and section metadata:

```json5
{
  displayName: 'Guide',
  description: 'Getting started guides',
  items: [
    'getting-started',
    'configuration',
    'layouts',
  ],
  // Optional: group pages into series
  series: [
    {
      slug: 'basics',
      displayName: 'The Basics',
      articles: ['getting-started', 'configuration'],
    },
  ],
  // Optional: start this sidebar section collapsed
  collapsed: true,
}
```

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | Section label in sidebar and navigation |
| `description` | `string` | Section description |
| `layout` | `string` | Layout for section index page |
| `itemLayout` | `string` | Layout for pages in this section |
| `orderBy` | `'manual' \| 'publishedDate'` | Page sort order |
| `items` | `string[]` | Manual page order (slugs) |
| `series` | `array` | Group pages into named series |
| `collapsed` | `boolean` | Start sidebar section collapsed |

Pages not listed in `items` appear after listed pages. When `series` is present, any section pages not referenced by a series are collected into an automatic `Miscellaneous` group. When `orderBy` is `'publishedDate'`, pages are sorted by their `publishedDate` frontmatter field.

## Configuration (`pagesmith.config.json5`)

| Field | Type | Default | Description |
|---|---|---|---|
| `preset` | `string` | — | Explicit preset for the `pagesmith-site` CLI. Set this to `@pagesmith/docs` only when you are driving docs through `pagesmith-site`; `pagesmith-docs` already selects the docs preset. |
| `presets` | `string[]` | — | Preset list; the first item is used when `preset` is absent |
| `name` | `string` | `pkg name` | Site name (header). Falls back to package.json name. |
| `title` | `string` | `pkg name` | Browser tab title |
| `description` | `string` | `pkg desc` | Default meta description |
| `origin` | `string` | `git GitHub Pages host` / `pkg homepage` | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'docs/' or 'content/'` | Path to content directory |
| `outDir` | `string` | `'gh-pages'` | Build output directory |
| `publicDir` | `string` | `'public'` | Static assets directory |
| `basePath` | `string` | `git repo name` or `'/'` | URL base path (CLI `--base-path` wins; `BASE_URL` only overrides when it is set to a non-root value) |
| `homeLink` | `string` | `basePath` | Header logo link destination |
| `maintainer` | `object` | `package.json author` | Maintainer credit used by the default footer sign-off (`{ name, link? }`) |
| `footerLinks` | `array` | top-level nav links | Footer links rendered either as a flat link grid (`[{ label, path }]`) or grouped columns (`[{ header?, links: [...] }]`). On wide screens, the footer uses up to 4 evenly spaced columns. When omitted, the major section links from the top nav are reused. |
| `footerText` | `string` | — | Override only the Pagesmith sign-off segment in the footer's bottom legal line |
| `copyright` | `object` | — | Footer copyright config (`{ projectName?, startYear?, endYear?: number \| null }`). `endYear: null` keeps the rendered year dynamic. |
| `sidebar.collapsible` | `boolean` | `true` | Enable collapsible sidebar sections |
| `search.enabled` | `boolean` | `true` | Enable Pagefind search |
| `search.showImages` | `boolean` | `false` | Show images in search results |
| `search.showSubResults` | `boolean` | `true` | Show section-level results |
| `search.pagefindFlags` | `string[]` | `[]` | Extra CLI flags for pagefind |
| `theme.lightColor` | `string` | — | Light theme meta color |
| `theme.darkColor` | `string` | — | Dark theme meta color |
| `theme.defaultColorScheme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Default color scheme for the site shell |
| `theme.defaultTheme` | `'paper' \| 'high-contrast'` | `'paper'` | Default theme variant |
| `theme.defaultTextSize` | `'small' \| 'base' \| 'large'` | `'base'` | Default text size before user overrides are applied |
| `theme.layouts` | `Record<string, string>` | — | Layout override file paths |
| `analytics.googleAnalytics` | `string` | — | Google Analytics tracking ID |
| `editLink` | `object \| false` | auto-detected | Edit link config (`{ repo, branch?, label? }`) or `false` to disable the default git-remote detection |
| `lastUpdated` | `boolean` | `true` | Show git-based last updated timestamp on pages |
| `sitemap` | `boolean` | `true` | Generate sitemap.xml (when origin is set) |
| `theme.socialImage` | `string` | auto-detect | Default OG image for social sharing |
| `markdown` | `MarkdownConfig` | — | JSON-safe markdown config (`allowDangerousHtml`, `math`, and `shiki`) |
| `server.host` | `string` | `'127.0.0.1'` | Interface for dev/preview binding. Use `0.0.0.0` only when you intentionally want LAN exposure. |
| `packages` | `Record<string, { label }>` | — | Multi-package section labels |

### Example Configuration

```json5
{
  origin: 'https://docs.example.com',
  basePath: '/docs',
  maintainer: {
    name: 'Sujeet Jaiswal',
    link: 'https://sujeet.pro',
  },
  copyright: {
    projectName: 'Example Docs',
    startYear: 2024,
    endYear: null,
  },
  sidebar: {
    collapsible: true,
  },
  footerLinks: [
    {
      header: 'Docs',
      links: [
        { label: 'Guide', path: '/guide' },
        { label: 'API', path: '/api' },
      ],
    },
    {
      header: 'Project',
      links: [{ label: 'GitHub', path: 'https://github.com/example/repo' }],
    },
  ],
  search: {
    enabled: true,
    showSubResults: true,
  },
  editLink: {
    repo: 'https://github.com/example/repo',
  },
  lastUpdated: true,
}
```

## CLI

`@pagesmith/docs` publishes the `pagesmith-docs` binary. The package also exposes `@pagesmith/docs/preset` for integration through `pagesmith-site`, but `pagesmith-docs` is the canonical docs command.

### `pagesmith-docs dev`

Start a development server with live reload. Uses incremental rebuilds -- content changes trigger a fast content-only rebuild, while config or theme changes trigger a full rebuild. Shows a startup summary with page/section counts and clickable section URLs.

```bash
pagesmith-docs dev [--port N] [--open] [--config path] [--out-dir path] [--base-path path] [--log-level level]
```

### `pagesmith-docs build`

Build the static site for production. Pages are processed in parallel for faster builds. Outputs a build summary with page count, section count, and timing.

```bash
pagesmith-docs build [--out-dir path] [--base-path path] [--config path]
```

### `pagesmith-docs preview`

Preview the built site locally. The dev and preview servers bind to `127.0.0.1` by default; set `server.host` if you intentionally want a different interface.

```bash
pagesmith-docs preview [--port N] [--open] [--config path] [--out-dir path] [--base-path path] [--log-level level]
```

### `pagesmith-docs mcp`

Start the stdio MCP server for docs-aware AI tooling.

```bash
pagesmith-docs mcp --stdio [--config path] [--root path]
```

The MCP server exposes docs-focused tools (`docs_validate_config`, `docs_resolve_config`, `docs_list_pages`, `docs_get_page`, `docs_search_pages`) and package resources for versioned guidance (`pagesmith://docs/agents/usage`, `pagesmith://docs/llms-full`, `pagesmith://docs/reference`, `pagesmith://core/reference`).

## Auto-generated Files

The build automatically generates:

- **`.nojekyll`** — always generated for GitHub Pages compatibility
- **`sitemap.xml`** — generated when `origin` is set (disable with `sitemap: false`)
- **`robots.txt`** — generated if not already provided via `publicDir` or `assets`
- **`llms.txt`** / **`llms-full.txt`** — auto-copied from project root if present

## Layout Overrides

Override the default layouts by specifying file paths in `theme.layouts`:

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

The default docs chrome is implemented internally on top of the shared site layer, and `@pagesmith/docs` re-exports the supported layout-building pieces for docs consumers. Custom layout overrides can compose `@pagesmith/docs/components` and `@pagesmith/docs/layouts`, or replace the shell entirely.

Layout components are TSX files using `@pagesmith/docs/jsx-runtime`:

```tsx
// theme/layouts/DocPage.tsx
import { SiteDocument } from '@pagesmith/docs/components'
import { PageShell } from '@pagesmith/docs/layouts'

export default function DocPage(props) {
  const { content, frontmatter, headings, slug, site, sidebarSections } = props
  return (
    <SiteDocument title={`${frontmatter.title} — ${site.title}`} site={site}>
      <PageShell
        site={site}
        currentPath={slug}
        headings={headings}
        sidebarSections={sidebarSections}
      >
        <div class="prose" innerHTML={content} />
      </PageShell>
    </SiteDocument>
  )
}
```

### Layout Props

**All layouts** receive:

| Prop | Type | Description |
|---|---|---|
| `content` | `string` | Rendered HTML content |
| `frontmatter` | `Record<string, any>` | Page frontmatter |
| `headings` | `Heading[]` | Extracted headings (`{ depth, text, slug }`) |
| `slug` | `string` | Page slug |
| `site` | `ResolvedDocsConfig` | Full resolved site configuration |

**Page layout** additionally receives:

| Prop | Type | Description |
|---|---|---|
| `sidebarSections` | `SidebarSection[]` | Sidebar navigation structure |
| `prev` | `{ title, path } \| undefined` | Previous page link |
| `next` | `{ title, path } \| undefined` | Next page link |

**Listing layout** additionally receives:

| Prop | Type | Description |
|---|---|---|
| `listingCards` | `array` | Generated section cards for the current folder |
| `listingGroups` | `array` | Optional grouped listing sections synthesized from `meta.json5` series definitions |
| `listingTotal` | `number` | Total number of generated child pages in the current section |

**Home layout** additionally receives:

| Prop | Type | Description |
|---|---|---|
| `frontmatter.hero` | `object` | Hero section data |
| `frontmatter.features` | `array` | Feature cards |
| `frontmatter.packages` | `array` | Package cards |
| `frontmatter.install` | `string` | Install command |

### Export Resolution

Layouts are resolved in order: `default` export, then named export matching the layout name (`DocPage`, `DocHome`, `DocListing`, `DocNotFound`).

## Navigation

- **Top nav** — auto-generated from top-level content folders. Override with `headerLinks` in your content root's `meta.json5` (for example `docs/meta.json5`).
- **Sidebar** — auto-generated per top-level section as a flat page list. Nested files stay in the same section, and `series` groups plus `items` ordering come from `meta.json5`.
- **Breadcrumbs** — auto-generated from the slug path on non-home pages with depth > 1. No configuration needed.
- **Prev/next** — auto-generated from flattened sidebar items on every non-home page.
- **Footer** — renders either a flat link grid or grouped link columns. On wide screens it uses up to 4 evenly spaced columns. Uses `footerLinks` when configured, otherwise falls back to the top nav items. The bottom legal line combines `copyright` with the Pagesmith sign-off, and `footerText` overrides only the sign-off segment.

## Search

Pagefind full-text search is bundled and runs at build time. Enable with `search.enabled: true` (default). Users trigger search with `Cmd+K` / `Ctrl+K` or the search button in the header.

## Markdown Features

All markdown features from `@pagesmith/core` are available, including:

- GitHub Flavored Markdown (tables, strikethrough, task lists)
- GitHub Alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`)
- Math blocks (LaTeX via MathJax)
- Built-in Shiki-backed code rendering (dual themes, line numbers, file titles, mark/ins/del, collapse, copy button)
- Smart typography (curly quotes, em-dashes, ellipses)
- Accessible emojis
- Auto-linked headings
- External link handling (`target="_blank"`)
- Docs-specific link rewrites for relative page links under `basePath`
- Docs-specific asset publishing for page-local images and diagrams with preserved content-relative `/assets/...` paths
- Inline SVG support for `*.inline.svg` images and dark-mode inversion for image names containing `.invert.`

See the [`@pagesmith/core` README](../core/README.md) for the full markdown feature reference.

## Programmatic API

```ts
import {
  build,
  startDev,
  preview,
  defineDocsConfig,
  validateConfig,
  resolveDocsConfig,
  loadDocsConfig,
  reportConfigIssues,
  withBase,
  docsPreset,
  Html,
  buildSiteModel,
  getPrevNext,
  getSitePayload,
} from '@pagesmith/docs'

defineDocsConfig({
  name: 'My Docs',
  title: 'My Docs',
  search: { enabled: true },
})

await build({ configPath: './pagesmith.config.json5' })
await startDev({ port: 3000 })
await preview({ port: 4000 })

const config = resolveDocsConfig('./pagesmith.config.json5')
const issues = validateConfig(config)
reportConfigIssues(issues)

const userConfig = loadDocsConfig('./pagesmith.config.json5')
const url = withBase('/guide/getting-started', config.basePath)
```

## Export Map

| Import Path | Purpose |
|---|---|
| `@pagesmith/docs` | Main API (`build`, `startDev`, `preview`, `defineDocsConfig`, `validateConfig`, `resolveDocsConfig`, `loadDocsConfig`, `reportConfigIssues`, `withBase`, `docsPreset`, `Html`, `buildSiteModel`, `getPrevNext`, `getSitePayload`) |
| `@pagesmith/docs/components` | Re-exported shared chrome components for docs overrides |
| `@pagesmith/docs/layouts` | Re-exported shared layout wrappers for docs overrides |
| `@pagesmith/docs/jsx-runtime` | JSX runtime for docs layout overrides |
| `@pagesmith/docs/jsx-dev-runtime` | JSX dev runtime for docs layout overrides |
| `@pagesmith/docs/schemas` | Zod schemas for config, layout props, page data |
| `@pagesmith/docs/preset` | Docs preset for integration |
| `@pagesmith/docs/theme` | Theme/runtime export surface |
| `@pagesmith/docs/mcp` | Stdio MCP server entry (`createDocsMcpServer`, `startDocsMcpServer`) |

## Further Reading

- **[REFERENCE.md](REFERENCE.md)** — complete AI reference covering config, CLI, content structure, frontmatter, markdown pipeline, layout overrides, and GitHub Pages deployment
- **[`@pagesmith/core` README](../core/README.md)** — content layer, collections, markdown pipeline, and Vite content integrations
- **[`@pagesmith/core` REFERENCE.md](../core/REFERENCE.md)** — full core API reference for AI assistants

### AI agent guidance (shipped inside the package)

These files are available at `node_modules/@pagesmith/docs/` after installation:

| File | Purpose |
|---|---|
| `REFERENCE.md` | Full reference for config, CLI, content, markdown, layouts, deployment |
| `skills/pagesmith-docs-setup/references/setup-docs.md` | Bootstrap/retrofit prompt for setting up docs in an existing repo |
| `skills/pagesmith-docs-setup/references/docs-guidelines.md` | Docs-specific structure, navigation, and ownership rules |
| `skills/pagesmith-docs-setup/references/markdown-guidelines.md` | Markdown authoring and pipeline guidance for docs projects |
| `skills/pagesmith-docs-setup/references/usage.md` | Agent rules, integration shape, copy-paste prompts |
| `skills/pagesmith-docs-setup/references/recipes.md` | Step-by-step recipes for common tasks |
| `skills/pagesmith-docs-setup/references/errors.md` | Error catalog with patterns and fixes |
| `skills/pagesmith-docs-setup/references/migration.md` | Upgrade playbook and prompt for existing integrations |
| `schemas/*.schema.json` | Version-matched schemas for config, meta.json5, and docs frontmatter |
| `skills/pagesmith-docs-setup/references/llms.txt` | Compact AI context index |
| `skills/pagesmith-docs-setup/references/llms-full.txt` | Full AI context with all file pointers |

## License

MIT
