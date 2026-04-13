# @pagesmith/core Changelog Notes

## v0.3.0

- Added `TypedContentLayer` for type-safe `getCollection<K>()` and `getEntry<K>()` with full Zod schema inference
- Added `layer.watch()` for file-watching with automatic cache invalidation
- Added MCP server (`@pagesmith/core/mcp`) with `core_list_collections`, `core_get_entry`, `core_validate` tools
- Added explicit MCP subpath packaging (`@pagesmith/core/mcp`) and Vite SSG helpers split into focused modules
- Refactored `@pagesmith/core/vite` into thin barrel exports with dedicated plugin modules
- Hardened MCP Zod schema introspection to use public Zod APIs (removes dependency on internal `_zod` structure)
- Optimized `getEntry()` miss-path behavior to avoid redundant collection reloads after first load
- Added `ai-guidelines/migration.md` with pre-1.0 upgrade guidance
- AI installer split into focused modules for maintainability
- AI exports removed from main barrel — use `@pagesmith/core/ai` subpath or `npx pagesmith-core ai`
- Scripts converted from JavaScript to TypeScript (using `node --strip-types`)