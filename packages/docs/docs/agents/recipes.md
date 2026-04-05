# @pagesmith/docs Agent Recipes

Short procedural recipes for common docs workflows. For the full reference, see `node_modules/@pagesmith/docs/REFERENCE.md`.

## Bootstrap a docs site

1. Install `@pagesmith/docs`.
2. Run `npx pagesmith init --ai` in the docs workspace.
3. Confirm `pagesmith.config.json5` and `content/README.md` exist.
4. Add first sections under `content/guide/` and `content/reference/`.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (Recommended Project Structure, CLI Commands)

## Add a new section

1. Create section folder under `content/`.
2. Add section `meta.json5` for order and labels when needed.
3. Add pages as folder-based entries with `README.md`.
4. Update cross-links and verify navigation order.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (Content Structure, Section Meta)

## Write a documentation page

1. Create `content/<section>/<slug>/README.md`.
2. Add frontmatter with at least `title` and `description`.
3. Use one `# h1` heading per page and sequential heading depth.
4. Use fenced code blocks with language identifiers and Expressive Code meta for titles, line numbers, and highlighting.
5. Use GitHub Alerts for callouts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`.
6. For diagrams, use mermaid code blocks (` ```mermaid `).
7. Add the slug to the section's `meta.json5` `items` array.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (Frontmatter, Markdown Guidelines, Code block features)

## Organize docs with meta.json5

1. Add `meta.json5` to each top-level section folder.
2. Set `displayName` for the sidebar/nav label.
3. Set `orderBy: 'manual'` and list slugs in `items` in reading order.
4. Use `series` to group related pages under a named heading.
5. Use `collapsed: true` to start the sidebar section collapsed.
6. Keep getting-started and onboarding pages first in `items`.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (Section Meta)

## Apply layout overrides

1. Add layout files in your theme directory.
2. Map them through `theme.layouts.home`, `theme.layouts.page`, `theme.layouts.notFound`.
3. Keep props contract compatible with docs package expectations.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (Layout Overrides, Layout Props)

## Update AI pointers in consuming project

Add pointer lines to root `CLAUDE.md` or `AGENTS.md`:

```
For @pagesmith/docs usage rules, read node_modules/@pagesmith/docs/docs/agents/usage.md
For the full @pagesmith/docs reference, see node_modules/@pagesmith/docs/REFERENCE.md
```

Or copy `node_modules/@pagesmith/docs/docs/agents/AGENTS.md.template` as a starting point.

## Connect MCP for docs-aware AI workflows

1. Register command: `pagesmith mcp --stdio`.
2. Keep config at the default `pagesmith.config.json5` or pass `--config`.
3. Use `docs_list_pages` and `docs_get_page` to drive docs updates from current content structure.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (MCP server section in CLI), `node_modules/@pagesmith/docs/docs/agents/usage.md` (MCP Introspection Workflows)

## Full repo docs refresh

Use this when implementation changed across multiple packages or when docs/skills drifted.

1. Run project AI install with docs profile so generated skills exist.
2. Run `/ps-update-all-docs` to scan code, docs, and skills together.
3. Ensure `guide/meta.json5` keeps `getting-started` first in manual order.
4. Regenerate `llms.txt` / `llms-full.txt` and verify memory pointers still reference package usage docs.
