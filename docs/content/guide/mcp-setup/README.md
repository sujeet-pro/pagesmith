---
title: MCP Server Setup
description: Connect AI assistants to your docs site via the Model Context Protocol
order: 4
---

# MCP Server Setup

> [!TIP] AI Quick Start
> Ask your AI agent: "Configure the Pagesmith MCP servers in my Claude Code settings. Add both `pagesmith mcp --stdio` for docs tools and the core MCP for collection tools."
> Then read on to understand what each tool does and how to use them in workflows.

Pagesmith ships two MCP servers that give AI assistants direct access to your content, configuration, and validation. This enables AI-driven workflows like "validate my config, list all pages, then update the one about getting started."

## Quick Setup

### Claude Code

Add to `.claude/settings.json` (project-level) or `~/.claude/settings.json` (user-level):

```json title=".claude/settings.json"
{
  "mcpServers": {
    "pagesmith": {
      "command": "npx",
      "args": ["pagesmith", "mcp", "--stdio"]
    }
  }
}
```

After saving, restart Claude Code. You should see the Pagesmith tools available in the MCP tools list.

### Cursor / Other MCP Clients

Any MCP-compatible client can connect using the stdio transport:

```bash
npx pagesmith mcp --stdio
```

Pass `--config <path>` to specify a custom config file, or `--root <dir>` to set the project root.

## Docs MCP Server (@pagesmith/docs)

The docs MCP server provides tools scoped to your documentation site.

### docs_validate_config

Validate `pagesmith.config.json5` and return any warnings or errors.

**When to use:** Before building, after editing config, or when debugging configuration issues.

```json title="Input"
{ "configPath": "pagesmith.config.json5" }
```

**Returns:** Array of `{ type: "error" | "warning", message, field? }` issues. Empty array means valid.

**Example workflow:**
> "Validate my docs config and fix any issues" -- The agent calls `docs_validate_config`, reads the issues, then edits the config file to resolve them.

### docs_resolve_config

Return the fully resolved configuration with all defaults applied, including auto-detected basePath, favicon, and edit link patterns.

**When to use:** To understand what effective configuration is being used, especially when smart defaults are in play.

```json title="Input"
{ "configPath": "pagesmith.config.json5" }
```

**Returns:** The complete resolved config object with every field populated.

### docs_list_pages

List all pages with their slug, title, section, and source file path.

**When to use:** Before editing content, to understand what pages exist and where they are.

```json title="Input"
{ "section": "guide" }
```

The `section` parameter is optional. Omit it to list all pages across all sections.

**Returns:** Array of `{ slug, title, section, sourcePath, description? }`.

**Example workflow:**
> "List all guide pages and check which ones need updating after the API change" -- The agent calls `docs_list_pages` with `section: "guide"`, then reads relevant pages to check accuracy.

### docs_get_page

Get a single page by slug, including full metadata and raw markdown source.

**When to use:** To read a specific page's content before editing or reviewing it.

```json title="Input"
{ "slug": "guide/getting-started" }
```

**Returns:** `{ slug, title, description, section, sourcePath, markdown, frontmatter }`.

### docs_search_pages

Full-text search across page titles, descriptions, and content.

**When to use:** To find pages related to a topic without knowing the exact slug.

```json title="Input"
{ "query": "validation", "maxResults": 10 }
```

**Returns:** Up to 20 matching pages ranked by relevance.

## Core MCP Server (@pagesmith/core)

The core MCP server provides tools for inspecting collections and content entries. It's useful for custom sites built on `@pagesmith/core` directly.

### core_list_collections

List all defined collections with their loader type, directory, and schema field names.

### core_list_entries

List entries in a collection with pagination support.

```json title="Input"
{ "collection": "posts", "limit": 20, "offset": 0 }
```

### core_get_entry

Get a single entry with its validated data and rendered HTML (for markdown collections).

```json title="Input"
{ "collection": "posts", "slug": "hello-world" }
```

### core_validate

Run all validators (schema + content) on one or all collections and return issues.

```json title="Input"
{ "collection": "posts" }
```

## Available Resources

Both MCP servers expose versioned documentation as resources:

| Resource URI | Content |
|---|---|
| `pagesmith://docs/agents/usage` | @pagesmith/docs usage rules |
| `pagesmith://docs/llms-full` | Full docs reference |
| `pagesmith://docs/reference` | REFERENCE.md |
| `pagesmith://core/agents/usage` | @pagesmith/core usage rules |
| `pagesmith://core/reference` | Core REFERENCE.md |

These resources are tied to the installed package version, so AI agents always get version-matched guidance.

## Practical Workflows

### Validate, list, and update

1. `docs_validate_config` -- ensure config is clean
2. `docs_list_pages` -- see what exists
3. `docs_get_page` -- read the page to update
4. Edit the markdown file
5. `docs_validate_config` -- verify nothing broke

### Content audit

1. `docs_list_pages` -- get all pages
2. For each page: `docs_get_page` -- read content
3. Compare against source code
4. Update outdated pages

### Debug a build issue

1. `docs_validate_config` -- check for config errors
2. `docs_resolve_config` -- see effective config with defaults
3. `docs_list_pages` -- verify content discovery

## When to Use MCP vs CLI vs Skills

| Task | MCP | CLI | Skill |
|---|---|---|---|
| Validate config | `docs_validate_config` | | |
| List/inspect pages | `docs_list_pages` | | |
| Search content | `docs_search_pages` | | |
| Build the site | | `pagesmith build` | |
| Start dev server | | `pagesmith dev` | |
| Initialize a project | | `pagesmith init` | |
| Update docs after code change | | | `/update-docs` |
| Full docs refresh | | | `/ps-update-all-docs` |

MCP tools are best for **reading and validating**. Skills are best for **writing and updating**. The CLI is for **building and serving**.
