# Pagesmith Error Catalog

Machine-readable error solutions for AI agents. Each section maps a common error pattern to its fix.

## Schema Validation Errors

### Required field missing

**Pattern:** `Required at "<field>"`
**Fix:** Add the missing field to your frontmatter. Check the collection schema for required fields.
**Example:**

```yaml
---
title: My Page          # ← required by BaseFrontmatterSchema
description: A summary  # ← required by BaseFrontmatterSchema
---
```

### Invalid date format

**Pattern:** `Expected date, received string` or `Invalid date`
**Fix:** Use ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss`.
**Example:** `publishedDate: 2024-01-15`

### Unknown field

**Pattern:** `Unrecognized key(s) in object: "<field>"`
**Fix:** The schema uses `.strict()`. Remove the unrecognized field or update the schema to include it.

### Type mismatch

**Pattern:** `Expected <type>, received <type>`
**Fix:** Ensure the frontmatter value matches the schema type. Common mismatches:

- `tags` must be an array: `tags: [a, b]` not `tags: a, b`
- `draft` must be boolean: `draft: true` not `draft: "true"`
- `order` must be number: `order: 1` not `order: "1"`

## Content Validation Errors

### Missing heading

**Pattern:** `Document has content but no headings`
**Fix:** Add a top-level `# Heading` to your markdown content, or set `title` in frontmatter (some setups auto-generate h1 from title).

### Heading level skip

**Pattern:** `Heading level skip: h<n> -> h<m> ("<text>")`
**Fix:** Don't skip heading levels. After `## Section`, use `### Subsection`, not `#### Deep`.

### Bare URL

**Pattern:** `Bare URL found`
**Fix:** Wrap URLs in markdown links: `[Link text](https://example.com)` instead of bare `https://example.com`.

### Missing code language

**Pattern:** `Code block has meta properties but no language identifier`
**Fix:** Add a language identifier to code blocks that use meta properties like `title`, `mark`, etc.

### Unknown meta property

**Pattern:** `Unknown code block meta property: "<prop>"`
**Fix:** Use only supported built-in code renderer meta properties: `title`, `showLineNumbers`, `startLineNumber`, `wrap`, `frame`, `collapse`, `mark`, `ins`, `del`.

## Plugin Validation Errors

### Plugin threw

**Pattern:** `[<name>] Validator threw: <message>`
**Fix:** A custom or plugin validator encountered an unexpected error. Check the plugin's documentation for the specific error message. The validator name identifies which plugin failed.

## Load Errors

### File not found

**Pattern:** `Failed to load <path>: ENOENT`
**Fix:** The file was deleted or moved. Update your content directory or remove the reference.

### Invalid YAML frontmatter

**Pattern:** `Failed to load <path>: YAMLException`
**Fix:** Check frontmatter YAML syntax. Common issues:

- Missing `---` delimiters
- Unquoted special characters (`:`, `#`, `[`, `{`)
- Incorrect indentation

### Invalid JSON

**Pattern:** `Failed to load <path>: JSON` or `Unexpected token`
**Fix:** Validate your JSON/JSON5 file syntax. Use a JSON linter.

## MCP Server Errors

### Config not found

**Pattern:** `No pagesmith.config.json5 file found at <path>`
**Fix:** This pattern applies to the `@pagesmith/docs` CLI-backed MCP workflow, not a bare `@pagesmith/core` content-layer integration.

- If you are using `@pagesmith/docs`, run `npx pagesmith-docs init` to create `pagesmith.config.json5`, or pass `--config <path>`.
- If you are using `@pagesmith/core` directly, create a `ContentLayer` in code and pass it to `createCoreMcpServer(...)` instead of looking for `pagesmith.config.json5`.

### Entry not found

**Pattern:** `Entry not found: <collection>/<slug>`
**Fix:** Verify the collection name and slug. Use `core_list_entries` to see available entries.

## Content Layer Errors

### Collection not found

**Pattern:** `Collection "<name>" not found. Available: <list>`
**Fix:** Check the collection name passed to `getCollection()` or `getEntry()`. The error lists all configured collection names — use one of those.

### Markdown processing failed

**Pattern:** `Markdown processing failed: <message>`
**Fix:** The unified markdown pipeline threw an error. Common causes:

- Invalid remark/rehype plugin configuration
- Malformed markdown that breaks a parser plugin
- Shiki theme or language loading failure

Check the inner error message for details. If caused by a custom plugin, verify the plugin implementation.

### Unknown loader type

**Pattern:** `Unknown loader type: <type>`
**Fix:** The `loader` field in your collection definition uses an unrecognized type string. Supported built-in types: `markdown`, `json`, `json5`, `jsonc`, `yaml`, `toml`. For custom loaders, pass a `Loader` object instead of a string.

## Vite Plugin Errors

### ContentLayer not initialized

**Pattern:** `pagesmith-content: ContentLayer not initialized. configResolved has not run yet.`
**Fix:** The `pagesmithContent` Vite plugin tried to load content before Vite called `configResolved`. This usually means the plugin was misconfigured or a module tried to import content at config time. Ensure the plugin is registered in `vite.config.ts` and content is only imported from application code (not config files).

## Quick Diagnostic Workflow

When encountering an error:

1. **Identify the source** — each `ValidationIssue` has a `source` field indicating where it originated: `schema` (Zod safeParse), `content` (MDAST-based validators), `plugin` (plugin validators), or `custom` (collection `validate` function)
2. **Match the pattern** — find the error pattern above
3. **Apply the fix** — follow the specific fix instructions
4. **Re-validate** — use `core_validate` MCP tool or rebuild to confirm the fix

