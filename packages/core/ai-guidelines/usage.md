# @pagesmith/core Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/core`.

## Getting started

1. Install: `npm add @pagesmith/core`
2. Read the full reference: `node_modules/@pagesmith/core/REFERENCE.md`
3. For fresh setup or retrofit work, start with the prompt library below.
4. For upgrades, read `node_modules/@pagesmith/core/ai-guidelines/migration.md`
5. The `ai-guidelines/` folder inside the package contains version-matched AI guidance files.

## Requirements

- Node.js 24+

## When to pick @pagesmith/core

- Custom site or app architecture.
- Framework-specific rendering (React, Solid, Svelte, EJS, Handlebars).
- Need full control over layout, routing, rendering, and content loading.

## Choose @pagesmith/core vs @pagesmith/docs

- Use `@pagesmith/core` when you want collections, markdown rendering, CSS/runtime exports, and Vite helpers inside an existing app or custom site architecture.
- Use `@pagesmith/docs` when you want a convention-based docs site with `pagesmith.config.json5`, built-in docs navigation, search, and the `pagesmith` CLI.

## Required integration shape

1. Define collections with `defineCollection` or `defineCollections`.
2. Use `defineConfig` + `createContentLayer` for content loading.
3. For Vite flows, use `@pagesmith/core/vite` plugins (`pagesmithContent`, `pagesmithSsg`).
4. Use `entry.render()` when HTML is needed (lazy render path).

## Adoption paths

- AI-first bootstrap or retrofit: use the prompt library below and `node_modules/@pagesmith/core/ai-guidelines/recipes.md`
- Manual setup: follow `node_modules/@pagesmith/core/README.md` and `node_modules/@pagesmith/core/REFERENCE.md`
- Upgrade an existing integration: start with `node_modules/@pagesmith/core/ai-guidelines/migration.md`

---

## Agent Prompts

Canonical copy-paste playbooks:

- Bootstrap or retrofit `@pagesmith/core` into an existing app
- Upgrade an existing `@pagesmith/core` integration without guessing at breaking changes

Each prompt tells the agent which package files to read.

### Prompt: Bootstrap or retrofit @pagesmith/core in an existing Vite repo

> Add `@pagesmith/core` content collections to this project. Read `node_modules/@pagesmith/core/REFERENCE.md`, `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`, and `node_modules/@pagesmith/core/ai-guidelines/recipes.md` first. Install the package, create or adapt `content.config.ts`, configure Vite with `pagesmithContent` and `...pagesmithSsg(...)`, and update `CLAUDE.md` / `AGENTS.md` with Pagesmith pointers. Reuse the repo's existing framework, routing, and rendering structure instead of scaffolding a separate docs site.

**Files to read:**
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/recipes.md`

### Prompt: Define content collections

> Create content collections for this project using `@pagesmith/core`. Read `node_modules/@pagesmith/core/REFERENCE.md` for `defineCollection`, `defineCollections`, schema options, loader types, computed fields, filters, and custom validators. Define Zod schemas for each collection and register them with `defineConfig`.

**Files to read:**
- `node_modules/@pagesmith/core/REFERENCE.md` (Content Layer API, Collections, Loaders, Validation sections)

### Prompt: Write markdown content

> Create markdown content for the collections defined in this project. Read `node_modules/@pagesmith/core/REFERENCE.md` for the markdown pipeline, frontmatter schemas, built-in code block features, and content validators. Use proper frontmatter, fenced code blocks with language identifiers, mermaid code blocks for diagrams, and GitHub Alerts for callouts.

**Files to read:**
- `node_modules/@pagesmith/core/REFERENCE.md` (Markdown Pipeline, Code Block Meta Syntax, Frontmatter Schemas, Validators sections)

### Prompt: Troubleshooting validation errors

> Fix content validation errors in this project. Read `node_modules/@pagesmith/core/ai-guidelines/errors.md` for the error catalog with patterns and fixes grouped by source (schema, content, plugin, load, MCP).

**Files to read:**
- `node_modules/@pagesmith/core/ai-guidelines/errors.md`
- `node_modules/@pagesmith/core/REFERENCE.md` (Validation section)

### Prompt: Upgrade existing @pagesmith/core integration

> Upgrade the existing `@pagesmith/core` integration in this repository. Read `node_modules/@pagesmith/core/ai-guidelines/migration.md` first and follow it exactly. Keep the current content model and folder structure unless an API or validation change requires an adjustment. Verify that Vite still uses `pagesmithContent` plus `...pagesmithSsg(...)`, that virtual module consumers expect serialized payloads (`html`, `headings`, `frontmatter` for markdown), and that project memory files still point to the version-matched package guidance.

**Files to read:**
- `node_modules/@pagesmith/core/ai-guidelines/migration.md`
- `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/recipes.md`

---

## Package files reference

| File | Purpose |
|---|---|
| `node_modules/@pagesmith/core/REFERENCE.md` | Complete API reference: content layer, collections, loaders, markdown pipeline, JSX, CSS, Vite plugins |
| `node_modules/@pagesmith/core/README.md` | User-facing quick start, Vite integration, and API overview |
| `node_modules/@pagesmith/core/ai-guidelines/usage.md` | This file — agent rules and prompts |
| `node_modules/@pagesmith/core/ai-guidelines/recipes.md` | Step-by-step recipes for common tasks |
| `node_modules/@pagesmith/core/ai-guidelines/errors.md` | Error catalog with patterns and fixes |
| `node_modules/@pagesmith/core/ai-guidelines/migration.md` | Upgrade playbook and copy-paste prompt for existing integrations |
| `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md` | Version highlights |
| `node_modules/@pagesmith/core/ai-guidelines/AGENTS.md.template` | Template for consuming project AGENTS.md |
| `node_modules/@pagesmith/core/ai-guidelines/llms.txt` | Compact AI context index |
| `node_modules/@pagesmith/core/ai-guidelines/llms-full.txt` | Full AI context with all file pointers |

## Non-negotiable rules

- Keep schema validation in collection schemas (`z` from `@pagesmith/core`).
- Prefer folder-based content entries if pages use sibling assets.
- Keep markdown behavior aligned with core markdown pipeline and validators.
- Do not add ad-hoc code-block JS inside markdown content. Load `@pagesmith/core/runtime/content` (or `getContentJS()` / `getContentJSPath()`) to enable tabs, copy, and collapsed-line interactions for Pagesmith-rendered code blocks.

## Related package docs

- Core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Core README: `node_modules/@pagesmith/core/README.md`
- Docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Docs README: `node_modules/@pagesmith/docs/README.md`
- Docs usage: `node_modules/@pagesmith/docs/ai-guidelines/usage.md`

## MCP Introspection Workflows

### Discover and validate all collections

```
1. Call core_list_collections → get all collection names and schema fields
2. For each collection, call core_validate → get validation results
3. Fix any issues found using the error catalog
```

### Find and update content

```
1. Call core_search_entries with query → find matching entries
2. Call core_get_entry with collection and slug → get full content
3. Edit the source file at the returned filePath
4. Call core_validate to confirm the change is valid
```

### Audit content quality

```
1. Call core_list_collections → enumerate all collections
2. For each, call core_list_entries → get all entries
3. Call core_validate → collect all issues
4. Group issues by source (schema/content/plugin) for prioritized fixing
```

