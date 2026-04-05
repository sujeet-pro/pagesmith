# @pagesmith/docs Changelog Notes

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
- Added `docs/agents/migration.md` with pre-1.0 upgrade guidance
