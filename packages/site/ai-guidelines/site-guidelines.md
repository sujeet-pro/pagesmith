# `@pagesmith/site` Guidelines

Guide for AI assistants using `@pagesmith/site`.

`@pagesmith/site` is the Pagesmith site toolkit and the app-facing package for site consumers. It is not the headless content layer, but it does re-export the core content APIs that site-based apps typically need.

## Read This First

- `node_modules/@pagesmith/site/README.md`
- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- `node_modules/@pagesmith/core/REFERENCE.md`

## What Lives In `@pagesmith/site`

- `pagesmith-site` CLI
- preset loading and config helpers
- site config schemas (`SiteUserConfigSchema` and related helpers)
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/components`
- `@pagesmith/site/layouts`
- `@pagesmith/site/theme`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/vite`
- `@pagesmith/site/ssg-utils`

## What Does Not Live Here

Do not treat `@pagesmith/site` as a separate content store. It re-exports core content APIs, but the underlying content-layer implementation still lives in `@pagesmith/core`.

These responsibilities originate in `@pagesmith/core` and are re-exported through `@pagesmith/site` for site consumers:

- `defineCollection`
- `defineCollections`
- `defineConfig`
- `createContentLayer`
- `processMarkdown`
- `pagesmithContent`
- collection schemas and loaders

## Integration Rules

### Vite

Split imports by responsibility:

```ts
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

### Framework host / existing app

When another app owns routing and build tooling, keep Pagesmith limited to the shared presentation layer:

```ts
import '@pagesmith/site/css/content'
import '@pagesmith/site/runtime/content'
```

In that shape, `createContentLayer()` and `entry.render()` can come from `@pagesmith/site`, while `@pagesmith/site` also provides the shipped markdown CSS/runtime.

When the project wants the shared Pagesmith chrome itself, use the exported components/layouts instead of copying the docs theme:

```tsx
import { SiteDocument, SiteHeader, SiteFooter } from '@pagesmith/site/components'
import { PageShell } from '@pagesmith/site/layouts'
```

### JSX

For Pagesmith's server-side JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

### CSS / Runtime

- Use `@pagesmith/site/css/*` for shipped styles.
- Use `@pagesmith/site/runtime/*` for shipped browser behavior.
- Pair `css/chrome` with `runtime/chrome` for reusable site chrome.
- Pair `css/standalone` with `runtime/standalone` for full Pagesmith pages.
- Do not tell users to import CSS or runtime JS from `@pagesmith/core`.

## CLI Rules

- `pagesmith-site` is the canonical CLI published by `@pagesmith/site`.
- `pagesmith` remains a compatibility alias, but package docs should prefer `pagesmith-site`.
- The fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset has been selected.
- `--preset`, `PAGESMITH_PRESET`, and top-level `preset` / `presets` can override the active preset.
- Use `pagesmith-docs` instead of `pagesmith-site` when the project wants the built-in docs workflow from `@pagesmith/docs`.

## Behavior Notes

- `pagesmithSsg` owns dev SSR, build-time SSG, preview serving from disk, and Pagefind indexing.
- The default docs chrome is now implemented in `@pagesmith/site/components` and `@pagesmith/site/layouts`; `@pagesmith/docs` consumes those exports.
- Theme and text-size preferences persist in `localStorage('pagesmith-theme')`.
- TOC highlighting supports generic `[data-ps-toc]` selectors.
- The preview server serves current files from disk after rebuilds; do not document it as an in-memory snapshot.

## Theme-Aware Content

The shipped CSS bundles (`css/content`, `css/standalone`) include built-in support for theme-aware images and content. The `<html>` element carries `color-scheme-auto` (default), `color-scheme-light`, or `color-scheme-dark`.

Available utility classes:

| Class | Purpose |
|---|---|
| `.ps-figure` | Wrapper on all pipeline-generated `<figure>` elements |
| `.ps-figure-themed` | Added when a light/dark pair is auto-merged |
| `.only-light` | Show image only in light mode |
| `.only-dark` | Show image only in dark mode |
| `.show-on-light` | Show any element only in light mode |
| `.show-on-dark` | Show any element only in dark mode |
| `.invert-on-dark` | Invert image colors in dark mode |

Markdown images are automatically wrapped in `<figure class="ps-figure">` with `<picture>` for raster formats. Consecutive `-light`/`-dark` image pairs are auto-merged into `<figure class="ps-figure ps-figure-themed">` with `<source media="(prefers-color-scheme: dark)">`.

For manual HTML light/dark pairs:

```html
<figure>
  <img src="./diagram-light.svg" class="only-light" alt="Diagram">
  <img src="./diagram-dark.svg" class="only-dark" alt="Diagram">
</figure>
```

In `color-scheme-auto` mode, visibility follows the OS `prefers-color-scheme` media query. In explicit mode, the matching variant is forced.

## URL Strategy

The site config supports a `trailingSlash` option (default: `false`), which produces slash-free URLs by default.

- `formatPath(path, trailingSlash?)` — formats a URL path according to the trailing slash preference. Replaces the legacy `withTrailingSlash()` utility.
- `withBasePath()` — now normalizes non-slash-prefixed paths (e.g. `base=/x slug=a/b` produces `/x/a/b`).
- `normalizeOrigin()` — strips trailing slashes from origin URLs. Origin is normalized at parse time via Zod transform.

## Components

### HeroSection

Hero banner with badge, name, tagline, description, and action buttons.

```tsx
import { HeroSection } from '@pagesmith/site/components'
```

### ActionButtons

Primary/secondary button row, typically used inside a hero or landing section.

```tsx
import { ActionButtons } from '@pagesmith/site/components'
```

### ContentMeta

Displays published date, updated date, draft badge, and tags as pills.

```tsx
import { ContentMeta } from '@pagesmith/site/components'
```

Related CSS classes: `.site-hero-*`, `.site-action-*`, `.site-pill`, `.site-tag-list`, `.site-content-meta`.

## Layouts

### HomeLayout

Complete home page layout with hero section and footer.

```tsx
import { HomeLayout } from '@pagesmith/site/layouts'
```

### ListingLayout

Wraps `PageShell` with `SiteDocument` for listing/index pages.

```tsx
import { ListingLayout } from '@pagesmith/site/layouts'
```

### NotFoundLayout

Complete 404 page layout.

```tsx
import { NotFoundLayout } from '@pagesmith/site/layouts'
```

## SEO Meta

`SitePageMeta` type supports extended SEO fields:

- `ogType` — Open Graph type (e.g. `'article'`)
- `publishedTime` / `modifiedTime` — article timestamps
- `author` — article author
- `tags` — article tags

Generated meta tags include:

- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:site`
- Article meta: `article:author`, `article:published_time`, `article:modified_time`, `article:tag`

`SiteFooter` accepts an `extraContent` slot for additional footer content.

## Themed Images Runtime

The chrome runtime includes `initThemedImages()` for JavaScript-enhanced theme switching of `<figure class="ps-figure-themed">` elements:

- MutationObserver on `<html>` class for theme switch detection
- Uses `classList.contains()` for exact token matching
- WeakMap-based source caching for performance
- Proper observer cleanup on teardown

## When To Use `@pagesmith/docs` Instead

Use `@pagesmith/docs` when the project wants:

- docs conventions
- docs schemas
- docs navigation
- the docs preset and docs-specific data shaping
- docs MCP support

`@pagesmith/docs` is a preset on top of `@pagesmith/site`, and `pagesmith-docs` is the canonical CLI for that package.
