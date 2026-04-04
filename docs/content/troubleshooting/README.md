---
title: Troubleshooting
description: Common issues and solutions
---

# Troubleshooting

This page covers common issues you may encounter when building, developing, and deploying a `@pagesmith/docs` site, along with their solutions.

## Pages Load Without Styles

**Symptom**: The HTML renders but the page has no CSS -- plain text, no layout, no fonts.

**Cause**: The `basePath` is not set correctly. When your site is deployed under a subdirectory (e.g. `https://user.github.io/my-project/`), all asset URLs need the prefix.

**Fix**: Set `basePath` in your config to match the deployment path:

```json5 title="pagesmith.config.json5"
{
  basePath: '/my-project',
}
```

You can also verify by checking the HTML source. The stylesheet link should include the base path:

```html
<!-- Correct -->
<link rel="stylesheet" href="/my-project/assets/style.css">

<!-- Wrong (missing basePath) -->
<link rel="stylesheet" href="/assets/style.css">
```

If you are running locally with `pagesmith dev`, the dev server handles basePath automatically -- it redirects `/` to the basePath prefix.

## Content Not Found

**Symptom**: The build completes but some or all pages are missing from the output.

### contentDir misconfigured

The default content directory resolution checks for `docs/` first, then `content/`. If your markdown lives elsewhere, set `contentDir` explicitly:

```json5 title="pagesmith.config.json5"
{
  contentDir: './my-docs',
}
```

The path is resolved relative to the config file location.

### Wrong folder structure

Pages must follow the `<folder>/README.md` convention. A file named `guide/setup.md` will not be picked up as a page -- it must be `guide/setup/README.md`.

```text
# Will NOT work
content/
  guide/
    setup.md

# Correct
content/
  guide/
    setup/
      README.md
```

The root home page is the exception: `content/README.md` is always recognized.

### Draft pages

Pages with `draft: true` in their frontmatter are excluded from the build entirely:

```yaml
---
draft: true
---
```

Remove the `draft` field or set it to `false` to include the page.

### Hidden files

Files and directories starting with `.` are ignored during content discovery. This includes `.draft/` directories or `.hidden.md` files.

## Build Errors

### Frontmatter validation failures

**Symptom**: Build fails with a Zod validation error referencing frontmatter fields.

The docs frontmatter schema validates these fields when present:

```text
title       → string
description → string
navLabel    → string
sidebarLabel → string
order       → number
draft       → boolean
socialImage → string
```

Common mistakes:

```yaml
---
# Wrong: order must be a number, not a string
order: "first"

# Wrong: draft must be a boolean
draft: "yes"

# Correct
order: 1
draft: true
---
```

Unknown fields are passed through without error (the schema uses `.passthrough()`), so extra frontmatter fields are fine.

### Markdown processing errors

**Symptom**: Build fails with `Markdown processing failed: ...`

This usually means the markdown content has syntax that breaks the unified pipeline. Common causes:

- Malformed YAML frontmatter (unclosed strings, bad indentation)
- Invalid math expressions (unclosed `$` delimiters)
- Deeply nested HTML that conflicts with `allowDangerousHtml`

Check the error message for the specific file path and line information. Fix the markdown syntax and rebuild.

### Config validation errors

**Symptom**: Build fails with `Config validation failed` message.

The build validates your `pagesmith.config.json5` before starting. The error output shows each issue with its severity:

```text
  ✖ error: theme.layouts.page — file not found: ./theme/CustomPage.tsx
  ⚠ warn: origin — using placeholder "https://example.com" (sitemap will be skipped)
```

Errors (marked with a cross) must be fixed before building. Warnings are informational.

## Search Not Working

### Search not available in dev mode

Pagefind indexes HTML at build time. During `pagesmith dev`, the search index may be stale or from a previous build. Run a full `pagesmith build` to regenerate the search index, then use `pagesmith preview` to test search.

### Pagefind not installed

`pagefind` is bundled as a dependency of `@pagesmith/docs`. If search indexing fails, you will see:

```text
⚠ Pagefind indexing failed — search will not be available.
```

Verify the package is installed:

```bash
npm ls pagefind
```

If missing, reinstall dependencies with `npm install`.

### Search modal does not open

The search UI initializes lazily when the modal is first opened. If the modal does not appear when pressing `Ctrl+K` / `Cmd+K`:

- Check the browser console for JavaScript errors
- Verify that `assets/main.js` loaded correctly (check for 404s in the Network tab)
- Ensure `search.enabled` is not set to `false` in your config

### No results for existing content

Pagefind indexes content inside elements with `data-pagefind-body`. The default theme adds this attribute to the `<main>` element. If you are using a custom layout override, ensure your main content wrapper includes this attribute:

```tsx
<main data-pagefind-body>{content}</main>
```

## CSS Not Loading in Dev

### Missing fonts

If fonts appear as fallbacks (system fonts instead of Open Sans / JetBrains Mono), the dev server may not be resolving the font paths correctly. The dev server serves fonts from the `@pagesmith/core` package's asset directory.

Verify that `@pagesmith/core` is installed:

```bash
npm ls @pagesmith/core
```

### Wrong stylesheet path

