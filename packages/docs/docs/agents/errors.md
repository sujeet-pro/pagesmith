# @pagesmith/docs Error Catalog

Error solutions specific to the docs package. See also: `@pagesmith/core/docs/agents/errors.md` for content layer errors.

## Configuration Errors

### Missing config file
**Pattern:** `No pagesmith.config.json5 file found at <path>`
**Fix:** Run `npx pagesmith init` or create the file manually. Minimum config:
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
**Fix:** Ensure `search.enabled: true` in config and pages have sufficient text content. Rebuild with `npx pagesmith build`.

## Quick Fix Workflow

1. Run `npx pagesmith build` to see all errors
2. Use `docs_validate_config` MCP tool for config-specific issues
3. Use `docs_list_pages` to verify page discovery
4. Check `meta.json5` files for navigation ordering
