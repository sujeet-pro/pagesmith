# @pagesmith/docs Guidelines

Comprehensive guide for AI assistants setting up and using `@pagesmith/docs`. Follow this file to configure a documentation site and generate content using the docs package.

For markdown features, frontmatter schemas (both core and docs-specific), and content authoring rules, see `[markdown-guidelines.md](markdown-guidelines.md)`.

---

## Setup

### 1. Install

```bash
npm add @pagesmith/docs
```

`@pagesmith/docs` includes `@pagesmith/core` -- no need to install core separately.

### 2. Initialize

From the project root, create a `docs/` folder and initialize inside it:

```bash
mkdir docs && cd docs
npx pagesmith init --ai
```

This creates:

- `pagesmith.config.json5` -- minimal site configuration
- `docs/` -- starter content directory (no `meta.json5` needed)
- AI integrations (CLAUDE.md, skills, markdown guidelines) when `--ai` is passed

### 3. Configure `docs/pagesmith.config.json5`

Update the generated config to match the project:

```json5
{
  origin: 'https://your-domain.com',
  basePath: '/repo-name',
}
```

Only `basePath` is typically needed — `name`, `title`, `description`, and `origin` are auto-detected from `package.json`.

Set `outDir: '../gh-pages'` to write build output to `<repo-root>/gh-pages/`.
Set `basePath` to match your GitHub Pages deployment path (e.g. `'/repo-name'`).

#### Asset mapping (optional)

To copy files like `llms.txt` or `robots.txt` to the build output root:

```json5
{
  // ... other config
  assets: {
    "/": ["llms.txt", "llms-full.txt", "robots.txt"],
  },
}
```

Keys are output paths (`"/"` = root). Values are file/folder names relative to the config directory. Folders are copied recursively. The build validates that all referenced files exist.

### 4. Add package.json scripts

Add to the project root `package.json`:

```json
{
  "scripts": {
    "dev:docs": "cd docs && pagesmith dev",
    "build:docs": "cd docs && pagesmith build",
    "preview:docs": "cd docs && pagesmith preview"
  }
}
```

### 5. Set up GitHub Pages deployment

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

### 6. Update CLAUDE.md / AGENTS.md

If you ran `pagesmith init --ai`, the memory files are already created. Otherwise, add or merge the following into the project's `CLAUDE.md` (for Claude) or `AGENTS.md` (for Codex):

```markdown
## Documentation (@pagesmith/docs)

This project uses @pagesmith/docs for documentation.

- Config: `docs/pagesmith.config.json5`
- Content: `docs/content/` with folder-based pages
- Output: `gh-pages/` (deployed via GitHub Pages)
- `content/README.md` is the home page (uses `DocHome` layout)
- Top-level folders (`content/guide/`, `content/reference/`) become navigation sections

### Commands

- `npm run dev:docs` -- development server with hot reload
- `npm run build:docs` -- production build with Pagefind search indexing
- `npm run preview:docs` -- preview the built site

### References

- Full docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Full core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Markdown guidelines: `node_modules/@pagesmith/docs/REFERENCE.md` (Markdown section)
```

### 7. Verify the setup

```bash
npm run dev:docs
```

Open the dev server URL. Verify the home page renders, navigation works, and content is accessible.

---

## Usage

### Recommended Project Structure

```
<project-root>/
  docs/
    pagesmith.config.json5      # Site configuration
    content/
      README.md                 # Home page (DocHome layout)
      guide/
        meta.json5              # Section ordering and metadata
        getting-started/
          README.md             # A page
        configuration/
          README.md             # Another page
      reference/
        meta.json5
        api/README.md
    public/                     # Static assets (optional)
      favicon.svg               # Auto-detected as primary icon
      favicon.ico               # Auto-detected as ICO fallback (when SVG is primary)
      apple-touch-icon.png      # Auto-detected for iOS home screen (180x180 recommended)
  gh-pages/                     # Build output (git-ignored)
  .github/workflows/gh-pages.yml
```

