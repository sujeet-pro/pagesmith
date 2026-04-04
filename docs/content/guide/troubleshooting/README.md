---
title: Troubleshooting
description: Solutions to common Pagesmith issues
---

# Troubleshooting

This page covers common issues you may encounter when working with Pagesmith and how to resolve them.

> [!TIP]
> **AI quick-start:** Describe your Pagesmith error to your AI agent for diagnosis. Paste the error message and the agent can identify the root cause and suggest a fix.

## Dev Server Issues

### Dev server doesn't reload on file changes

**Symptoms:** You edit a markdown file or configuration file, but the browser does not refresh.

**Causes and solutions:**

1. **File is outside `contentDir`.** The dev server watches only the content directory configured in `pagesmith.config.json5`. Verify your file is inside the correct directory:

   ```json5 title="pagesmith.config.json5"
   {
     contentDir: './content',  // Files must be under this path
   }
   ```

   The default `contentDir` is `docs/` if that directory exists, otherwise `content/`. Check which applies to your project.

2. **Syntax error in frontmatter.** A YAML parsing error in frontmatter can cause the build to fail silently. Check for common YAML issues:

   ```yaml title="Common YAML mistakes"
   ---
   # Missing quotes around values with colons
   title: Getting Started: A Guide    # Needs quotes
   title: "Getting Started: A Guide"  # Correct

   # Incorrect indentation
   hero:
   title: My Site    # Wrong -- needs indentation
     title: My Site  # Correct
   ---
   ```

