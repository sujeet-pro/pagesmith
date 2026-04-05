# @pagesmith/core Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/core`.

## Getting started

1. Install: `npm add @pagesmith/core`
2. Read the full reference: `node_modules/@pagesmith/core/REFERENCE.md`
3. The `docs/` folder inside the package contains version-matched AI guidance files.

## When to pick @pagesmith/core

- Custom site or app architecture.
- Framework-specific rendering (React, Solid, Svelte, EJS, Handlebars).
- Need full control over layout, routing, rendering, and content loading.

## Required integration shape

1. Define collections with `defineCollection` or `defineCollections`.
2. Use `defineConfig` + `createContentLayer` for content loading.
3. For Vite flows, use `@pagesmith/core/vite` plugins (`pagesmithContent`, `pagesmithSsg`).
4. Use `entry.render()` when HTML is needed (lazy render path).

---

## Agent Prompts

Copy-paste prompts for common workflows. Each prompt tells the agent which package files to read.

### Prompt: Initial setup with Vite

> Add `@pagesmith/core` content collections to this project. Read `node_modules/@pagesmith/core/REFERENCE.md` for the full API reference and `node_modules/@pagesmith/core/docs/agents/recipes.md` for setup recipes. Install the package, create `content.config.ts` with collection definitions, configure Vite with `pagesmithContent` and `pagesmithSsg`, and update CLAUDE.md / AGENTS.md with Pagesmith pointers.

**Files to read:**
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/docs/agents/recipes.md`

### Prompt: Define content collections

> Create content collections for this project using `@pagesmith/core`. Read `node_modules/@pagesmith/core/REFERENCE.md` for `defineCollection`, `defineCollections`, schema options, loader types, computed fields, filters, and custom validators. Define Zod schemas for each collection and register them with `defineConfig`.

**Files to read:**
- `node_modules/@pagesmith/core/REFERENCE.md` (Content Layer API, Collections, Loaders, Validation sections)

### Prompt: Write markdown content

> Create markdown content for the collections defined in this project. Read `node_modules/@pagesmith/core/REFERENCE.md` for the markdown pipeline, frontmatter schemas, code block features (Expressive Code), and content validators. Use proper frontmatter, fenced code blocks with language identifiers, mermaid code blocks for diagrams, and GitHub Alerts for callouts.

**Files to read:**
- `node_modules/@pagesmith/core/REFERENCE.md` (Markdown Pipeline, Expressive Code, Frontmatter Schemas, Validators sections)

### Prompt: Troubleshooting validation errors

> Fix content validation errors in this project. Read `node_modules/@pagesmith/core/docs/agents/errors.md` for the error catalog with patterns and fixes grouped by source (schema, content, plugin, load, MCP).

**Files to read:**
- `node_modules/@pagesmith/core/docs/agents/errors.md`
- `node_modules/@pagesmith/core/REFERENCE.md` (Validation section)

---

## Package files reference

| File | Purpose |
|---|---|
| `node_modules/@pagesmith/core/REFERENCE.md` | Complete API reference: content layer, collections, loaders, markdown pipeline, JSX, CSS, Vite plugins |
| `node_modules/@pagesmith/core/README.md` | User-facing quick start, Vite integration, and API overview |
| `node_modules/@pagesmith/core/docs/agents/usage.md` | This file — agent rules and prompts |
| `node_modules/@pagesmith/core/docs/agents/recipes.md` | Step-by-step recipes for common tasks |
| `node_modules/@pagesmith/core/docs/agents/errors.md` | Error catalog with patterns and fixes |
| `node_modules/@pagesmith/core/docs/agents/migration.md` | Pre-1.0 upgrade notes |
| `node_modules/@pagesmith/core/docs/agents/changelog-notes.md` | Version highlights |
| `node_modules/@pagesmith/core/docs/agents/AGENTS.md.template` | Template for consuming project AGENTS.md |
| `node_modules/@pagesmith/core/docs/llms.txt` | Compact AI context index |
| `node_modules/@pagesmith/core/docs/llms-full.txt` | Full AI context with all file pointers |

## Non-negotiable rules

- Keep schema validation in collection schemas (`z` from `@pagesmith/core`).
- Prefer folder-based content entries if pages use sibling assets.
- Keep markdown behavior aligned with core markdown pipeline and validators.
- Do not add ad-hoc code-block copy button JS; Expressive Code already handles this.

## Related package docs

- Core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Core README: `node_modules/@pagesmith/core/README.md`
- Docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Docs README: `node_modules/@pagesmith/docs/README.md`
- Docs usage: `node_modules/@pagesmith/docs/docs/agents/usage.md`

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

