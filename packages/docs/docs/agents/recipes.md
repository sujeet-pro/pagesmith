# @pagesmith/docs Agent Recipes

## Bootstrap a docs site

1. Install `@pagesmith/docs`.
2. Run `pagesmith init` in the docs workspace.
3. Confirm `pagesmith.config.json5` and `content/README.md` exist.
4. Add first sections under `content/guide/` and `content/reference/`.

## Add a new section

1. Create section folder under `content/`.
2. Add section `meta.json5` for order and labels when needed.
3. Add pages as folder-based entries with `README.md`.
4. Update cross-links and verify navigation order.

## Apply layout overrides

1. Add layout files in your theme directory.
2. Map them through `theme.layouts.home`, `theme.layouts.page`, `theme.layouts.notFound`.
3. Keep props contract compatible with docs package expectations.

## Update AI pointers in consuming project

Add one pointer line to root `CLAUDE.md` or `AGENTS.md`:

`Use node_modules/@pagesmith/docs/docs/agents/usage.md as the canonical @pagesmith/docs guide.`

## Connect MCP for docs-aware AI workflows

1. Register command: `pagesmith mcp --stdio`.
2. Keep config at the default `pagesmith.config.json5` or pass `--config`.
3. Use `docs_list_pages` and `docs_get_page` to drive docs updates from current content structure.

## Full repo docs refresh

Use this when implementation changed across multiple packages or when docs/skills drifted.

1. Run project AI install with docs profile so generated skills exist.
2. Run `/ps-update-all-docs` to scan code, docs, and skills together.
3. Ensure `guide/meta.json5` keeps `getting-started` first in manual order.
4. Regenerate `llms.txt` / `llms-full.txt` and verify memory pointers still reference package usage docs.