3. **File watcher limit reached.** On Linux, the default `inotify` watch limit may be too low. Increase it:

   ```bash title="Terminal"
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

## Build Errors

### Build fails with "cannot find module virtual:content/..."

**Symptoms:** The build or dev server crashes with an error like:

```text
Error: Cannot find module 'virtual:content/posts'
```

**Causes and solutions:**

1. **Collection name mismatch.** The virtual module name must match the collection name in your `content.config.ts` exactly:

   ```ts title="content.config.ts"
   const posts = defineCollection({
     loader: 'markdown',
     directory: 'content/posts',
   })

   export default defineConfig({
     collections: { posts },  // This name must match the import
   })
   ```

   ```ts title="app.ts"
   // Must match the key in collections
   import posts from 'virtual:content/posts'    // Correct
   import blog from 'virtual:content/blog'      // Wrong -- no collection named 'blog'
   ```

2. **Missing `content.config.ts`.** The Vite plugin `pagesmithContent` looks for this file at the project root. Ensure it exists and exports a valid config.

3. **Plugin not registered.** Ensure the `pagesmithContent` Vite plugin is in your `vite.config.ts`:

   ```ts title="vite.config.ts"
   import { pagesmithContent } from '@pagesmith/core/vite'
   import { defineConfig } from 'vite'

   export default defineConfig({
     plugins: [pagesmithContent()],
   })
   ```

### Build fails with validation errors

**Symptoms:** The build reports schema validation errors for your content entries.

**Causes and solutions:**

1. **Required field missing.** If you use `BaseFrontmatterSchema` or `BlogFrontmatterSchema`, fields like `title`, `description`, and `publishedDate` are required:

   ```yaml title="Missing required fields"
   ---
   title: My Post
   # Missing 'description' and 'publishedDate' -- will fail validation
   ---
   ```

   Add the missing fields or make them optional in a custom schema:

   ```ts title="Optional description"
   const posts = defineCollection({
     schema: z.object({
       title: z.string(),
       description: z.string().optional(),  // Now optional
     }),
   })
   ```

2. **Type mismatch.** A field value does not match the expected type. Common cases:

   ```yaml title="Type mismatches"
   ---
   # order expects a number, not a string
   order: "first"   # Wrong
   order: 1         # Correct

   # tags expects an array
   tags: javascript  # Wrong -- this is a string
   tags:             # Correct -- this is an array
     - javascript
   ---
   ```

## Search Issues

### Search isn't working

**Symptoms:** The search modal opens (via `Ctrl+K` / `Cmd+K`) but returns no results, or the search UI does not appear at all.

**Causes and solutions:**

1. **Search index not built.** Pagefind generates its index during `pagesmith build`, not during development. Run a full build first:

   ```bash title="Terminal"
   pagesmith build
   pagesmith preview
   ```

   During `pagesmith dev`, search is not available because the Pagefind index has not been generated.

2. **Search disabled in config.** Check that search is enabled:

   ```json5 title="pagesmith.config.json5"
   {
     search: {
       enabled: true,  // Default is true
     },
   }
   ```

3. **Content not indexed.** Pagefind indexes the built HTML output. If pages are marked as `draft: true`, they are excluded from the build and will not appear in search results.

## Layout Issues

### Custom layout isn't being used

**Symptoms:** You created a custom layout component, but pages still render with the default layout.

**Causes and solutions:**

1. **Layout not registered in config.** Custom layouts must be declared in the `theme.layouts` config:

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

2. **Export name mismatch.** The layout module must export the component as `default` or one of the recognized named exports:

   | Layout Key | Accepted Exports |
   |---|---|
   | `home` | `default`, `DocHome`, `Home` |
   | `page` | `default`, `DocPage`, `Page` |
   | `notFound` | `default`, `DocNotFound`, `NotFound` |

   ```tsx title="theme/layouts/CustomPage.tsx"
   // Either of these works:
   export default function CustomPage(props) { ... }
   export function DocPage(props) { ... }
   ```

3. **Section-level layout not registered.** If you set `layout` or `itemLayout` in a section's `meta.json5`, the layout name must also be a key in `theme.layouts`:

   ```json5 title="content/blog/meta.json5"
   {
     displayName: "Blog",
     itemLayout: "blog-post",  // Must exist in theme.layouts
   }
   ```

   ```json5 title="pagesmith.config.json5"
   {
     theme: {
       layouts: {
         "blog-post": "./theme/layouts/BlogPost.tsx",
       },
     },
   }
   ```

## Content Issues

### Images not appearing

**Symptoms:** Images referenced in markdown do not display in the rendered page.

**Causes and solutions:**

1. **Incorrect relative path.** Image paths in markdown are relative to the markdown file's directory. For folder-based content, place images next to the `README.md`:

   ```text title="Directory structure"
   content/
     guide/
       getting-started/
         README.md
         screenshot.png    <- Same directory as README.md
   ```

   ```md title="README.md"
   ![Screenshot](./screenshot.png)
   ```

2. **Image outside content directory.** The build copies companion assets (images referenced from markdown) from the content directory. Images placed outside `contentDir` are not discovered.

3. **Unsupported format.** The asset copier recognizes these extensions: `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.ico`. Other formats are ignored.

4. **Public directory images.** For images shared across many pages, place them in `publicDir` (default: `public/`) and reference with an absolute path:

   ```md
   ![Logo](/images/logo.svg)
   ```

### Validation errors but frontmatter looks correct

**Symptoms:** The build reports validation errors even though the frontmatter YAML appears correct.

**Causes and solutions:**

1. **Schema type expectations.** Check the schema definition for the exact types expected. Zod is strict about types:

   ```yaml title="Subtle type issues"
   ---
   # publishedDate must be a valid date
   publishedDate: not-a-date      # Fails
   publishedDate: 2026-01-15      # Works

   # order must be a number
   order: 1.5                      # Works (it's a number)
   order: "1"                      # May fail depending on schema
   ---
   ```

2. **Required vs. optional fields.** `BaseFrontmatterSchema` requires `title`, `description`, and `publishedDate`. The `DocsFrontmatterSchema` used by `@pagesmith/docs` makes all fields optional. If you see "required" errors, check which schema is active.

3. **Extra fields with strict schemas.** If your custom schema does not use `.passthrough()`, extra frontmatter fields cause validation failures:

   ```ts title="Strict vs. passthrough"
   // Strict -- extra fields rejected
   const schema = z.object({ title: z.string() })

   // Passthrough -- extra fields preserved
   const schema = z.object({ title: z.string() }).passthrough()
   ```

## Git-Based Features

### lastUpdated shows wrong date

**Symptoms:** The "Last updated" timestamp on a page does not match when you last edited the file.

**Causes and solutions:**

1. **File not committed.** The `lastUpdated` feature reads the git log with `git log -1 --format=%cI`. Uncommitted changes are not reflected. Commit your changes to update the timestamp.

2. **Shallow clone.** CI environments often use shallow clones (`git clone --depth 1`), which only include the most recent commit. All pages will show the same date. Use a full clone or increase the depth:

   ```yaml title="GitHub Actions"
   - uses: actions/checkout@v4
     with:
       fetch-depth: 0  # Full history for accurate timestamps
   ```

3. **Feature not enabled.** Ensure `lastUpdated` is enabled in your config:

   ```json5 title="pagesmith.config.json5"
   {
     lastUpdated: true,
   }
   ```

4. **Git not available.** If `git` is not on the system PATH during the build, the timestamp silently falls back to `undefined` and no date is shown.

## Configuration Issues

### Config file not found

**Symptoms:** The CLI exits with:

```text
No pagesmith.config.json5 file found at /path/to/pagesmith.config.json5
```

**Causes and solutions:**

1. **Wrong working directory.** The CLI looks for the config file relative to the current working directory. Run the command from your project root, or specify the path:

   ```bash title="Terminal"
   pagesmith dev --config ./docs/pagesmith.config.json5
   ```

2. **File not created yet.** Run `pagesmith init` to create the initial config file:

   ```bash title="Terminal"
   pagesmith init
   ```

### Base path not applied correctly

**Symptoms:** Links and assets break when deploying to a subdirectory (e.g. GitHub Pages with a repository name prefix).

**Causes and solutions:**

The base path follows a priority chain:

1. `--base-path` CLI flag (highest priority)
2. `BASE_URL` environment variable
3. `basePath` in `pagesmith.config.json5`
4. Default: `"/"`

Ensure you set it in exactly one place. For GitHub Pages:

```bash title="Terminal"
pagesmith build --base-path /my-repo
```

Or in CI:

```bash title="Terminal"
BASE_URL=/my-repo pagesmith build
```
