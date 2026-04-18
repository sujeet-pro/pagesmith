# @pagesmith/docs Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/docs`.

## Getting started

1. Install: `npm add @pagesmith/docs`
2. For repo bootstrap or retrofit work, read: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
3. For upgrading an existing integration, read: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`
4. For docs authoring, organization, and diagram workflow, read: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
5. For supported markdown syntax and diagram embedding rules, read: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
6. Read the full reference: `node_modules/@pagesmith/docs/REFERENCE.md`
7. The package ships version-matched AI guidance in `skills/` and JSON schemas in `schemas/`.

## Requirements

- Node.js 24+

## Versioning model

- The installed npm package is the versioned source of truth for AI guidance.
- Files under `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/*` and `node_modules/@pagesmith/docs/schemas/*` match the exact installed package version.
- The hosted docs site in this repository tracks latest implementation and may be ahead of older installed versions.
- The package also exposes `agents/*` aliases that point at the same files. In docs and project memory files, prefer the explicit `skills/*` paths so the on-disk location stays obvious.

## When to pick @pagesmith/docs

- Documentation site with defaults and conventions.
- Minimal setup with `pagesmith.config.json5`.
- Built-in nav, sidebar, and Pagefind search.

## Required integration shape

1. Configure site via `pagesmith.config.json5` when you need overrides. Zero-config also works when the repo follows the default `docs/` (or `content/`) plus `gh-pages/` conventions. For committed configs, keep `$schema` pointing at the installed package file in `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json` using a path relative to the config file.
2. Keep docs content in the content directory (default: `docs/` if it exists, otherwise `content/`).
3. Keep `README.md` in the content root as docs home page.
4. Use `meta.json5` plus frontmatter for ordering and labels. Top-level folders define sections, nested markdown pages stay in their top-level section, and section sidebars stay flat.
5. Use `theme.layouts` for layout overrides (`home`, `page`, `listing`, `notFound`), and prefer `@pagesmith/docs/components` plus `@pagesmith/docs/layouts` when you want the stock Pagesmith chrome without copying the docs package internals.

## Adoption paths

- AI-first bootstrap or retrofit: start with `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
- Manual setup: follow the quick start in `node_modules/@pagesmith/docs/README.md`, keeping `pagesmith.config.json5` at the repo root, pointing `contentDir` at the docs directory, and adding `$schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json'`
- Upgrade an existing integration: start with `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`

## AI-first docs workflow

1. Start with project AI setup (`pagesmith-docs init --ai` or `installAiArtifacts({ profile: 'docs' })`).
2. Before writing or restructuring docs, read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` and `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`.
3. If the project has generated Pagesmith skills, use them to keep docs synchronized with implementation. Otherwise, paste the canonical prompt files into your agent directly:
   - `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` for setup/retrofit
   - `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` for upgrades
4. Keep agent outputs in the configured content directory, using folder-based `README.md` pages plus `meta.json5` ordering. When a section uses `series`, any pages not referenced by a series should remain visible under the automatic `Miscellaneous` group rather than disappearing.
5. Keep an onboarding series first in manual navigation (for example `guide/meta.json5` should start with pages like `choose-your-path`, `ai-assistants`, and `prompts-cookbook` before manual setup deep dives).
6. When a page explains architecture, flow, lifecycle, or dependencies better visually, create a diagram asset using the guidance in `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` instead of relying on raw diagram fences to render inline.

---

## Agent Prompts

Canonical copy-paste playbooks:

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` for fresh setup or retrofitting docs into an existing repo
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` for upgrading an existing `@pagesmith/docs` integration and adopting the latest guidance/features

The prompts below cover follow-up workflows after the basic docs integration exists.

### Prompt: Initial installation and setup

> Set up docs using Pagesmith for this repository. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` first and follow it exactly. Ensure `pagesmith.config.json5` includes a `$schema` entry that points at the installed `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json` file.

**Files to read:**

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/recipes.md`

### Prompt: Writing documentation pages

> Create documentation pages for this project using `@pagesmith/docs`. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` and `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` first, then use `node_modules/@pagesmith/docs/REFERENCE.md` for exact frontmatter and layout details. Each page should be a folder with a `README.md`. Use proper frontmatter (`title`, `description`), fenced code blocks with language identifiers and built-in code renderer meta (titles, line highlighting, collapse), and GitHub Alerts for important callouts. When a flow, architecture, lifecycle, or dependency graph would be clearer visually, create a diagram asset instead of relying on raw diagram fences. Choose Mermaid for text-first flows, Excalidraw for architecture sketches, draw.io for precise infrastructure or BPMN, and Graphviz for dependency graphs. Keep the editable source plus rendered light/dark SVGs with the page, embed the rendered assets with `.only-light` / `.only-dark` when needed, and keep one `# h1` per page with sequential heading depth.

**Files to read:**

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
- `node_modules/@pagesmith/docs/REFERENCE.md` (Frontmatter, Markdown Guidelines, Code block features sections)

### Prompt: Adding or updating documentation diagrams

> Improve the documentation for this project by adding or refreshing diagrams where they make the page easier to understand. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` and `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` first. Decide whether the page needs a flowchart, architecture overview, topology diagram, or dependency graph. Choose Mermaid for text-first flows, Excalidraw for architecture sketches, draw.io for precise infrastructure or BPMN, and Graphviz for dependency graphs or existing `.dot` assets. Keep the editable source file plus rendered assets in a `diagrams/` folder beside the page, render light and dark variants when needed, embed the rendered assets in the page, and do not assume raw diagram fences render inline in stock `@pagesmith/docs`.

**Files to read:**

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
- `node_modules/@pagesmith/docs/REFERENCE.md` (Content Structure, Theming sections)

### Prompt: Updating docs structure

> Restructure the documentation for this project. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` for authoring and organization rules, `node_modules/@pagesmith/docs/REFERENCE.md` for content structure conventions, and `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/recipes.md` for section management recipes. Add new sections as top-level folders under the configured content directory, create `meta.json5` for ordering, add pages as `<slug>/README.md`, and keep any page-local `diagrams/` or asset folders with the page when moving content. Update cross-links between pages and verify the sidebar renders correctly with `npx pagesmith-docs dev`.

**Files to read:**

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
- `node_modules/@pagesmith/docs/REFERENCE.md` (Content Structure, Section Meta sections)
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/recipes.md`

### Prompt: Upgrade existing @pagesmith/docs integration

> Upgrade the existing `@pagesmith/docs` integration in this repository. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` first and follow it exactly. Keep the current docs structure unless a schema or config problem requires a change. Refresh package guidance pointers, review new features from `changelog-notes.md`, adopt the ones that fit this repo, and verify the docs build before finishing.

**Files to read:**

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/changelog-notes.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`

### Prompt: Docs organization and meta files

> Organize the documentation navigation using `meta.json5` files. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the `meta.json5` schema — `displayName`, `items` for manual ordering, `series` for grouping, and `collapsed` for sidebar state. Top-level folders define main nav sections. Keep getting-started pages first in `items` arrays. Use `orderBy: 'manual'` and list slugs in the intended reading order.

**Files to read:**

- `node_modules/@pagesmith/docs/REFERENCE.md` (Section Meta, Navigation sections)

### Prompt: Troubleshooting build or config errors

> Fix docs build errors in this project. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/errors.md` for the error catalog with patterns and fixes. Run `npx pagesmith-docs build` to see all errors. Common issues: missing config file, invalid `basePath`, missing content directory, missing asset sources, missing layout files.

**Files to read:**

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/errors.md`
- `node_modules/@pagesmith/docs/REFERENCE.md` (Config Validation section)

### Prompt: Layout overrides and theming

> Customize the docs layout for this project. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the layout override system — set `theme.layouts.home`, `theme.layouts.page`, `theme.layouts.listing`, or `theme.layouts.notFound` in `pagesmith.config.json5` to point to custom TSX files. Layouts use `@pagesmith/docs/jsx-runtime` and can compose `@pagesmith/docs/components` plus `@pagesmith/docs/layouts` instead of reimplementing the docs chrome. They receive props like `content`, `frontmatter`, `headings`, `sidebarSections`, `prev`, `next`, plus `listingCards`, `listingGroups`, and `listingTotal` for listing layouts. When search is enabled, keep `data-pagefind-body` on the content-only wrapper (usually the page `<article>` or a dedicated home-page body wrapper), not on the full shell.

### Prompt: Theme and color scheme configuration

> Configure the docs color scheme and theme. Set `theme.defaultColorScheme` to `"auto"` (OS preference), `"light"`, or `"dark"` in `pagesmith.config.json5`. Set `theme.defaultTheme` to `"paper"` (warm, low-contrast) or `"high-contrast"` (WCAG AAA). Set `theme.defaultTextSize` to `"small"`, `"base"`, or `"large"` when the site should start with a non-default reading scale. The theme toggle in the header and footer selector use the same segmented control design and let users override these defaults. User preferences persist in `localStorage('pagesmith-theme')`. CSS classes on `<html>`: `color-scheme-auto|light|dark` + `theme-paper|high-contrast`, plus `data-text-size` when a non-base size is active. Use `.only-light`/`.only-dark` on images for scheme-aware switching. Use `.show-on-light`/`.show-on-dark` for generic visibility helpers. The footer link area supports either a flat wrapped link row or grouped columns via `footerLinks`, and falls back to the top-level nav links when `footerLinks` is omitted. Use `copyright` for the footer legal line (`projectName`, `startYear`, `endYear?: number | null`) and `footerText` to override only the Pagesmith sign-off segment; otherwise the default sign-off renders "Made with love using Pagesmith" with a heart icon, a Pagesmith link, and an optional maintainer credit from `maintainer` or `package.json` author.

**Files to read:**

- `node_modules/@pagesmith/docs/REFERENCE.md` (Layout Overrides, Layout Props sections)
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/recipes.md`

---

## Package files reference

| File                                                                                         | Purpose                                                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `node_modules/@pagesmith/docs/REFERENCE.md`                                                  | Complete config, CLI, content structure, frontmatter, markdown, layout, and deployment reference |
| `node_modules/@pagesmith/docs/README.md`                                                     | User-facing quick start and API overview                                                         |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`          | Canonical bootstrap/retrofit prompt for setting up docs in an existing repo                      |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`     | AI-first docs writing, organization, built-in docs features, and diagram workflow                |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` | Supported markdown syntax, code block features, and diagram embedding rules                      |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md`               | This file — agent rules and prompts                                                              |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/recipes.md`             | Step-by-step recipes for common tasks                                                            |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/errors.md`              | Error catalog with patterns and fixes                                                            |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`           | Upgrade playbook and copy-paste prompt for existing integrations                                 |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/changelog-notes.md`     | Version highlights                                                                               |
| `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/AGENTS.md.template`     | Template for consuming project AGENTS.md                                                         |
| `node_modules/@pagesmith/docs/schemas/*.schema.json`                                         | Version-matched schemas for config, meta.json5, and docs frontmatter                             |
| `node_modules/@pagesmith/docs/llms.txt`                                                      | Compact AI context index                                                                         |
| `node_modules/@pagesmith/docs/llms-full.txt`                                                 | Full AI context with all file pointers                                                           |

## MCP server (stdio)

`@pagesmith/docs` exposes a stdio MCP server for AI tooling:

- Command: `pagesmith-docs mcp --stdio`
- Optional flags: `--config <path>`, `--root <path>`
- Programmatic entry: `@pagesmith/docs/mcp`

Primary MCP tools:

- `docs_validate_config`
- `docs_resolve_config`
- `docs_list_pages`
- `docs_get_page`
- `docs_search_pages`

Version-matched MCP resources:

- `pagesmith://docs/agents/usage`
- `pagesmith://docs/llms-full`
- `pagesmith://docs/reference`
- `pagesmith://core/reference`

## Non-negotiable rules

- Do not introduce custom search plugins when Pagefind is enabled.
- Keep `data-pagefind-body` scoped to the page body content, not header/sidebar/footer wrappers.
- Keep docs navigation derived from content structure and metadata.
- Keep markdown behavior aligned with Pagesmith markdown pipeline.
- Do not assume raw `mermaid`, `dot`, `excalidraw`, or `drawio` fences render as diagrams in stock `@pagesmith/docs`; they are code examples unless the project explicitly adds a renderer.
- Keep `pagesmith.config.json5` markdown settings JSON-safe (`allowDangerousHtml`, `math`, `shiki`). Use `@pagesmith/core` if you need function-based remark or rehype plugins.
- Maintain relative internal links across docs pages.
- Keep onboarding pages first in manual section ordering before manual setup and deep dives.
- When a diagram materially improves comprehension, keep both the editable source file and the rendered assets versioned with the page.

## Related package docs

- Docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Docs README: `node_modules/@pagesmith/docs/README.md`
- Core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Core README: `node_modules/@pagesmith/core/README.md`
- Core usage: `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`

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
