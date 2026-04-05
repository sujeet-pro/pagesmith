# @pagesmith/docs Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/docs`.

## Versioning model

- The installed npm package is the versioned source of truth for AI guidance.
- Files under `node_modules/@pagesmith/docs/docs/*` match the exact installed package version.
- The hosted docs site (`content/` in this repo) tracks latest implementation and may be ahead of older installed versions.

## When to pick @pagesmith/docs

- Documentation site with defaults and conventions.
- Minimal setup with `pagesmith.config.json5`.
- Built-in nav, sidebar, and Pagefind search.

## Required integration shape

1. Configure site via `pagesmith.config.json5`.
2. Keep docs content in `content/`.
3. Keep `content/README.md` as docs home page.
4. Use `meta.json5` plus frontmatter for ordering and labels.
5. Use `theme.layouts` for layout overrides (`home`, `page`, `notFound`).

## AI-first docs workflow

1. Start with project AI setup (`pagesmith init --ai` or `installAiArtifacts({ profile: 'docs' })`).
2. Use generated skills to keep docs synchronized with implementation:
   - `/update-docs` for targeted page updates
   - `/ps-update-all-docs` for full-repo docs regeneration and skill alignment
3. Keep agent outputs in the `@pagesmith/docs` structure (`content/`, folder-based `README.md`, `meta.json5` ordering).
4. Keep an onboarding series first in manual navigation (for example `guide/meta.json5` should start with pages like `choose-your-path`, `ai-assistants`, and `prompts-cookbook` before manual setup deep dives).

## MCP server (stdio)

`@pagesmith/docs` exposes a stdio MCP server for AI tooling:

- Command: `pagesmith mcp --stdio`
- Optional flags: `--config <path>`, `--root <path>`
- Programmatic entry: `@pagesmith/docs/mcp`

Primary MCP tools:

- `docs_validate_config`
- `docs_resolve_config`
- `docs_list_pages`
- `docs_get_page`

## Non-negotiable rules

- Do not introduce custom search plugins when Pagefind is enabled.
- Keep docs navigation derived from content structure and metadata.
- Keep markdown behavior aligned with Pagesmith markdown pipeline.
- Maintain relative internal links across docs pages.
- Keep onboarding pages first in manual section ordering before manual setup and deep dives.

## Reference docs

- Docs reference: `node_modules/@pagesmith/docs/REFERENCE.md`
- Core reference: `node_modules/@pagesmith/core/REFERENCE.md`
- Recipes: `node_modules/@pagesmith/docs/docs/agents/recipes.md`
- Version notes: `node_modules/@pagesmith/docs/docs/agents/changelog-notes.md`
- Migration notes: `node_modules/@pagesmith/docs/docs/agents/migration.md`
- MCP entry: `node_modules/@pagesmith/docs/dist/mcp/server.mjs`

## MCP Introspection Workflows

### Validate and fix configuration

```
1. Call docs_validate_config → get config issues
2. Fix warnings (missing name/title/description)
3. Fix errors (missing directories, invalid paths)
4. Call docs_resolve_config to verify effective config
```

### Audit docs site content

```
1. Call docs_list_pages → get all pages with sections
2. Call docs_search_pages with keywords → find specific content
3. Call docs_get_page for detailed page inspection
4. Edit source files and rebuild to verify
```
