# @pagesmith/core Migration Notes (Pre-1.0)

`@pagesmith/core` is pre-1.0. Minor releases can include breaking changes while API boundaries settle.

## Upgrade checklist

1. Prefer subpath imports from the package export map:
  - `@pagesmith/core/vite`
  - `@pagesmith/core/mcp`
  - `@pagesmith/core/ssg-utils`
2. Keep Vite integration scripts aligned with current examples (`vite dev`, `vite build`) in downstream projects.
3. Re-run validation and tests after upgrade:
  - `vp check`
  - `vp test`

## Behavior updates to note

- `getEntry(collection, slug)` now short-circuits misses once a collection is loaded, avoiding redundant reload work.
- MCP schema introspection uses public Zod APIs, so custom schema wrappers should continue to use standard `zod` object/optional/nullable wrappers.
- Vite integration is organized around thin barrel exports and focused plugin modules (`content-plugin`, `ssg-plugin`).

## Related docs

- `node_modules/@pagesmith/core/docs/agents/changelog-notes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`