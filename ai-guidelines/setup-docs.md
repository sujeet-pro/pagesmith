# Setup Guide: @pagesmith/docs

Point any AI agent at this file to configure `@pagesmith/docs` on a new or existing project. Follow every step in order.

## 1. Install and Initialize

```bash
npm add @pagesmith/docs
npx pagesmith init --ai
```

This creates the config file, content directory, and AI integrations automatically. If you prefer manual setup or need to customize, follow the steps below.

`@pagesmith/docs` includes `@pagesmith/core` — no need to install core separately.

## 2. Create pagesmith.config.json5 (if not using `pagesmith init`)

Create `pagesmith.config.json5` at the project root:

```json5
{
  name: 'Project Name',
  title: 'Project Name',
  description: 'Documentation for Project Name',
  contentDir: './content',
  outDir: './dist',
  search: { enabled: true },
}
```

Adapt `name`, `title`, and `description` to the project. Add `basePath` if deploying to a subdirectory (e.g., `basePath: '/docs'`).

### Full config reference

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Site name (header logo) |
| `title` | `string` | — | Browser tab title |
| `description` | `string` | — | Default meta description |
| `origin` | `string` | — | Production URL for canonical links |
| `language` | `string` | `'en'` | HTML lang attribute |
| `contentDir` | `string` | `'content'` | Content directory path |
| `outDir` | `string` | `'dist'` | Build output directory |
| `publicDir` | `string` | `'public'` | Static assets directory |
| `basePath` | `string` | `'/'` | URL base path |
| `homeLink` | `string` | `basePath` | Header logo link |
| `footerLinks` | `array` | `[]` | Footer links (`{ label, path }`) |
| `sidebar.collapsible` | `boolean` | `false` | Collapsible sidebar sections |
| `search.enabled` | `boolean` | `true` | Pagefind search |
| `theme.layouts` | `Record` | — | Layout override paths |
| `analytics.googleAnalytics` | `string` | — | GA tracking ID |
| `markdown` | `MarkdownConfig` | — | Markdown pipeline config |

## 3. Create content directory structure

```bash
mkdir -p content/guide content/reference
```

### Home page — `content/README.md`

```md
---
layout: DocHome
title: Project Name
tagline: A short tagline describing the project
description: Documentation for Project Name
install: npm install project-name
actions:
  - text: Get Started
    link: /guide/getting-started
    theme: brand
  - text: API Reference
    link: /reference/api
    theme: alt
features:
  - title: Feature One
    details: Description of this feature.
  - title: Feature Two
    details: Description of this feature.
---

Optional markdown content below frontmatter.
```

Home frontmatter fields (all optional):

| Field | Type | Description |
|---|---|---|
| `layout` | `string` | Set to `DocHome` for home layout |
| `tagline` | `string` | Short description below title |
| `install` | `string` | Install command snippet |
| `actions` | `array` | CTA buttons (`{ text, link, theme: 'brand' \| 'alt' }`) |
| `features` | `array` | Feature cards (`{ icon?, title, details }`) |
| `packages` | `array` | Package cards (`{ name, description, href, tag }`) |
| `codeExample` | `object` | Code example (`{ label, title, code }`) |

### Section index — `content/guide/README.md`

```md
---
title: Guide
description: Learn how to use Project Name.
---

Welcome to the guide section.
```

### Section meta — `content/guide/meta.json5`

```json5
{
  displayName: 'Guide',
  description: 'Step-by-step guides for Project Name.',
  orderBy: 'manual',
  items: [
    'getting-started',
    // Add more page slugs here as you create them
  ],
}
```

Meta fields:

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | Section label in sidebar |
| `description` | `string` | Section description |
| `orderBy` | `'manual' \| 'publishedDate'` | Sort order |
| `items` | `string[]` | Manual page order (slugs) |
| `series` | `array` | Group pages into named series |
| `collapsed` | `boolean` | Start sidebar collapsed |

### Content pages

Each page is a folder with a `README.md`:

```bash
mkdir -p content/guide/getting-started
```

`content/guide/getting-started/README.md`:

```md
---
title: Getting Started
description: Learn the basics of Project Name.
---

# Getting Started

Your content here. Use sibling files for images:

![Architecture](./architecture.svg)
```

Page frontmatter fields:

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title (sidebar + browser tab) |
| `description` | `string` | Meta description |
| `navLabel` | `string` | Override top nav label |
| `sidebarLabel` | `string` | Override sidebar label |
| `order` | `number` | Manual sort order |
| `draft` | `boolean` | Exclude from build |

