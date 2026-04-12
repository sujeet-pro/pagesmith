# @pagesmith/docs Changelog Notes

## Unreleased

- Added a dedicated `ai-guidelines/setup-docs.md` bootstrap/retrofit prompt for AI agents working in existing repositories.
- Added version-matched JSON schemas under `schemas/` for `pagesmith.config.json5`, `meta.json5`, and docs frontmatter, plus hosted copies on the docs site.
- Footer links now support either a flat link grid or grouped columns with optional headers. On wide screens the footer uses up to 4 evenly spaced columns, prev/next navigation now renders between page metadata and the footer link area, and footer links still fall back to the major top-level nav links when `footerLinks` is omitted.
- The `DocHome` layout now uses the same main content-column width and inline padding as `DocPage`, so the home page and content pages stay visually aligned as sidebars appear or disappear.
- Added `copyright` config for footer legal lines, with `pagesmith init` seeding `startYear` from the first git commit year when available and leaving `endYear: null` for build/browser-time year updates.
- Default footer attribution now links to Pagesmith, can append a maintainer credit from `maintainer` or `package.json` author, and `footerText` now overrides only that sign-off segment inside the footer legal line.
- `editLink` now auto-detects from supported git remotes unless set to `false`.
- `lastUpdated` now defaults to `true`.
- Default prev/next navigation remains enabled on all non-home docs pages.

## v0.3.0

- Documentation restructured for AI/Agent-first approach
- AI setup guide moved to Getting Started series
- New pages: Agent Prompts Cookbook, MCP Server Setup
- Framework guides consolidated (React/Solid/Svelte → one page, EJS/Handlebars → one page)
- Search guide merged into docs-getting-started
- All getting-started pages now lead with agent prompt blocks
- Import map table added to core getting-started guide
- CLI port configuration support added
- Added stable `@pagesmith/docs/theme` export for theme/runtime integration
- Refactored docs config into dedicated modules (`config/types`, `config/resolve`, `config/validate`, `config/shared`)
- Refactored CLI arg parsing and server shared runtime helpers into focused modules
- Added docs MCP server package export and runtime tests for build/render/server/mcp paths
- Example app scripts now use `vite` directly for dev/build consistency
- Added `ai-guidelines/migration.md` with pre-1.0 upgrade guidance
