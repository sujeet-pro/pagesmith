# @pagesmith/core Changelog Notes

## v0.3.0

- Added `TypedContentLayer` for type-safe `getCollection<K>()` and `getEntry<K>()` with full Zod schema inference
- Added `layer.watch()` for file-watching with automatic cache invalidation
- Added MCP server (`@pagesmith/core/mcp`) with `core_list_collections`, `core_get_entry`, `core_validate` tools
- AI installer split into focused modules for maintainability
- AI exports removed from main barrel — use `@pagesmith/core/ai` subpath or CLI `npx pagesmith init --ai`
- Scripts converted from JavaScript to TypeScript (using `node --strip-types`)
