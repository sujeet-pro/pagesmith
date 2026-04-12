# @pagesmith/docs Guidelines

Comprehensive guide for AI assistants setting up and using `@pagesmith/docs`.

For supported markdown features and authoring rules, also read `[markdown-guidelines.md](markdown-guidelines.md)`.

---

## Setup

### 1. Install

```bash
npm add @pagesmith/docs
```

`@pagesmith/docs` includes `@pagesmith/core` -- no separate install is required.

### 2. Keep config at the project root

Create `pagesmith.config.json5` at the repository root.

For committed project setups, explicit config is still the preferred path. When the repo already follows the default conventions, `pagesmith dev`, `build`, `preview`, and `mcp` can also run with zero config using `<repo-root>/docs` (or `<repo-root>/content` as a fallback) and `<repo-root>/gh-pages`.

When the config lives at the repository root, include:

```json5
{
  $schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
}
```

If you place the config somewhere else, keep the same installed schema target but rewrite the path relative to that config file.

Choose the docs content folder with `contentDir`:

- use `./docs` when the repository already has a docs folder
- use `./content` when the docs site is the primary content tree
- use another explicit path only when the repo structure demands it

Example root config:

```json5
{
  $schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
  name: 'Acme Docs',
  title: 'Acme Docs',
  description: 'Project documentation',
  origin: 'https://acme.github.io',
  basePath: '/acme-docs',
  contentDir: './docs',
  outDir: './gh-pages',
  search: { enabled: true },
  assets: {
    '/': ['./llms.txt', './llms-full.txt'],
    '/schemas': ['./schemas/openapi'],
  },
}
```

### 3. Add docs content

With the config at the root, content typically lives in `docs/` or `content/`:

```text
<project-root>/
  pagesmith.config.json5
  docs/
    README.md
    guide/
      meta.json5
      getting-started/
        README.md
    reference/
      api/README.md
  public/
  gh-pages/
```

Rules:

- `README.md` in the content root is the home page.
- Top-level folders become the main docs navigation.
- Markdown files inside a top-level folder become pages for that section, even when nested; section navigation stays flat.
- `meta.json5` controls section ordering and series metadata. When series exist, unlisted pages fall into an automatic `Miscellaneous` group.
- Entries starting with `.` or `_` are ignored during docs discovery.
- Frontmatter shapes should follow the version-matched files in `node_modules/@pagesmith/docs/schemas/`.

### 4. Add root package.json scripts

```json
{
  "scripts": {
    "docs:dev": "pagesmith dev",
    "docs:build": "pagesmith build",
    "docs:preview": "pagesmith preview"
  }
}
```

If the config lives somewhere else, pass `--config`, but the default convention is the root `pagesmith.config.json5`.

### 5. AI setup

Prefer:

```bash
npx pagesmith init --ai
```

This installs config/content scaffolding plus assistant memory files, skills, markdown guidelines, and optional `llms*.txt` files. It is also safe to rerun later to backfill missing scaffold fields and refresh the config `$schema` pointer.

For retrofit work in an existing repo, start with `setup-docs.md`.

---

## Usage

### Configuration rules

- Keep `pagesmith.config.json5` at the project root when you need overrides; otherwise zero-config conventions use `docs/` (or `content/`) plus `gh-pages/`.
- Resolve relative paths from the config directory.
- Use `contentDir` to point at the chosen docs folder.
- Use `basePath` without a trailing slash.
- Use `outDir: './gh-pages'` for GitHub Pages-style output unless the repo already has a stronger deployment convention.

### Asset publishing

There are three supported ways to publish extra files:

1. `publicDir` for conventional static assets.
2. `assets` for explicit file/folder passthrough to arbitrary output paths.
3. Root `llms.txt` / `llms-full.txt`, which are copied automatically when present.

Use `assets` when you want prompt files, schemas, OpenAPI files, or other machine-readable artifacts available at stable URLs.

### Preview and build behavior

- `pagesmith build` writes static HTML output.
- `pagesmith preview` serves the current output directory directly from the filesystem.
- Keep the preview server running across rebuilds; it should not require a restart after a new build.
- Canonical browser URLs should be slashless.
- Keep GitHub Pages compatibility: `.nojekyll`, root `404.html`, and direct extensionless route serving.

### Layout and theme

- Use `theme.layouts.home`, `theme.layouts.page`, and `theme.layouts.notFound` for layout overrides.
- Use `theme.defaultColorScheme` and `theme.defaultTheme` for default presentation.
- Keep `data-pagefind-body` on the content-only wrapper when customizing layouts.

### References

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/ai-guidelines/markdown-guidelines.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