If using `@pagesmith/core` directly (not the docs package), ensure your CSS imports are correct:

```css
/* Content rendering styles */
@import '@pagesmith/core/css/content';

/* Viewport base styles */
@import '@pagesmith/core/css/viewport';
```

These imports resolve through the package's `exports` map and require a bundler that supports CSS imports (like Vite).

## HMR and Live Reload

### Content changes require manual reload

The `@pagesmith/docs` dev server uses WebSocket-based live reload, not HMR. When you edit a markdown file:

1. The watcher detects the change
2. A content-only rebuild runs (skipping CSS/JS bundling and Pagefind)
3. The WebSocket sends a reload signal to all connected browsers
4. The browser performs a full page reload

This is fast (typically under 500ms for content-only changes) but is a full reload, not a hot module replacement. If the browser does not reload:

- Check the browser console for WebSocket connection errors
- Ensure no firewall is blocking the WebSocket connection on the dev server port
- Try stopping and restarting the dev server

### Config changes require full rebuild

When you modify `pagesmith.config.json5` or any file inside the theme directory, the dev server triggers a full rebuild (including CSS/JS bundling). This is slower than a content-only rebuild but happens automatically.

### Changes to node_modules not watched

If you are developing `@pagesmith/core` alongside `@pagesmith/docs` in a monorepo, changes to the core package source files are not watched by the docs dev server. Restart the dev server after rebuilding core.

## Layout Overrides Not Picked Up

**Symptom**: You created a custom layout file but the site still uses the default layout.

### Layout not registered in config

Custom layouts must be registered in `theme.layouts`:

```json5 title="pagesmith.config.json5"
{
  theme: {
    layouts: {
      home: './theme/layouts/CustomHome.tsx',
      page: './theme/layouts/CustomPage.tsx',
    },
  },
}
```

### Wrong export name

The layout module must export a component function. The resolver checks these names in order:

| Layout Key | Checked Exports |
|---|---|
| `home` | `default`, `DocHome`, `Home` |
| `page` | `default`, `DocPage`, `Page` |
| `notFound` | `default`, `DocNotFound`, `NotFound` |

For custom layout names (referenced from `meta.json5`), the resolver checks `default` and the layout name itself.

```tsx title="theme/layouts/CustomPage.tsx"
// Any of these work for the "page" layout:
export default function CustomPage(props) { ... }
export function DocPage(props) { ... }
export function Page(props) { ... }
```

### Section layout vs item layout

Section `meta.json5` has two layout fields:

- `layout` -- used for the section's landing page (e.g. `/guide`)
- `itemLayout` -- used for individual pages within the section (e.g. `/guide/getting-started`)

```json5 title="content/guide/meta.json5"
{
  displayName: 'Guide',
  layout: 'guide-landing',       // Section index page
  itemLayout: 'guide-article',   // Individual articles
}
```

Both names must be registered in `theme.layouts` in your config.

## Git Timestamps Not Showing

**Symptom**: Pages do not show "Last updated" even though `lastUpdated: true` is in the config.

### Enable in config

The feature is opt-in:

```json5 title="pagesmith.config.json5"
{
  lastUpdated: true,
}
```

### Requires git history

The timestamp is read from `git log -1 --format=%cI -- <file>`. This requires:

- The project is a git repository
- The content file has been committed at least once
- Full git history is available (not a shallow clone)

In CI environments, ensure your checkout fetches full history:

```yaml title="GitHub Actions"
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

New files that have not been committed will not have a timestamp.

### Timestamp not updating

The timestamp reflects the most recent commit that modified the file. If you edit a file but do not commit the change, the timestamp will not change. The build reads from git history, not the filesystem modification time.

## Sitemap Not Generated

The sitemap is generated when:

1. `sitemap` is not set to `false` (default: `true`)
2. `origin` is set to something other than the placeholder `"https://example.com"`

If you see no `sitemap.xml` in your build output, set a real `origin`:

```json5 title="pagesmith.config.json5"
{
  origin: 'https://docs.my-project.com',
}
```

## meta.json5 Not Taking Effect

### Manual ordering not working

When using `orderBy: 'manual'` with an `items` array, entries must match the folder slug exactly:

```json5 title="content/guide/meta.json5"
{
  orderBy: 'manual',
  items: [
    'getting-started',     // matches content/guide/getting-started/README.md
    'advanced-usage',      // matches content/guide/advanced-usage/README.md
  ],
}
```

Entries not listed in `items` appear after the ordered entries, sorted alphabetically.

### Series articles not appearing

When using the `series` field, each `articles` entry must match a folder slug within the section:

```json5 title="content/guide/meta.json5"
{
  series: [
    {
      slug: 'basics',
      displayName: 'Basics',
      articles: ['getting-started', 'first-page'],
    },
  ],
}
```

If `content/guide/first-page/README.md` does not exist, the sidebar entry will be silently skipped.

## Getting Help

If your issue is not covered here:

1. Check the build output in your terminal for warnings and errors
2. Run `pagesmith build` (not dev) to get full diagnostic output
3. Verify your `pagesmith.config.json5` syntax using a JSON5 validator
4. Check the [Configuration Reference](/reference/docs-config) for field details
