---
title: Docs Configuration Reference
description: Full pagesmith.config.json5 reference — site metadata, paths, base URL, theme, search, edit links, and markdown options.
---

# Docs Configuration Reference

The `@pagesmith/docs` package can run with no config when your repository already follows the default `docs/` plus `gh-pages/` conventions, but `pagesmith.config.json5` remains the place to override those defaults. The file lives at the root of your documentation project and uses the [JSON5](https://json5.org/) format, which supports comments, trailing commas, unquoted keys, and other conveniences that make configuration files more readable.

> [!TIP]
> For agent-driven setup, use the version-matched config schema at `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json` or the hosted copy at [https://projects.sujeet.pro/pagesmith/schemas/pagesmith-config.schema.json](https://projects.sujeet.pro/pagesmith/schemas/pagesmith-config.schema.json). When `pagesmith.config.json5` lives at the repo root, add `$schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json'`.

## DocsUserConfig Type

The full TypeScript type for the configuration file is:

```ts title="DocsUserConfig"
type FooterLink = {
  label: string;
  path: string;
};

type FooterLinkGroup = {
  header?: string;
  links: FooterLink[];
};

type DocsUserConfig = {
  name?: string;
  title?: string;
  description?: string;
  origin?: string;
  language?: string;
  contentDir?: string;
  outDir?: string;
  publicDir?: string;
  basePath?: string;
  homeLink?: string;
  maintainer?: {
    name: string;
    link?: string;
  };
  footerLinks?: FooterLink[] | FooterLinkGroup[];
  footerText?: string;
  copyright?: {
    projectName?: string;
    startYear?: number;
    endYear?: number | null;
  };
  sidebar?: {
    collapsible?: boolean;
  };
  search?: {
    enabled?: boolean;
    showImages?: boolean;
    showSubResults?: boolean;
    pagefindFlags?: string[];
  };
  theme?: {
    lightColor?: string;
    darkColor?: string;
    defaultColorScheme?: "auto" | "light" | "dark";
    defaultTheme?: "paper" | "high-contrast";
    layouts?: Record<string, string>;
    socialImage?: string;
  };
  editLink?:
    | {
        repo: string;
        branch?: string;
        label?: string;
      }
    | false;
  lastUpdated?: boolean;
  sitemap?: boolean;
  analytics?: {
    googleAnalytics?: string;
  };
  markdown?: {
    allowDangerousHtml?: boolean;
    math?: boolean | "auto";
    shiki?: {
      themes?: { light: string; dark: string };
      langAlias?: Record<string, string>;
      defaultShowLineNumbers?: boolean;
    };
  };
  home?: {
    configFile?: string;
  };
  packages?: Record<string, { label: string }>;
  favicon?: string | false;
  icon?: string | false;
  assets?: Record<string, string[]>;
  server?: {
    host?: string;
    /** Number, or 'auto' to scan upward from 4000 for the first free port. */
    devPort?: number | "auto";
    /** Number, or 'auto' to scan upward from 4000 for the first free port. */
    previewPort?: number | "auto";
    /** Honored only when the resolved port is a number. */
    strictPort?: boolean;
    /** Defaults to 'info'. */
    logLevel?: "silent" | "error" | "warn" | "info" | "verbose";
  };
};
```

## Configuration Fields

### Site Metadata

| Field         | Type     | Default                                                                        | Description                                                                                                                                                                 |
| ------------- | -------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string` | package.json name &rarr; directory name                                        | Short site name displayed in the header and used for OpenGraph `og:site_name`. Falls back to `title`, then package.json `name` (scope stripped), then directory name.       |
| `title`       | `string` | package.json name &rarr; directory name                                        | Full site title used in `<title>` tags and document metadata. Falls back to `name`, then package.json `name` (scope stripped), then directory name.                         |
| `description` | `string` | package.json description &rarr; placeholder                                    | Site-level description used for the default meta description and OpenGraph tags.                                                                                            |
| `origin`      | `string` | git-detected GitHub Pages host &rarr; package.json homepage &rarr; placeholder | The canonical origin URL of the site (e.g. `https://pagesmith.dev`). Used for canonical links, OpenGraph URLs, and sitemap generation. Should not include a trailing slash. |
| `language`    | `string` | `"en"`                                                                         | The language code set on the `<html lang>` attribute.                                                                                                                       |

### Directory Paths

| Field        | Type     | Default                                | Description                                                                                                                            |
| ------------ | -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `contentDir` | `string` | `"docs/"` if exists, else `"content/"` | Path to the content directory, relative to the config file. The same default is used in zero-config mode.                              |
| `outDir`     | `string` | `"gh-pages"`                           | Output directory for the static build. The same default is used in zero-config mode and can be overridden by the `--out-dir` CLI flag. |
| `publicDir`  | `string` | `"public"`                             | Directory for static files that are copied as-is to the build output (favicons, images, etc.).                                         |

### Base Path

| Field           | Type      | Default                             | Description                                                                                                                                                                                                                                                                                        |
| --------------- | --------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basePath`      | `string`  | git-detected repo name &rarr; `"/"` | Base URL path prefix for deployment under a subdirectory (e.g. `"/docs"` or `"/pagesmith"`). Trailing slashes are automatically stripped. CLI `--base-path` wins, and `BASE_URL` only overrides when it is set to a non-root value.                                                                |
| `trailingSlash` | `boolean` | `false`                             | Controls the output file format and URL style. When `false`, pages emit as `path.html` for direct resolution on GitHub Pages without 301 redirects. When `true`, pages emit as `path/index.html` for trailing-slash URLs. Internal links in markdown content are automatically formatted to match. |

The base path follows a priority resolution order:

1. `--base-path` CLI flag (highest priority)
2. `BASE_URL` environment variable (when set to a non-root value)
3. `basePath` in `pagesmith.config.json5`
4. Auto-detected from git remote URL (repo name as base path)
5. Default: `"/"` (root)

This resolution order allows CI/CD pipelines to override the base path without modifying the config file. Root-like values such as `"/"` are ignored so default toolchain env vars do not accidentally erase an explicit docs `basePath`.

### Home Link

| Field      | Type     | Default            | Description                                                                                                                                                                   |
| ---------- | -------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `homeLink` | `string` | Same as `basePath` | Override the header logo link destination. Useful when the docs site is part of a larger site and you want the logo to link to the parent site root instead of the docs root. |

### Maintainer

| Field        | Type                              | Default               | Description                                                                                                                                            |
| ------------ | --------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `maintainer` | `{ name: string; link?: string }` | `package.json author` | Maintainer credit used by the default footer sign-off. If omitted, Pagesmith falls back to the project's `package.json` `author` field when available. |

Example:

```json5 title="pagesmith.config.json5"
maintainer: {
  name: 'Sujeet Jaiswal',
  link: 'https://sujeet.pro',
}
```

### Footer Links

| Field         | Type                                                                                                                  | Default             | Description                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `footerLinks` | `Array<{ label: string; path: string }> \| Array<{ header?: string; links: Array<{ label: string; path: string }> }>` | top-level nav links | Links displayed in the page footer. Use a flat array for a link grid of major links, or grouped objects for column layouts with optional headers. On wide screens, the footer uses up to 4 evenly spaced columns. External URLs are supported. When omitted, the footer reuses the site's primary top-level navigation links. Set `footerLinks: []` to hide the footer links entirely. |

Flat row example:

```json5 title="pagesmith.config.json5"
footerLinks: [
  { label: 'Guide', path: '/guide' },
  { label: 'Reference', path: '/reference' },
  { label: 'GitHub', path: 'https://github.com/your-org/your-repo' },
]
```

Grouped columns example:

```json5 title="pagesmith.config.json5"
footerLinks: [
  {
    header: 'Docs',
    links: [
      { label: 'Guide', path: '/guide' },
      { label: 'Reference', path: '/reference' },
    ],
  },
  {
    header: 'Project',
    links: [{ label: 'GitHub', path: 'https://github.com/your-org/your-repo' }],
  },
]
```

### Footer Sign-off

| Field        | Type     | Default                       | Description                                                                                                                                                                                                                                          |
| ------------ | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `footerText` | `string` | default Pagesmith attribution | Override only the Pagesmith sign-off segment in the footer's bottom legal line. When omitted, the default footer renders "Made with ❤️ using Pagesmith" and appends a maintainer credit when `maintainer` (or `package.json` `author`) is available. |

### Footer Copyright

| Field                   | Type                                                                     | Default                   | Description                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copyright`             | `{ projectName?: string; startYear?: number; endYear?: number \| null }` | —                         | Configures the copyright segment that appears before the Pagesmith sign-off in the footer's bottom legal line.                                             |
| `copyright.projectName` | `string`                                                                 | `name` / `title` fallback | Project name shown after the copyright years.                                                                                                              |
| `copyright.startYear`   | `number`                                                                 | first git commit year     | Starting year shown in the copyright range.                                                                                                                |
| `copyright.endYear`     | `number \| null`                                                         | `null`                    | Optional fixed end year. Leave `null` or omit it to render the build year and let the browser update it later when the viewer's current year is different. |

Example:

```json5 title="pagesmith.config.json5"
copyright: {
  projectName: 'Pagesmith',
  startYear: 2026,
  endYear: null,
}
```

### Sidebar Configuration

| Field                 | Type      | Default | Description                                                                                                                                                                                   |
| --------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar.collapsible` | `boolean` | `true`  | Enable collapsible sidebar section groups. When true, section headings in the sidebar become toggleable, and sections can specify `collapsed: true` in their `meta.json5` to start collapsed. |

Example:

```json5 title="pagesmith.config.json5"
sidebar: {
  collapsible: true,
}
```

When collapsible sidebars are enabled, each section's `meta.json5` can control its initial state:

```json5 title="content/reference/meta.json5"
{
  displayName: "Reference",
  collapsed: true, // Start collapsed (only when sidebar.collapsible is true)
}
```

### Search Configuration

Search is powered by [Pagefind](https://pagefind.app/), which indexes your built HTML pages for fast client-side full-text search.

| Field                   | Type       | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search.enabled`        | `boolean`  | `true`  | Toggle the built-in Pagefind integration. When `true`, the search index is built during `pagesmith-docs build` and the search UI (modal with `Ctrl+K` / `Cmd+K`) is included on every page. When `false`, the Pagefind binary is never invoked, the `<outDir>/pagefind/` directory is not emitted, and every page is rendered without the Pagefind UI script, stylesheet, modal markup, or trigger button — useful for shaving the index, WASM, and UI bundle when search is not needed. |
| `search.showImages`     | `boolean`  | `false` | Whether to display page thumbnail images in search results.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `search.showSubResults` | `boolean`  | `true`  | Whether to show sub-results (individual sections within a page) in search results. When enabled, Pagefind breaks pages into sections by heading and shows matching sections as separate results.                                                                                                                                                                                                                                                                                         |
| `search.pagefindFlags`  | `string[]` | `[]`    | Extra CLI flags passed directly to the Pagefind binary during the build step. Useful for advanced configuration like custom selectors or exclusion rules.                                                                                                                                                                                                                                                                                                                                |

Example:

```json5 title="pagesmith.config.json5"
search: {
  enabled: true,
  showImages: false,
  showSubResults: true,
  pagefindFlags: ['--verbose'],
}
```

The Pagefind component-UI script is loaded as a `<script type="module">` and would normally auto-detect its bundle path from the script's URL — except `document.currentScript` is `null` for module scripts, so detection silently falls back to `/pagefind/` and breaks every sub-path deploy. To keep search working under any `basePath`, Pagesmith emits an explicit `<pagefind-config bundle-path="<basePath>/pagefind/">` element directly before the loader script. You never need to set this manually.

### Theme Configuration

| Field                      | Type                          | Default     | Description                                                                                                                                                                        |
| -------------------------- | ----------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme.lightColor`         | `string`                      | `"#f8fafc"` | The `theme-color` meta tag value for light mode. Affects the browser chrome color on mobile devices.                                                                               |
| `theme.darkColor`          | `string`                      | `"#020617"` | The `theme-color` meta tag value for dark mode.                                                                                                                                    |
| `theme.defaultColorScheme` | `'auto' \| 'light' \| 'dark'` | `'auto'`    | Initial color scheme class on `<html>`. `'auto'` follows OS preference via `color-scheme: light dark`. `'light'` or `'dark'` forces a single scheme.                               |
| `theme.defaultTheme`       | `'paper' \| 'high-contrast'`  | `'paper'`   | Initial theme variant class on `<html>`. Controls which set of CSS token overrides is active. See the [Theming](../theming/README.md) reference.                                   |
| `theme.layouts`            | `Record<string, string>`      | `{}`        | A map of layout names to file paths for overriding the default theme layouts. Paths are resolved relative to the project root (the directory containing `pagesmith.config.json5`). |
| `theme.socialImage`        | `string`                      | auto-detect | Path to default Open Graph social sharing image. Checked in order: config value, then `public/og-image.png` (or `.jpg`). Per-page override via `socialImage` frontmatter.          |

The default theme provides three built-in layout keys:

| Layout Key | Default Component | Description                                               |
| ---------- | ----------------- | --------------------------------------------------------- |
| `home`     | `DocHome`         | Landing page with hero section and features grid          |
| `page`     | `DocPage`         | Standard 3-column documentation page with sidebar and TOC |
| `notFound` | `DocNotFound`     | 404 error page                                            |

When overriding a layout, the module must export a component function as `default` or as one of the recognized named exports:

- `home`: `default`, `DocHome`, or `Home`
- `page`: `default`, `DocPage`, or `Page`
- `notFound`: `default`, `DocNotFound`, or `NotFound`

Custom layouts referenced in `meta.json5` section configuration (via `layout` or `itemLayout`) must also be registered in `theme.layouts`.

Example:

```json5 title="pagesmith.config.json5"
theme: {
  lightColor: '#ffffff',
  darkColor: '#0a0a0a',
  layouts: {
    home: './theme/layouts/CustomHome.tsx',
    page: './theme/layouts/CustomPage.tsx',
  },
}
```

### Edit Link

| Field             | Type                                                         | Default            | Description                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editLink`        | `{ repo: string; branch?: string; label?: string } \| false` | auto-detected      | Edit link configuration. When omitted, Pagesmith tries to infer the repository URL from a supported git remote (`GitHub`, `GitLab`, or `Bitbucket`). Set `false` to disable the default edit link. |
| `editLink.repo`   | `string`                                                     | auto-detected      | Repository URL (e.g. `"https://github.com/user/repo"`). When set, an "Edit this page" link appears on every documentation page.                                                                    |
| `editLink.branch` | `string`                                                     | `"main"`           | Branch name for the edit link URL.                                                                                                                                                                 |
| `editLink.label`  | `string`                                                     | `"Edit this page"` | Custom label for the edit link.                                                                                                                                                                    |

Example:

```json5 title="pagesmith.config.json5"
editLink: {
  repo: 'https://github.com/my-org/my-project',
  branch: 'main',
},
```

The edit link generates a URL like `https://github.com/my-org/my-project/edit/main/docs/content/guide/getting-started/README.md` pointing to the source file of each page.

### Last Updated

| Field         | Type      | Default | Description                                                                                                                                                         |
| ------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lastUpdated` | `boolean` | `true`  | Show a git-based "last updated" timestamp on each documentation page. Uses `git log` to determine when each content file was last modified. Set `false` to opt out. |

Example:

```json5 title="pagesmith.config.json5"
lastUpdated: true,
```

When enabled, each page displays a "Last updated: January 15, 2026" line below the content.

### Sitemap

| Field     | Type      | Default | Description                                                                                                                                   |
| --------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `sitemap` | `boolean` | `true`  | Generate `sitemap.xml` during build. Skipped when `origin` is still the placeholder value (`https://example.com`). Set to `false` to disable. |

The sitemap is generated from all non-draft pages and placed at the build output root. Generation delegates to `@pagesmith/site/ssg-utils`'s `generateSitemap()` serializer -- the same one custom `@pagesmith/site` sites can call directly -- so the emitted XML format is identical either way.

### Analytics Configuration

| Field                       | Type     | Default     | Description                                                                                                                                          |
| --------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analytics.googleAnalytics` | `string` | `undefined` | Google Analytics measurement ID (e.g. `"G-XXXXXXXXXX"`). When provided, the Google Analytics script tags are automatically injected into every page. |

Example:

```json5 title="pagesmith.config.json5"
analytics: {
  googleAnalytics: 'G-ABC123DEF4',
}
```

### Markdown Configuration

The `markdown` field accepts a JSON-safe subset of `MarkdownConfig` for the docs package's shared pipeline.

| Field                                   | Type                              | Default                                          | Description                                                                                                                                               |
| --------------------------------------- | --------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdown.allowDangerousHtml`           | `boolean`                         | `true`                                           | Preserve raw HTML from markdown. Disable this when rendering untrusted content.                                                                           |
| `markdown.math`                         | `boolean \| 'auto'`               | `'auto'`                                         | Always enable math plugins, disable them, or auto-enable them only for markdown that contains math markers.                                               |
| `markdown.images`                       | `object`                          | `undefined`                                      | Loading-hint behavior for in-flow content images (validated by the docs package's `.strict()` `DocsMarkdownConfigSchema` -- no other keys allowed).       |
| `markdown.images.lazyLoading`           | `boolean`                         | `true`                                           | Emit `loading`/`decoding`/`fetchpriority` hints on content images. `false` adds no loading attributes at all.                                             |
| `markdown.images.eagerCount`            | `number`                          | `1`                                              | Leading images (document order) marked eager with `fetchpriority="high"` instead of lazy. `0` makes every image lazy.                                     |
| `markdown.shiki`                        | `object`                          | `undefined`                                      | Configuration for syntax highlighting in the built-in code renderer.                                                                                      |
| `markdown.shiki.themes`                 | `{ light: string; dark: string }` | `{ light: "github-light", dark: "github-dark" }` | Dual theme names for light and dark mode syntax highlighting. Any Shiki-supported theme name is accepted.                                                 |
| `markdown.shiki.langAlias`              | `Record<string, string>`          | `undefined`                                      | Map of custom language aliases to language identifiers. For example, `{ "dockerfile": "docker" }` lets you use `dockerfile` as a code block language tag. |
| `markdown.shiki.defaultShowLineNumbers` | `boolean`                         | `true`                                           | Whether to show line numbers on code blocks by default. Individual blocks can override this with `showLineNumbers=false`.                                 |

Function-based `remarkPlugins` and `rehypePlugins` are not supported in `pagesmith.config.json5`. Use the lower-level `@pagesmith/core` APIs when you need custom plugin code.

Example:

```json5 title="pagesmith.config.json5"
markdown: {
  allowDangerousHtml: true,
  math: 'auto',
  images: {
    eagerCount: 2, // treat the first two images as eager instead of the default 1
  },
  shiki: {
    themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    langAlias: { hbs: 'handlebars' },
    defaultShowLineNumbers: false,
  },
}
```

### Home Page Configuration

| Field             | Type     | Default                | Description                                                                                                                                                                                                                                                                    |
| ----------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `home.configFile` | `string` | `"content/home.json5"` | Path to a JSON5 file containing home page data (hero content, feature cards, etc.). Resolved relative to the project root. The home page layout reads this file for its structured content when the home page markdown frontmatter does not provide `hero` or `features` data. |

### Packages Configuration

| Field      | Type                                | Default     | Description                                                                                                                                                                                                                                                        |
| ---------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages` | `Record<string, { label: string }>` | `undefined` | Multi-package navigation labels. Maps a section slug (matching a top-level directory in `contentDir`) to a display label. Useful for monorepo documentation sites that cover multiple packages, allowing each section to carry a distinct label in the navigation. |

Example:

```json5 title="pagesmith.config.json5"
packages: {
  core: { label: '@pagesmith/core' },
  docs: { label: '@pagesmith/docs' },
}
```

## Section-Level Configuration (meta.json5)

In addition to the root `pagesmith.config.json5`, each content section (top-level directory in `contentDir`) can have a `meta.json5` file and the content root itself can have one.

Use these version-matched schema files when generating or validating them:

- `node_modules/@pagesmith/docs/schemas/docs-root-meta.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`

### Root meta.json5 (content/meta.json5)

Controls the root-level navigation and site-wide overrides:

```ts title="DocsRootMeta Type"
type FooterLink = {
  label: string;
  path: string;
};

type FooterLinkGroup = {
  header?: string;
  links: FooterLink[];
};

type DocsRootMeta = {
  displayName?: string;
  description?: string;
  headerLinks?: FooterLink[];
  footerLinks?: FooterLink[] | FooterLinkGroup[];
};
```

Example:

```json5 title="content/meta.json5"
{
  headerLinks: [
    { label: "Guide", path: "/guide" },
    { label: "Reference", path: "/reference" },
  ],
  footerLinks: [
    {
      header: "Docs",
      links: [
        { label: "Guide", path: "/guide" },
        { label: "Reference", path: "/reference" },
      ],
    },
  ],
}
```

### Section meta.json5 (content/\<section\>/meta.json5)

Controls section-level behavior:

```ts title="DocsSectionMeta Type"
type DocsSectionMeta = {
  displayName?: string; // Section heading in sidebar
  description?: string;
  layout?: string; // Layout for this section's index page
  itemLayout?: string; // Layout for items within this section
  orderBy?: "manual" | "publishedDate";
  collapsed?: boolean; // Start collapsed (when sidebar.collapsible is true)
  items?: string[]; // Manual ordering of items by slug
  series?: Array<{
    slug: string;
    displayName: string;
    shortName?: string;
    description?: string;
    articles: string[];
  }>;
};
```

Example:

```json5 title="content/guide/meta.json5"
{
  displayName: "Guide",
  items: ["getting-started", "collections-and-loaders", "validation-and-rendering"],
}
```

The `series` field allows grouping related articles under a named series, which is useful for multi-part tutorials or sequential learning paths.

### Auto-generated Build Files

The build automatically generates these files in the output directory:

| File          | Condition                                            | Description                                                                             |
| ------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `.nojekyll`   | Always                                               | Prevents GitHub Pages from ignoring `_`-prefixed directories (required for Pagefind).   |
| `sitemap.xml` | `origin` is set and `sitemap` is not `false`         | XML sitemap of all non-draft pages for search engine indexing.                          |
| `robots.txt`  | Not already in output (from `publicDir` or `assets`) | Basic robots.txt with `Allow: /` and a `Sitemap:` reference when sitemap was generated. |

Additionally, `llms.txt` and `llms-full.txt` are automatically copied from the project root to the build output if they exist — no `assets` mapping needed.

## Complete Example

Here is a complete `pagesmith.config.json5` showing all available fields:

```json5 title="pagesmith.config.json5"
{
  $schema: "./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json",
  // Site metadata
  name: "My Project",
  title: "My Project Documentation",
  description: "Comprehensive documentation for My Project",
  origin: "https://my-project.dev",
  language: "en",

  // Directory paths
  contentDir: "./content",
  outDir: "./gh-pages",
  publicDir: "./public",

  // Deployment base path
  basePath: "/my-project",

  // Header logo link override
  homeLink: "/",

  // Footer attribution
  maintainer: {
    name: "Sujeet Jaiswal",
    link: "https://sujeet.pro",
  },

  // Footer copyright
  copyright: {
    projectName: "My Project",
    startYear: 2024,
    endYear: null,
  },

  // Footer navigation
  footerLinks: [
    {
      header: "Docs",
      links: [
        { label: "Guide", path: "/guide" },
        { label: "API", path: "/reference" },
      ],
    },
    {
      header: "Project",
      links: [{ label: "GitHub", path: "https://github.com/org/my-project" }],
    },
  ],

  // Sidebar behavior
  sidebar: {
    collapsible: true,
  },

  // Search (Pagefind)
  search: {
    enabled: true,
    showImages: false,
    showSubResults: true,
  },

  // Theme customization
  theme: {
    lightColor: "#ffffff",
    darkColor: "#111111",
    defaultColorScheme: "auto", // 'auto' | 'light' | 'dark'
    defaultTheme: "paper", // 'paper' | 'high-contrast'
    layouts: {
      home: "./theme/CustomHome.tsx",
    },
    socialImage: "/og-image.png",
  },

  // Edit link on each page (auto-detected from git remotes when omitted)
  editLink: {
    repo: "https://github.com/org/my-project",
    branch: "main",
  },

  // Git-based last updated timestamps
  lastUpdated: true,

  // Sitemap generation
  sitemap: true,

  // Analytics
  analytics: {
    googleAnalytics: "G-XXXXXXXXXX",
  },

  // Markdown pipeline
  markdown: {
    shiki: {
      themes: { light: "github-light", dark: "github-dark" },
    },
  },

  // Home page data source
  home: {
    configFile: "./content/home.json5",
  },

  // Multi-package labels
  packages: {
    core: { label: "@pagesmith/core" },
    docs: { label: "@pagesmith/docs" },
  },

  // Server settings shared by `pagesmith-docs dev` and `pagesmith-docs preview`.
  server: {
    host: "127.0.0.1",
    devPort: 3000, // number or 'auto' (scan upward from 4000)
    previewPort: 4000,
    strictPort: false,
    logLevel: "info", // 'silent' | 'error' | 'warn' | 'info' | 'verbose'
  },
}
```

## Server

A single `server` block configures both `pagesmith-docs dev` and `pagesmith-docs preview`. Every field is optional.

| Field         | Type                                                   | Default       | Description                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `host`        | `string`                                               | `'127.0.0.1'` | Interface to bind the dev and preview servers to. Use `0.0.0.0` only when you intentionally want LAN exposure.                                                                                                               |
| `devPort`     | `number \| 'auto'`                                     | `3000`        | Port for `pagesmith-docs dev`. Pass a number, or the literal `'auto'` to scan upward from `4000` for the first available port at startup. Any string that is not `'auto'` and not a valid port number throws a config error. |
| `previewPort` | `number \| 'auto'`                                     | `4000`        | Port for `pagesmith-docs preview`. Pass a number, or `'auto'` to scan upward from `4000` for the first available port.                                                                                                       |
| `strictPort`  | `boolean`                                              | `false`       | When the resolved port is a number and is already in use, fail instead of scanning for the next available port. Ignored when the port is `'auto'`.                                                                           |
| `logLevel`    | `'silent' \| 'error' \| 'warn' \| 'info' \| 'verbose'` | `'info'`      | Log level for the dev and preview servers. The CLI `--log-level` flag overrides this value.                                                                                                                                  |

The `--port` CLI flag also accepts `auto`. A numeric `--port` forces `strictPort` for that run (so you get a clear failure if the port is busy); `--port auto` always scans for the next free port from `4000`.

## Resolved Configuration

Internally, the user config is resolved into a `ResolvedDocsConfig` with absolute paths and applied defaults. The full resolved type is:

```ts title="ResolvedDocsConfig"
type ResolvedDocsConfig = {
  rootDir: string; // Directory containing pagesmith.config.json5
  contentDir: string; // Absolute path to content directory
  outDir: string; // Absolute path to output directory
  publicDir: string; // Absolute path to public directory
  basePath: string; // Resolved base path (no trailing slash)
  homeLink?: string; // Header logo link destination
  maintainer?: {
    name: string;
    link?: string;
  };
  name: string; // Resolved site name
  title: string; // Resolved site title
  description: string; // Resolved description
  origin: string; // Resolved origin URL
  language: string; // Resolved language code
  footerLinks: FooterLink[] | FooterLinkGroup[];
  footerText?: string;
  copyright?: {
    projectName: string;
    startYear: number;
    endYear?: number;
  };
  sidebar: {
    collapsible: boolean; // Defaults to true
  };
  search: {
    enabled: boolean; // Defaults to true
    showImages: boolean; // Defaults to false
    showSubResults: boolean; // Defaults to true
    pagefindFlags: string[];
  };
  editLink?: { repo: string; branch: string; label: string; editPattern: string };
  lastUpdated: boolean; // Defaults to true
  sitemap: boolean; // Defaults to true
  socialImage?: string;
  favicon: string | false; // Resolved favicon path (false disables)
  icon: string | false; // Resolved icon/logo path (false disables)
  appleTouchIcon: string | false;
  faviconFallback: string | false;
  theme?: {
    lightColor?: string;
    darkColor?: string;
    defaultColorScheme?: string;
    defaultTheme?: string;
    layouts?: Record<string, string>;
  };
  analytics?: { googleAnalytics?: string };
  markdown?: MarkdownConfig;
  homeConfigFile?: string; // Absolute path to home config JSON5
  packages?: Record<string, { label: string }>;
  assets: Map<string, string[]>; // Resolved asset mappings
  server: {
    host: string; // Defaults to '127.0.0.1'
    devPort: number | "auto"; // Defaults to 3000
    previewPort: number | "auto"; // Defaults to 4000
    strictPort: boolean; // Defaults to false (ignored when port is 'auto')
    logLevel: "silent" | "error" | "warn" | "info" | "verbose"; // Defaults to 'info'
  };
};
```

The resolution logic in `resolveDocsConfig()` works as follows:

- `rootDir` is set to the directory containing `pagesmith.config.json5`.
- `contentDir`, `outDir`, and `publicDir` are resolved to absolute paths from `rootDir`.
- `basePath` follows the priority chain: CLI `--base-path` > non-root `BASE_URL` env > config `basePath` > auto-detected from git remote (repo name) > `"/"`. Trailing slashes are stripped.
- `name` falls back to `title`, then package.json `name` (scope stripped), then directory name.
- `title` falls back to `name`, then package.json `name` (scope stripped), then directory name.
- `name`, `title`, `description`, and `origin` fall back to package.json fields before using placeholder defaults.
- `maintainer` falls back to the parsed `package.json` `author` field when not explicitly configured.
- `contentDir` resolves to `docs/` if the directory exists, otherwise `content/`.
- `footerLinks` fall back to the major top-level nav items when not explicitly configured in config or root `meta.json5`.
- `sidebar.collapsible` defaults to `true`.
- `search.enabled` defaults to `true`, `search.showImages` defaults to `false`, `search.showSubResults` defaults to `true`.
- `editLink` is auto-detected from supported git remotes unless set to `false`.
- `homeConfigFile` resolves to the absolute path of `home.configFile` or defaults to `content/home.json5` in the project root.
- `server.host` defaults to `'127.0.0.1'`, `server.devPort` defaults to `3000`, `server.previewPort` defaults to `4000`, `server.strictPort` defaults to `false`, and `server.logLevel` defaults to `'info'`. Either port may be set to the literal `'auto'` to scan upward from `4000` for the first available port at server startup. A non-`'auto'` string that is not a valid port number throws a config error.
