# @pagesmith/docs Error Catalog

Error solutions specific to the docs package. See also: `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/errors.md` for content layer errors.

## Configuration Errors

### Missing config file

**Pattern:** `No pagesmith.config.json5 file found at <path>`
**Fix:** Run `npx pagesmith-docs init` or create the file manually. Minimum config:

```json5
{
  name: "my-project",
  title: "My Project",
}
```

### Invalid basePath

**Pattern:** Base path results in broken links or 404s
**Fix:** Ensure `basePath` starts with `/` and has no trailing slash. For GitHub Pages, this should match your repository name: `basePath: "/my-repo"`.

### Missing content directory

**Pattern:** `Content directory does not exist: <path>`
**Fix:** Create the content directory or set `contentDir` in config. Default locations checked: `docs/`, then `content/`.

### Asset source missing

**Pattern:** `Asset source does not exist: <path>`
**Fix:** Check `assets` config — the referenced file or folder doesn't exist. Either create it or remove the mapping.

## Layout Errors

### Layout file missing

**Pattern:** `Layout file does not exist: <path>`
**Fix:** Check `theme.layouts` config. The referenced `.tsx` file must exist at the specified path relative to the project root.

## Build Errors

### No pages found

**Pattern:** Build completes but output has no content
**Fix:** Ensure your content directory has `.md` files. Each section needs a `meta.json5` to be included in navigation.

### Search index empty

**Pattern:** Pagefind returns no results
**Fix:** Ensure `search.enabled: true` in config, the layout includes `data-pagefind-body` on the content-only wrapper (not the full shell), and pages have sufficient text content. Rebuild with `npx pagesmith-docs build`.

## CLI Errors

### Unknown command

**Pattern:** `Unknown command: <command>. Run 'pagesmith-docs --help' for available commands.`
**Fix:** Use a valid CLI command: `init`, `dev`, `build`, `preview`, `validate`, or `mcp`. Run `pagesmith-docs --help` for the full list.

### Required value missing in non-interactive mode

**Pattern:** `Project name is required in non-interactive mode.` (or `Site origin`, `Base path`)
**Fix:** `pagesmith-docs init` runs strict in non-interactive mode (`--yes`, `--non-interactive`, `CI=1`, `PAGESMITH_NON_INTERACTIVE=1`, or no TTY). Pass the missing flag (`--name`, `--origin`, `--base-path`), set the value in `pagesmith.config.{ts,json5,...}`, or rerun without the non-interactive flag to be prompted.

### Failed to parse config file

**Pattern:** `Failed to parse config file: <path>`
**Fix:** The `pagesmith.config.json5` file contains invalid JSON5 syntax. Check for:

- Unmatched braces or brackets
- Missing commas between entries
- Invalid escape sequences
- Encoding issues (file must be UTF-8)

### Config validation failed

**Pattern (build):** `Config validation failed — fix the errors above before building.`
**Pattern (server):** `Config validation failed — fix the errors above.`
**Fix:** The build or server detected configuration errors (not just warnings). Review the error output printed above this message. Common causes:

- Missing content directory
- Layout file paths that don't exist
- Invalid asset source paths

Fix all `error`-severity issues reported by `validateConfig`, then rebuild.

## Quick Fix Workflow

1. Run `npx pagesmith-docs build` to see all errors
2. Use `docs_validate_config` MCP tool for config-specific issues
3. Use `docs_list_pages` to verify page discovery
4. Check `meta.json5` files for navigation ordering