## 4. Add package.json scripts

```json
{
  "scripts": {
    "dev": "pagesmith dev",
    "build": "pagesmith build",
    "preview": "pagesmith preview"
  }
}
```

## 5. Add markdown guidelines to the project

Create `.pagesmith/markdown-guidelines.md` with the content from the Markdown Guidelines section below. This ensures future AI sessions know how to author content correctly.

## 6. Update CLAUDE.md / AGENTS.md

If you ran `pagesmith init --ai`, the memory files are already created. Otherwise, add or merge the following into the project's `CLAUDE.md` (for Claude) or `AGENTS.md` (for Codex):

```markdown
## Documentation (@pagesmith/docs)

This project uses @pagesmith/docs for documentation.

### Content structure

- Config: `pagesmith.config.json5`
- Content lives in `content/` with folder-based pages
- `content/README.md` is the home page (uses `DocHome` layout)
- Top-level folders (`content/guide/`, `content/reference/`) become navigation sections
- Each page is a folder with `README.md` (e.g., `content/guide/getting-started/README.md`)
- Section ordering via `meta.json5` files in each section folder
- Sibling assets (images, SVGs) live next to their page's README.md

### CLI commands

- `npx pagesmith dev` — development server with hot reload
- `npx pagesmith build` — production build with Pagefind search indexing
- `npx pagesmith preview` — preview the built site

### Markdown authoring rules

See `.pagesmith/markdown-guidelines.md` for the full markdown feature reference. Key rules:

- Use fenced code blocks with a language identifier
- One `# h1` per page
- Sequential heading depth (no skipping from h2 to h4)
- Prefer relative links for internal content
- Use GitHub alert syntax for callouts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`
- Code block features via meta string: `title="file.js"`, `showLineNumbers`, `mark={1-3}`, `ins={4}`, `del={5}`, `collapse={1-5}`

### When adding new pages

1. Create `content/<section>/<slug>/README.md` with title and description frontmatter
2. Add the slug to the section's `meta.json5` `items` array
3. Write content following the markdown guidelines
4. Run `npx pagesmith dev` to verify rendering

### When updating existing pages

1. Read the current page content
2. Preserve the frontmatter structure (title, description, etc.)
3. Follow the markdown guidelines for any new content
4. Verify heading hierarchy is sequential

### Full API Reference

For the complete @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
For the complete @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
```

## 7. Add /update-docs Claude skill (optional)

Create `.claude/commands/update-docs.md` to give Claude Code an `/update-docs` command:

```markdown
# Update Documentation

Read the project implementation (source code, README, CHANGELOG, package.json) and update the Pagesmith docs content to reflect the current state.

## Steps

1. Read `pagesmith.config.json5` to understand the docs configuration
2. Read all `meta.json5` files to understand the current content structure
3. Read the implementation source code to identify:
   - Public APIs, types, and exports
   - Configuration options
   - CLI commands and flags
   - Notable changes since last docs update
4. For each existing content page in `content/`:
   - Read the current content
   - Compare with the implementation
   - Update any outdated information
   - Add documentation for new features
   - Remove documentation for removed features
5. If new pages are needed:
   - Create the page folder and README.md with proper frontmatter
   - Add the slug to the appropriate `meta.json5` `items` array
6. Follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`
7. Verify all internal links point to existing pages

## Rules

- Preserve the existing content structure and organization
- Do not remove pages without asking first
- Keep frontmatter fields (title, description) accurate and descriptive
- Use relative links for internal cross-references
- One h1 per page, sequential heading depth
- Use code blocks with language identifiers
- Use GitHub alerts for important callouts
```

## 8. Verify the setup

```bash
npx pagesmith dev
```

Open the dev server URL. Verify:
- Home page renders with the configured title and features
- Navigation sections appear in the sidebar
- Content pages are accessible and render correctly
- Search works (after building: `npx pagesmith build && npx pagesmith preview`)

---

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

### Docs-specific content conventions

- `content/README.md` is the home page — use `layout: DocHome` frontmatter
- Top-level folders define main navigation sections
- Use `meta.json5` in each section for ordering and grouping
- Folder-based pages: `content/<section>/<slug>/README.md`
- Sibling assets (images, diagrams) go next to the page's README.md
- Use frontmatter `title` and `description` on every page
- Use `sidebarLabel` or `navLabel` to override display names
- Use `draft: true` to exclude pages from production builds
