# @pagesmith/core Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/core`.

## Getting Started

1. Install: `npm add @pagesmith/core`
2. For repo bootstrap or retrofit work, read: `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`
3. Read the full reference: `node_modules/@pagesmith/core/REFERENCE.md`
4. For site-building on top of core, also read `node_modules/@pagesmith/site/REFERENCE.md`
5. For upgrades, read `node_modules/@pagesmith/core/ai-guidelines/migration.md`

## When To Pick `@pagesmith/core`

- Custom content models
- Headless content loading and validation
- Direct markdown processing
- Framework-specific rendering where you want full control over the site shell

## Choose `@pagesmith/core` vs `@pagesmith/site` vs `@pagesmith/docs`

- Use `@pagesmith/core` for collections, schemas, loaders, validation, markdown, assets helpers, and `pagesmithContent`.
- Use `@pagesmith/site` for JSX, CSS/runtime bundles, Vite SSG, shared site helpers, and the `pagesmith-site` CLI.
- Use `@pagesmith/docs` for the docs preset when docs consumers should stay on one package.

## Supported Integration Shapes

1. Define collections with `defineCollection` or `defineCollections`.
2. Use `defineConfig` + `createContentLayer` for direct content loading.
3. For Vite flows, use `pagesmithContent` from `@pagesmith/core/vite`.
4. If the project needs shared markdown CSS/runtime, the Pagesmith JSX runtime, or SSG helpers, add `@pagesmith/site`.

## Agent Prompts

### Prompt: Add the core content layer

> Add `@pagesmith/core` content collections to this project. Read `node_modules/@pagesmith/core/ai-guidelines/setup-core.md`, `node_modules/@pagesmith/core/REFERENCE.md`, `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`, and `node_modules/@pagesmith/core/ai-guidelines/recipes.md` first. Keep the work focused on the content layer: collection definitions, validation, markdown rendering, and either direct `createContentLayer()` usage or `pagesmithContent` for Vite. If the project also needs Pagesmith's JSX runtime, CSS/runtime bundles, or SSG helpers, use `@pagesmith/site` for those pieces.

### Prompt: Add core to an existing framework app

> Integrate `@pagesmith/core` into this existing framework app without handing site-building over to Pagesmith. Read `node_modules/@pagesmith/core/REFERENCE.md` first. Define collections, load content with `createContentLayer()`, render markdown with `entry.render()`, and wire the returned HTML into the app's existing route/layout system. If the app wants Pagesmith's shipped prose or code-block UI, add `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content`.

### Prompt: Define collections

> Create content collections for this project using `@pagesmith/core`. Read `node_modules/@pagesmith/core/REFERENCE.md` for `defineCollection`, `defineCollections`, schema options, loader types, computed fields, filters, and validators. Keep the collection layer framework-agnostic.

### Prompt: Upgrade existing core integration

> Upgrade the existing `@pagesmith/core` integration in this repository. Read `node_modules/@pagesmith/core/ai-guidelines/migration.md` first. Keep content-model changes minimal. Verify that `pagesmithContent` still comes from `@pagesmith/core/vite`, and move any JSX, CSS/runtime, or SSG imports to `@pagesmith/site`.

## Package Files Reference

| File | Purpose |
| --- | --- |
| `node_modules/@pagesmith/core/ai-guidelines/setup-core.md` | Canonical bootstrap/retrofit prompt for `@pagesmith/core` |
| `node_modules/@pagesmith/core/REFERENCE.md` | Complete content-layer reference |
| `node_modules/@pagesmith/core/README.md` | Quick start and package overview |
| `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md` | Package responsibilities and rules |
| `node_modules/@pagesmith/core/ai-guidelines/markdown-guidelines.md` | Markdown pipeline, code-block features, and authoring rules |
| `node_modules/@pagesmith/core/ai-guidelines/usage.md` | This file |
| `node_modules/@pagesmith/core/ai-guidelines/recipes.md` | Common content-layer recipes |
| `node_modules/@pagesmith/core/ai-guidelines/errors.md` | Error catalog |
| `node_modules/@pagesmith/core/ai-guidelines/migration.md` | Upgrade notes |
| `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md` | Version highlights |
| `node_modules/@pagesmith/core/ai-guidelines/AGENTS.md.template` | Template for project-level AGENTS.md memory |
| `node_modules/@pagesmith/core/ai-guidelines/llms.txt` | Compact AI context index |
| `node_modules/@pagesmith/core/ai-guidelines/llms-full.txt` | Full AI context |

## Non-negotiable Rules

- Keep schema validation in `@pagesmith/core`
- Prefer folder-based content entries if pages use sibling assets
- Keep site-facing imports in `@pagesmith/site`
- Do not document `pagesmithSsg`, JSX runtime, CSS bundles, or runtime JS as core-owned APIs

## Related Package Docs

- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/ai-guidelines/usage.md`

## MCP Server

The core MCP server (`@pagesmith/core/mcp`) is useful when an agent needs to inspect an installed content layer without re-implementing collection traversal:

- Programmatic entry: `@pagesmith/core/mcp`
- Run it through a small project-local wrapper that creates a `ContentLayer` and then calls `startCoreMcpServer({ layer })`

Primary MCP tools:

- `core_list_collections`
- `core_list_entries`
- `core_get_entry`
- `core_validate`
- `core_search_entries`

Version-matched MCP resources:

- `pagesmith://core/agents/usage`
- `pagesmith://core/llms-full`
- `pagesmith://core/reference`