### Configuration (`pagesmith.config.json5`)


| Field                       | Type                       | Default                 | Description                                         |
| --------------------------- | -------------------------- | ----------------------- | --------------------------------------------------- |
| `name`                      | `string`                   | pkg name                | Site name (header)                                  |
| `title`                     | `string`                   | pkg name                | Browser tab title                                   |
| `description`               | `string`                   | pkg desc                | Default meta description                            |
| `origin`                    | `string`                   | pkg homepage            | Production URL for canonical links                  |
| `language`                  | `string`                   | `'en'`                  | HTML lang attribute                                 |
| `contentDir`                | `string`                   | `'docs/' or 'content/'` | Content directory path                              |
| `outDir`                    | `string`                   | `'gh-pages'`            | Build output directory                              |
| `publicDir`                 | `string`                   | `'public'`              | Static assets directory                             |
| `basePath`                  | `string`                   | `'/'`                   | URL base path                                       |
| `homeLink`                  | `string`                   | `basePath`              | Header logo link                                    |
| `footerLinks`               | `array`                    | `[]`                    | Footer links (`{ label, path }`)                    |
| `sidebar.collapsible`       | `boolean`                  | `true`                  | Collapsible sidebar sections                        |
| `search.enabled`            | `boolean`                  | `true`                  | Pagefind search                                     |
| `theme.layouts`             | `Record`                   | --                      | Layout override paths                               |
| `analytics.googleAnalytics` | `string`                   | --                      | GA tracking ID                                      |
| `markdown`                  | `MarkdownConfig`           | --                      | Markdown pipeline config                            |
| `assets`                    | `Record<string, string[]>` | --                      | Asset mapping (output path to source files/folders) |
| `sitemap`                   | `boolean`                  | `true`                  | Auto-generate sitemap.xml                           |
| `theme.socialImage`         | `string`                   | --                      | Default OG image                                    |


### Asset Mapping

Copy specific files or folders to the build output:

```json5
{
  assets: {
    "/": ["llms.txt", "robots.txt"],     // copies to output root
    "/api": ["openapi.json"],            // copies to output/api/
  },
}
```

Source paths are relative to the config file directory. Folders are copied recursively. The build validates all referenced sources exist.

Note: `sitemap.xml`, `robots.txt`, and `.nojekyll` are auto-generated by the build. `llms.txt` and `llms-full.txt` are auto-copied from the project root when present. No `assets` mapping is needed for any of these.

### Content Structure

- Content directory defaults to `docs/` if it exists, otherwise `content/`.
- `content/README.md` -- home page (DocHome layout)
- Top-level folders -- navigation sections in sidebar
- Subfolders with `README.md` -- individual pages
- `meta.json5` files -- section ordering and metadata

### Commands

```bash
cd docs
npx pagesmith dev       # Development server
npx pagesmith build     # Production build
npx pagesmith preview   # Preview built site
```

---

## Key Rules

- `@pagesmith/docs` depends on `@pagesmith/core` -- no need to install core separately
- No `vite.config.ts` or `content.config.ts` needed -- docs uses `pagesmith.config.json5`
- Top-level folders in `content/` define the main navigation
- Pagefind search is bundled -- no separate `pagefind` dependency needed
- All markdown features from `@pagesmith/core` are available (see `[markdown-guidelines.md](markdown-guidelines.md)`)
- Config is validated at build time -- missing required fields and non-existent asset references are reported
- `name`, `title`, `description`, `origin` auto-fallback to package.json — most projects need only `basePath` in config
- Docs-specific frontmatter fields (navLabel, sidebarLabel, order, home page fields) are documented in `[markdown-guidelines.md](markdown-guidelines.md)`

---

## Full Reference

For complete documentation (frontmatter, layout overrides, section meta, programmatic API), see:

```
node_modules/@pagesmith/docs/REFERENCE.md
```

For markdown features (code blocks, alerts, math, tables), see `[markdown-guidelines.md](markdown-guidelines.md)`.