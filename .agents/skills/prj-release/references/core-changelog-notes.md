# @pagesmith/core Changelog Notes

## v0.9.6

- Added `imageStructureValidator` (registered in `builtinMarkdownValidators`) and exported `validateImageHtml()` for reuse. Enforces the canonical `<figure> > <picture> > <source>* + <img> + <figcaption>?` shape: no `<figure>` inside `<picture>`, exactly one `<img>` per `<picture>`, no unbalanced tags, no disallowed inner elements. Fenced code blocks and inline code are stripped from the raw-content sweep so documentation examples are not false-flagged.
- Added `requireCanonicalInternalLinks` option to `createLinkValidator` (off by default). When true, every internal page link must be authored as `./relative/path.md` (or `../x.md`, `./x/README.md`). Site-absolute `/guide/foo` and bare `./foo` / `./foo/` forms become errors. Images, `#fragment`-only, `mailto:`/`tel:`, external URLs, and URLs under configured `additionalRoots` stay exempt.
- `internalLinksMustBeMarkdown` now exempts links that resolve under registered `additionalRoots` so passthrough asset URLs (`/llms.txt`, `/prompts/*.md`, `/schemas/*.json`) no longer trip the rule.

## v0.3.0

- Added `TypedContentLayer` for type-safe `getCollection<K>()` and `getEntry<K>()` with full Zod schema inference
- Added `layer.watch()` for file-watching with automatic cache invalidation
- Added MCP server (`@pagesmith/core/mcp`) with `core_list_collections`, `core_list_entries`, `core_get_entry`, `core_validate`, and `core_search_entries` tools plus version-matched core resources
- Added explicit MCP subpath packaging (`@pagesmith/core/mcp`) and Vite SSG helpers split into focused modules
- Refactored `@pagesmith/core/vite` into thin barrel exports with dedicated plugin modules
- Hardened MCP Zod schema introspection to use public Zod APIs (removes dependency on internal `_zod` structure)
- Optimized `getEntry()` miss-path behavior to avoid redundant collection reloads after first load
- Added `skills/migration.md` with pre-1.0 upgrade guidance
- AI installer split into focused modules for maintainability
- AI exports removed from main barrel — use `@pagesmith/core/ai` subpath or `npx pagesmith-core ai`
- Scripts converted from JavaScript to TypeScript (using `node --strip-types`)
