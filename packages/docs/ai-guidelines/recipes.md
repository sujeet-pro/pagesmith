# @pagesmith/docs Agent Recipes

Short procedural recipes for common docs workflows. For the full reference, see `node_modules/@pagesmith/docs/REFERENCE.md`.

## Bootstrap a docs site

1. Read `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`.
2. Install `@pagesmith/docs`.
3. Detect the repo owner/name and default to GitHub Pages style hosting (`origin` from `https://<owner>.github.io`, `basePath` as `/<repo-name>`), following redirects when possible.
4. Inspect the repo for an existing docs-like directory and confirm the chosen docs folder with the user before reusing it.
5. Prefer `npx pagesmith init --yes --content-dir <dir> --base-path <path> --origin <origin> --ai` once the target folder is known. If init is not a fit, perform the same setup manually.
6. Keep `pagesmith.config.json5` at the repo root and point `contentDir` at the chosen docs folder.
7. Add starter `guide/` and `reference/` sections with `meta.json5` plus `README.md` pages.
8. Add `docs:dev`, `docs:build`, and `docs:preview` scripts in the root `package.json`.

**Read:** `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`, `node_modules/@pagesmith/docs/REFERENCE.md` (Recommended Project Structure, CLI Commands)

## Add a new section

1. Create the section folder under the configured content directory (for example `docs/`).
2. Add section `meta.json5` for order and labels when needed.
3. Add pages as folder-based entries with `README.md`.
4. Update cross-links and verify navigation order.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (Content Structure, Section Meta)

## Write a documentation page

1. Create `<contentDir>/<section>/<slug>/README.md`.
2. Add frontmatter with at least `title` and `description`.
3. Use one `# h1` heading per page and sequential heading depth.
4. Use fenced code blocks with language identifiers and built-in code renderer meta for titles, line numbers, and highlighting.
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
For @pagesmith/docs bootstrap and retrofit tasks, read node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md
For @pagesmith/docs upgrades, read node_modules/@pagesmith/docs/ai-guidelines/migration.md
For @pagesmith/docs usage rules, read node_modules/@pagesmith/docs/ai-guidelines/usage.md
For the full @pagesmith/docs reference, see node_modules/@pagesmith/docs/REFERENCE.md
For version-matched docs schemas, read node_modules/@pagesmith/docs/schemas/*.schema.json
```

Or copy `node_modules/@pagesmith/docs/ai-guidelines/AGENTS.md.template` as a starting point.

## Connect MCP for docs-aware AI workflows

1. Register command: `pagesmith mcp --stdio`.
2. Keep config at the default `pagesmith.config.json5` or pass `--config`.
3. Use `docs_list_pages` and `docs_get_page` to drive docs updates from current content structure.

**Read:** `node_modules/@pagesmith/docs/REFERENCE.md` (MCP server section in CLI), `node_modules/@pagesmith/docs/ai-guidelines/usage.md` (MCP Introspection Workflows)

## Upgrade an existing docs integration

1. Read `node_modules/@pagesmith/docs/ai-guidelines/migration.md` and `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md`.
2. Upgrade `@pagesmith/docs` with the repository's existing package manager.
3. Keep the current `pagesmith.config.json5` location and `contentDir` unless a schema or config issue requires a change.
4. Refresh AI pointers and artifacts if they are missing or stale. Prefer `npx pagesmith init --ai --no-llms` with explicit existing values when that is less invasive than manual edits.
5. Run `npx pagesmith build` and optionally `npx pagesmith dev`.
6. Adopt any relevant new features or config fields only after the existing docs build is green again.

**Read:** `node_modules/@pagesmith/docs/ai-guidelines/migration.md`, `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md`, `node_modules/@pagesmith/docs/REFERENCE.md`

## Full repo docs refresh

Use this when implementation changed across multiple packages or when docs/skills drifted.

1. Run project AI install with docs profile so generated skills exist.
2. Run generated Pagesmith skills when they exist, or paste the canonical prompt files into your agent to scan code, docs, and skills together.
3. Ensure `guide/meta.json5` keeps `getting-started` first in manual order.
4. Regenerate `llms.txt` / `llms-full.txt` and verify memory pointers still reference package usage docs.
