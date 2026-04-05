# @pagesmith/docs Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/docs`.

## Getting started

1. Install: `npm add @pagesmith/docs`
2. Read the full reference: `node_modules/@pagesmith/docs/REFERENCE.md`
3. The `docs/` folder inside the package contains version-matched AI guidance files.

## Versioning model

- The installed npm package is the versioned source of truth for AI guidance.
- Files under `node_modules/@pagesmith/docs/docs/*` match the exact installed package version.
- The hosted docs site (`content/` in this repo) tracks latest implementation and may be ahead of older installed versions.

## When to pick @pagesmith/docs

- Documentation site with defaults and conventions.
- Minimal setup with `pagesmith.config.json5`.
- Built-in nav, sidebar, and Pagefind search.

## Required integration shape

1. Configure site via `pagesmith.config.json5`.
2. Keep docs content in the content directory (default: `docs/` if it exists, otherwise `content/`).
3. Keep `README.md` in the content root as docs home page.
4. Use `meta.json5` plus frontmatter for ordering and labels.
5. Use `theme.layouts` for layout overrides (`home`, `page`, `notFound`).

## AI-first docs workflow

1. Start with project AI setup (`pagesmith init --ai` or `installAiArtifacts({ profile: 'docs' })`).
2. Use generated skills to keep docs synchronized with implementation:
   - `/update-docs` for targeted page updates
   - `/ps-update-all-docs` for full-repo docs regeneration and skill alignment
3. Keep agent outputs in the `@pagesmith/docs` structure (`content/`, folder-based `README.md`, `meta.json5` ordering).
4. Keep an onboarding series first in manual navigation (for example `guide/meta.json5` should start with pages like `choose-your-path`, `ai-assistants`, and `prompts-cookbook` before manual setup deep dives).

---

## Agent Prompts

Copy-paste prompts for common workflows. Each prompt tells the agent which package files to read.

### Prompt: Initial installation and setup

> Install `@pagesmith/docs` and set up a docs site for this project. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the full configuration reference and `node_modules/@pagesmith/docs/docs/agents/recipes.md` for the bootstrap recipe. Run `npx pagesmith init --ai`, then create a `content/` directory with a home page and an initial guide section based on the project's README. Update CLAUDE.md / AGENTS.md with Pagesmith pointers.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/docs/agents/recipes.md`

### Prompt: Writing documentation pages

> Create documentation pages for this project using `@pagesmith/docs`. Read `node_modules/@pagesmith/docs/REFERENCE.md` for frontmatter fields, markdown features, and code block syntax. Each page is a folder with a `README.md`. Use proper frontmatter (`title`, `description`), fenced code blocks with language identifiers and Expressive Code meta (titles, line highlighting, collapse), GitHub Alerts for callouts (`> [!NOTE]`, `> [!TIP]`), and mermaid code blocks for diagrams (` ```mermaid `). Keep one `# h1` per page and use sequential heading depth.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Frontmatter, Markdown Guidelines, Code block features sections)

### Prompt: Updating docs structure

> Restructure the documentation for this project. Read `node_modules/@pagesmith/docs/REFERENCE.md` for content structure conventions and `node_modules/@pagesmith/docs/docs/agents/recipes.md` for section management recipes. Add new sections as top-level folders under `content/`, create `meta.json5` for ordering, and add pages as `<slug>/README.md`. Update cross-links between pages and verify the sidebar renders correctly with `npx pagesmith dev`.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Content Structure, Section Meta sections)
- `node_modules/@pagesmith/docs/docs/agents/recipes.md`

### Prompt: Docs organization and meta files

> Organize the documentation navigation using `meta.json5` files. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the `meta.json5` schema — `displayName`, `items` for manual ordering, `series` for grouping, and `collapsed` for sidebar state. Top-level folders define main nav sections. Keep getting-started pages first in `items` arrays. Use `orderBy: 'manual'` and list slugs in the intended reading order.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Section Meta, Navigation sections)

### Prompt: Troubleshooting build or config errors

> Fix docs build errors in this project. Read `node_modules/@pagesmith/docs/docs/agents/errors.md` for the error catalog with patterns and fixes. Run `npx pagesmith build` to see all errors. Common issues: missing config file, invalid `basePath`, missing content directory, missing asset sources, missing layout files.

**Files to read:**
- `node_modules/@pagesmith/docs/docs/agents/errors.md`
- `node_modules/@pagesmith/docs/REFERENCE.md` (Config Validation section)

### Prompt: Layout overrides and theming

> Customize the docs layout for this project. Read `node_modules/@pagesmith/docs/REFERENCE.md` for the layout override system — set `theme.layouts.home`, `theme.layouts.page`, or `theme.layouts.notFound` in `pagesmith.config.json5` to point to custom TSX files. Layouts use `@pagesmith/core/jsx-runtime` and receive props like `content`, `frontmatter`, `headings`, `sidebarSections`, `prev`, `next`.

**Files to read:**
- `node_modules/@pagesmith/docs/REFERENCE.md` (Layout Overrides, Layout Props sections)
- `node_modules/@pagesmith/docs/docs/agents/recipes.md`

---

## Package files reference

| File | Purpose |
|---|---|
| `node_modules/@pagesmith/docs/REFERENCE.md` | Complete config, CLI, content structure, frontmatter, markdown, layout, and deployment reference |
| `node_modules/@pagesmith/docs/README.md` | User-facing quick start and API overview |
| `node_modules/@pagesmith/docs/docs/agents/usage.md` | This file — agent rules and prompts |
| `node_modules/@pagesmith/docs/docs/agents/recipes.md` | Step-by-step recipes for common tasks |
| `node_modules/@pagesmith/docs/docs/agents/errors.md` | Error catalog with patterns and fixes |
| `node_modules/@pagesmith/docs/docs/agents/migration.md` | Pre-1.0 upgrade notes |
| `node_modules/@pagesmith/docs/docs/agents/changelog-notes.md` | Version highlights |
| `node_modules/@pagesmith/docs/docs/agents/AGENTS.md.template` | Template for consuming project AGENTS.md |
| `node_modules/@pagesmith/docs/docs/llms.txt` | Compact AI context index |
| `node_modules/@pagesmith/docs/docs/llms-full.txt` | Full AI context with all file pointers |

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
- Keep docs navigation derived from content structure and metadata.
- Keep markdown behavior aligned with Pagesmith markdown pipeline.
- Maintain relative internal links across docs pages.
- Keep onboarding pages first in manual section ordering before manual setup and deep dives.

## Related package docs

- Docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Docs README: `node_modules/@pagesmith/docs/README.md`
- Core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Core README: `node_modules/@pagesmith/core/README.md`
- Core usage: `node_modules/@pagesmith/core/docs/agents/usage.md`

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
