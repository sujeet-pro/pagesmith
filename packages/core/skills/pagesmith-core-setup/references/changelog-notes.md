# @pagesmith/core Changelog Notes

## v0.9.9 (next)

- `rehype-local-images` now stamps every figure-wrapped image with a hidden zoom button (`<button class="ps-img-zoom-btn" hidden data-ps-img-zoom-btn>`) and adds `ps-figure-zoomable` to the figure. The underlying `<img>` carries `data-zoom-src` (raster → `<stem>.zoom.webp`, SVG → original `src`); themed light/dark pairs carry `data-zoom-src-light` / `data-zoom-src-dark` plus matching `data-zoom-type-*` attrs. Linked images (`[![...](...)](url)`) skip the button entirely.
- `emitGeneratedImageVariants` emits a third file per convertible raster source — `<stem>.zoom.webp` capped at `ZOOM_MAX_WIDTH` (4800px) — and the existing `.avif` / `.webp` display variants are now capped at `DISPLAY_MAX_WIDTH` (1600px) (no upscaling). New helpers: `getZoomImageVariantPath()`, `renderZoomImageVariant()`, `DISPLAY_MAX_WIDTH`, `ZOOM_MAX_WIDTH`, `ZOOM_VARIANT_SUFFIX`.
- `renderGeneratedImageVariant` accepts an optional `{ maxWidth }` to drive the resize.

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
