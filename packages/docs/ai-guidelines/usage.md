# @pagesmith/docs Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/docs`.

## Getting started

1. Install: `npm add @pagesmith/docs`
2. For repo bootstrap or retrofit work, read: `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
3. For upgrading an existing integration, read: `node_modules/@pagesmith/docs/ai-guidelines/migration.md`
4. Read the full reference: `node_modules/@pagesmith/docs/REFERENCE.md`
5. The package ships version-matched AI guidance in `ai-guidelines/` and JSON schemas in `schemas/`.

## Requirements

- Node.js 24+

## Versioning model

- The installed npm package is the versioned source of truth for AI guidance.
- Files under `node_modules/@pagesmith/docs/ai-guidelines/*` and `node_modules/@pagesmith/docs/schemas/*` match the exact installed package version.
- The hosted docs site in this repository tracks latest implementation and may be ahead of older installed versions.
- The package also exposes `agents/*` aliases that point at the same files. In docs and project memory files, prefer the explicit `ai-guidelines/*` paths so the on-disk location stays obvious.

## When to pick @pagesmith/docs

- Documentation site with defaults and conventions.
- Minimal setup with `pagesmith.config.json5`.
- Built-in nav, sidebar, and Pagefind search.

## Required integration shape

1. Configure site via `pagesmith.config.json5` when you need overrides. Zero-config also works when the repo follows the default `docs/` (or `content/`) plus `gh-pages/` conventions.
2. Keep docs content in the content directory (default: `docs/` if it exists, otherwise `content/`).
3. Keep `README.md` in the content root as docs home page.
4. Use `meta.json5` plus frontmatter for ordering and labels. Top-level folders define sections, nested markdown pages stay in their top-level section, and section sidebars stay flat.
5. Use `theme.layouts` for layout overrides (`home`, `page`, `notFound`).

## Adoption paths

- AI-first bootstrap or retrofit: start with `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- Manual setup: follow the quick start in `node_modules/@pagesmith/docs/README.md`, keeping `pagesmith.config.json5` at the repo root and pointing `contentDir` at the docs directory
- Upgrade an existing integration: start with `node_modules/@pagesmith/docs/ai-guidelines/migration.md`

## AI-first docs workflow

1. Start with project AI setup (`pagesmith init --ai` or `installAiArtifacts({ profile: 'docs' })`).
2. If the project has generated Pagesmith skills, use them to keep docs synchronized with implementation. Otherwise, paste the canonical prompt files into your agent directly:
   - `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` for setup/retrofit
   - `node_modules/@pagesmith/docs/ai-guidelines/migration.md` for upgrades
3. Keep agent outputs in the configured content directory, using folder-based `README.md` pages plus `meta.json5` ordering. When a section uses `series`, any pages not referenced by a series should remain visible under the automatic `Miscellaneous` group rather than disappearing.
4. Keep an onboarding series first in manual navigation (for example `guide/meta.json5` should start with pages like `choose-your-path`, `ai-assistants`, and `prompts-cookbook` before manual setup deep dives).

---

## Agent Prompts

Canonical copy-paste playbooks:

- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` for fresh setup or retrofitting docs into an existing repo
- `node_modules/@pagesmith/docs/ai-guidelines/migration.md` for upgrading an existing `@pagesmith/docs` integration and adopting the latest guidance/features

The prompts below cover follow-up workflows after the basic docs integration exists.

### Prompt: Initial installation and setup

> Set up docs using Pagesmith for this repository. Read `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` first and follow it exactly.

**Files to read:**
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`
- `node_modules/@pagesmith/docs/ai-guidelines/recipes.md`

### Prompt: Writing documentation pages

> Create documentation pages for this project using `@pagesmith/docs`. Read `node_modules/@pagesmith/docs/REFERENCE.md` for frontmatter fields, markdown features, and code block syntax. Each page is a folder with a `README.md`. Use proper frontmatter (`title`, `description`), fenced code blocks with language identifiers and built-in code renderer meta (titles, line highlighting, collapse), GitHub Alerts for callouts (`> [!NOTE]`, `> [!TIP]`), and mermaid code blocks for diagrams (` ```mermaid `). Keep one `# h1` per page and use sequential heading depth.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Frontmatter, Markdown Guidelines, Code block features sections)

### Prompt: Updating docs structure

> Restructure the documentation for this project. Read `node_modules/@pagesmith/docs/REFERENCE.md` for content structure conventions and `node_modules/@pagesmith/docs/ai-guidelines/recipes.md` for section management recipes. Add new sections as top-level folders under the configured content directory, create `meta.json5` for ordering, and add pages as `<slug>/README.md`. Update cross-links between pages and verify the sidebar renders correctly with `npx pagesmith dev`.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Content Structure, Section Meta sections)
- `node_modules/@pagesmith/docs/ai-guidelines/recipes.md`

### Prompt: Upgrade existing @pagesmith/docs integration

> Upgrade the existing `@pagesmith/docs` integration in this repository. Read `node_modules/@pagesmith/docs/ai-guidelines/migration.md` first and follow it exactly. Keep the current docs structure unless a schema or config problem requires a change. Refresh package guidance pointers, review new features from `changelog-notes.md`, adopt the ones that fit this repo, and verify the docs build before finishing.

**Files to read:**
- `node_modules/@pagesmith/docs/ai-guidelines/migration.md`
- `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`

### Prompt: Docs organization and meta files

> Organize the documentation navigation using `meta.json5` files. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the `meta.json5` schema — `displayName`, `items` for manual ordering, `series` for grouping, and `collapsed` for sidebar state. Top-level folders define main nav sections. Keep getting-started pages first in `items` arrays. Use `orderBy: 'manual'` and list slugs in the intended reading order.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Section Meta, Navigation sections)

### Prompt: Troubleshooting build or config errors

> Fix docs build errors in this project. Read `node_modules/@pagesmith/docs/ai-guidelines/errors.md` for the error catalog with patterns and fixes. Run `npx pagesmith build` to see all errors. Common issues: missing config file, invalid `basePath`, missing content directory, missing asset sources, missing layout files.

**Files to read:**
- `node_modules/@pagesmith/docs/ai-guidelines/errors.md`
- `node_modules/@pagesmith/docs/REFERENCE.md` (Config Validation section)

### Prompt: Layout overrides and theming

> Customize the docs layout for this project. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the layout override system — set `theme.layouts.home`, `theme.layouts.page`, or `theme.layouts.notFound` in `pagesmith.config.json5` to point to custom TSX files. Layouts use `@pagesmith/core/jsx-runtime` and receive props like `content`, `frontmatter`, `headings`, `sidebarSections`, `prev`, `next`. When search is enabled, keep `data-pagefind-body` on the content-only wrapper (usually the page `<article>` or a dedicated home-page body wrapper), not on the full shell.

### Prompt: Theme and color scheme configuration

> Configure the docs color scheme and theme. Set `theme.defaultColorScheme` to `"auto"` (OS preference), `"light"`, or `"dark"` in `pagesmith.config.json5`. Set `theme.defaultTheme` to `"paper"` (warm, low-contrast) or `"high-contrast"` (WCAG AAA). The theme toggle in the header and footer selector use the same segmented control design and let users override these defaults. User preferences persist in `localStorage('pagesmith-theme')`. CSS classes on `<html>`: `color-scheme-auto|light|dark` + `theme-paper|high-contrast`. Use `.only-light`/`.only-dark` on images for scheme-aware switching. Use `.show-on-light`/`.show-on-dark` for generic visibility helpers. The footer link area supports either a flat wrapped link row or grouped columns via `footerLinks`, and falls back to the top-level nav links when `footerLinks` is omitted. Use `copyright` for the footer legal line (`projectName`, `startYear`, `endYear?: number | null`) and `footerText` to override only the Pagesmith sign-off segment; otherwise the default sign-off renders "Made with love using Pagesmith" with a heart icon, a Pagesmith link, and an optional maintainer credit from `maintainer` or `package.json` author.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Layout Overrides, Layout Props sections)
- `node_modules/@pagesmith/docs/ai-guidelines/recipes.md`

---

## Package files reference

| File | Purpose |
|---|---|
| `node_modules/@pagesmith/docs/REFERENCE.md` | Complete config, CLI, content structure, frontmatter, markdown, layout, and deployment reference |
| `node_modules/@pagesmith/docs/README.md` | User-facing quick start and API overview |
| `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` | Canonical bootstrap/retrofit prompt for setting up docs in an existing repo |
| `node_modules/@pagesmith/docs/ai-guidelines/usage.md` | This file — agent rules and prompts |
| `node_modules/@pagesmith/docs/ai-guidelines/recipes.md` | Step-by-step recipes for common tasks |
| `node_modules/@pagesmith/docs/ai-guidelines/errors.md` | Error catalog with patterns and fixes |
| `node_modules/@pagesmith/docs/ai-guidelines/migration.md` | Upgrade playbook and copy-paste prompt for existing integrations |
| `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md` | Version highlights |
| `node_modules/@pagesmith/docs/ai-guidelines/AGENTS.md.template` | Template for consuming project AGENTS.md |
| `node_modules/@pagesmith/docs/schemas/*.schema.json` | Version-matched schemas for config, meta.json5, and docs frontmatter |
| `node_modules/@pagesmith/docs/ai-guidelines/llms.txt` | Compact AI context index |
| `node_modules/@pagesmith/docs/ai-guidelines/llms-full.txt` | Full AI context with all file pointers |

## MCP server (stdio)

`@pagesmith/docs` exposes a stdio MCP server for AI tooling:

- Command: `pagesmith mcp --stdio`
- Optional flags: `--config <path>`, `--root <path>`
- Programmatic entry: `@pagesmith/docs/mcp`

Primary MCP tools:

- `docs_validate_config`
- `docs_resolve_config`
- `docs_list_pages`
- `docs_get_page`
- `docs_search_pages`

## Non-negotiable rules

- Do not introduce custom search plugins when Pagefind is enabled.
- Keep `data-pagefind-body` scoped to the page body content, not header/sidebar/footer wrappers.
- Keep docs navigation derived from content structure and metadata.
- Keep markdown behavior aligned with Pagesmith markdown pipeline.
- Keep `pagesmith.config.json5` markdown settings JSON-safe (`allowDangerousHtml`, `math`, `shiki`). Use `@pagesmith/core` if you need function-based remark or rehype plugins.
- Maintain relative internal links across docs pages.
- Keep onboarding pages first in manual section ordering before manual setup and deep dives.

## Related package docs

- Docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Docs README: `node_modules/@pagesmith/docs/README.md`
- Core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Core README: `node_modules/@pagesmith/core/README.md`
- Core usage: `node_modules/@pagesmith/core/ai-guidelines/usage.md`

## MCP Introspection Workflows

### Validate and fix configuration

```
1. Call docs_validate_config → get config issues
2. Fix warnings (missing name/title/description)
3. Fix errors (missing directories, invalid paths)
4. Call docs_resolve_config to verify effective config
```

### Audit docs site content

```
1. Call docs_list_pages → get all pages with sections
2. Call docs_search_pages with keywords → find specific content
3. Call docs_get_page for detailed page inspection
4. Edit source files and rebuild to verify
```
