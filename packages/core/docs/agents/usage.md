# @pagesmith/core Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/core`.

## When to pick @pagesmith/core

- Custom site or app architecture.
- Framework-specific rendering (React, Solid, Svelte, EJS, Handlebars).
- Need full control over layout, routing, rendering, and content loading.

## Required integration shape

1. Define collections with `defineCollection` or `defineCollections`.
2. Use `defineConfig` + `createContentLayer` for content loading.
3. For Vite flows, use `@pagesmith/core/vite` plugins (`pagesmithContent`, `pagesmithSsg`).
4. Use `entry.render()` when HTML is needed (lazy render path).

## Non-negotiable rules

- Keep schema validation in collection schemas (`z` from `@pagesmith/core`).
- Prefer folder-based content entries if pages use sibling assets.
- Keep markdown behavior aligned with core markdown pipeline and validators.
- Do not add ad-hoc code-block copy button JS; Expressive Code already handles this.

## Reference docs

- API reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Recipes: `node_modules/@pagesmith/core/docs/agents/recipes.md`
- Version notes: `node_modules/@pagesmith/core/docs/agents/changelog-notes.md`
- Migration notes: `node_modules/@pagesmith/core/docs/agents/migration.md`

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
