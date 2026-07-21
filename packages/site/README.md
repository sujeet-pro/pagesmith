# `@pagesmith/site`

Site toolkit for Pagesmith.

`@pagesmith/site` builds on `@pagesmith/core` internally and provides the app-facing package surface once you move from "content layer" to "site": the preset-driven `pagesmith-site` CLI, the Vite SSG plugin, the JSX-to-HTML runtime, reusable chrome/layout components, shared CSS bundles, browser runtime helpers, small SSG utilities used by the first-party examples, and re-exported content-layer APIs for site consumers.

Use `@pagesmith/core` when you only want the headless content layer. Use `@pagesmith/site` when the project wants the content layer plus Pagesmith's site shell, build pipeline, JSX runtime, or shared presentation/runtime layer from one package.

## Requirements

- Node.js 24+
- ESM projects (`@pagesmith/site` is published as ESM)

## Install

```bash
npm add @pagesmith/site
```

If you are building a docs site with the default Pagesmith docs preset, install `@pagesmith/docs` instead; it brings the docs preset plus the underlying site/content dependencies with it.

## Choose The Package

- Use `@pagesmith/core` when you only need a headless content layer.
- Use `@pagesmith/site` when you are building a custom site, blog, portfolio, framework-based static site, or an existing app that wants Pagesmith's shared JSX chrome, layouts, CSS, runtime layer, and re-exported content APIs from one package.
- Use `@pagesmith/docs` when you want the opinionated docs preset and default docs theme.

## Adoption Paths

- AI-first bootstrap or retrofit: start with `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`
- Follow-up usage patterns and prompts: `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md`
- Upgrade an existing integration: start with `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/migration.md`
- Manual setup: follow the Vite, JSX, CSS/runtime, and CLI sections below

## Setup Prompt

For agent-driven setup in an existing repository, start with the dedicated prompt file:

- Package path: `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`
- Hosted URL: [https://projects.sujeet.pro/pagesmith/prompts/setup-site.md](https://projects.sujeet.pro/pagesmith/prompts/setup-site.md)

## Quick Start

### Vite site

Define collections with `@pagesmith/site`, then add the site-building plugins from the same package:

```ts
import { defineConfig } from "vite";
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";
import collections from "./content.config";

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({
      entry: "./src/entry-server.tsx",
      contentDirs: ["./content"],
    }),
  ],
});
```

`@pagesmith/site` re-exports the content-layer APIs from `@pagesmith/core`, so a site-based app can keep collection, schema, loader, and Vite-plugin imports on `@pagesmith/site` unless it intentionally wants the lower-level core package.

Your SSR entry should export:

```ts
import type { SsgRenderConfig } from "@pagesmith/site/vite";

export function getRoutes(config: SsgRenderConfig): string[] {
  return ["/"];
}

export function render(url: string, config: SsgRenderConfig): string | Promise<string> {
  return "<!DOCTYPE html><html><body>Hello</body></html>";
}
```

### RSS feed and sitemap

`pagesmithSsg`'s optional `beforeBuild` hook runs once before the SSR/prerender pipeline -- a good place to write generated static files like `rss.xml` or `sitemap.xml` using the shared `@pagesmith/site/ssg-utils` serializers:

```ts title="vite.config.ts"
import { writeFileSync } from "fs";
import { generateFeed, generateSitemap } from "@pagesmith/site/ssg-utils";
import { pagesmithSsg } from "@pagesmith/site/vite";

pagesmithSsg({
  entry: "./src/entry-server.tsx",
  async beforeBuild({ outDir, config }) {
    const basePath = config.base.replace(/\/+$/, "");
    const posts = await loadPosts(); // however this project loads dated entries

    writeFileSync(
      `${outDir}/rss.xml`,
      generateFeed(posts, {
        origin: "https://example.com",
        basePath,
        title: "Example Blog",
        description: "Latest posts",
        language: "en",
      }),
    );

    writeFileSync(
      `${outDir}/sitemap.xml`,
      generateSitemap(["", ...posts.map((p) => p.path)], {
        origin: "https://example.com",
        basePath,
      }),
    );
  },
});
```

A thrown error inside `beforeBuild` aborts the build with a clear `pagesmithSsg beforeBuild hook failed: ...` message. `@pagesmith/docs` uses the same `generateSitemap` internally, so custom `@pagesmith/site` builds get an identical sitemap format for free.

### SEO structured data

`SiteDocument` emits schema.org JSON-LD alongside its existing Open Graph/Twitter tags whenever `seo.jsonLd` is not explicitly `false` (the default is `true`): an `Article`/`BlogPosting` block for article pages, or a `WebSite` block when you pass `isHome`. Use `buildArticleStructuredData`, `buildWebsiteStructuredData`, and `serializeJsonLd` directly if you render your own document shell instead of `SiteDocument`.

### JSX runtime

For Pagesmith's server-side JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

```tsx
import { Fragment } from "@pagesmith/site/jsx-runtime";

export function Page({ title, content }: { title: string; content: string }) {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <Fragment innerHTML={content} />
      </body>
    </html>
  );
}
```

### Reusable site components

`@pagesmith/site` now owns the reusable chrome that the default docs theme consumes: document shell, header, sidebar, TOC variants, footer controls, listing cards, and the 3-column page shell.

```tsx
import { SiteDocument, ListingCards } from "@pagesmith/site/components";
import { PageShell } from "@pagesmith/site/layouts";

export function DocsPage({ site, slug, headings, sidebarSections, content }) {
  return (
    <SiteDocument title={site.title} site={site}>
      <PageShell
        site={site}
        currentPath={slug}
        headings={headings}
        sidebarSections={sidebarSections}
      >
        <div class="prose" innerHTML={content} />
        <ListingCards
          cards={[
            {
              title: "Release Notes",
              path: "/guide/releases",
              description: "Recent changes and migration notes.",
              meta: [{ label: "Updated", value: "Apr 2026" }],
            },
          ]}
        />
      </PageShell>
    </SiteDocument>
  );
}
```

### CSS and runtime

Import static CSS bundles from the `css/*` subpaths:

```css
@import "@pagesmith/site/css/chrome";
@import "@pagesmith/site/css/content";
@import "@pagesmith/site/css/fonts";
```

Bundle CSS/runtime by scope:

- Use `@pagesmith/site/css/chrome` with `@pagesmith/site/runtime/chrome` when you want the shared header/sidebar/TOC/footer/listing UI without pulling in the markdown prose layer.
- Use `@pagesmith/site/css/standalone` with `@pagesmith/site/runtime/standalone` when the page uses the full Pagesmith site shell plus prose and code-block UI.
- Use `@pagesmith/site/css/content` with `@pagesmith/site/runtime/content` when another framework owns layout and you only want the shared markdown presentation layer.

Use the browser runtime entry points when you want built-in code-block behavior, TOC highlighting, sidebar toggles, or theme/font-size persistence:

```ts
import "@pagesmith/site/runtime/chrome";
import "@pagesmith/site/runtime/content";
```

For Vite-based TSX apps, this is the recommended pairing: render with `@pagesmith/site/components` / `@pagesmith/site/layouts`, then import the matching `css/*` and `runtime/*` entries from the same package so the shared chrome keeps its behavior with minimal app-local glue.

## CLI

`@pagesmith/site` publishes the `pagesmith-site` binary. The package also keeps `pagesmith` as a compatibility alias, but `pagesmith-site` is the canonical package-owned command.

Commands:

- `pagesmith-site dev`
- `pagesmith-site build`
- `pagesmith-site preview`
- `pagesmith-site init`
- `pagesmith-site mcp` (only when the active preset implements MCP; use `pagesmith-docs mcp` for the built-in docs server)
- `pagesmith skills install` — umbrella command (uses the `pagesmith` alias) that writes versioned-pointer skill stubs from every resolvable `@pagesmith/*` package; see [Install consumer Agent Skills](#install-consumer-agent-skills) below

### Install consumer Agent Skills

```bash
npx pagesmith skills install
```

Writes a canonical pointer stub — not a copy — at `.agents/skills/<name>/SKILL.md` for every skill each resolvable `@pagesmith/*` package ships, plus thin mirror stubs under detected/requested harnesses (`.claude/skills/`, `.cursor/skills/`, `.codex/skills/`, `.continue/skills/`). Each stub links back to the version-pinned original in `node_modules` and carries an HTML-comment version marker, so re-running after an upgrade refreshes stale stubs. Useful flags: `--package <pkg>` (repeatable), `--dir <path>`, `--harness <list>`, `--only <name>`, `--check` (verify-only, nonzero exit on a missing/stale/orphaned stub — good for CI), `--dry-run`, `--json`. `pagesmith-core skills` still works as a deprecated alias for the same installer.

Important behavior:

- The CLI is preset-driven.
- The package-owned fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset has been selected.
- Override the active preset with `--preset`, `PAGESMITH_PRESET`, or top-level `preset` / `presets` in `pagesmith.config.json5`.
- Use `pagesmith-docs` when you want the built-in docs workflow from `@pagesmith/docs`.

## Config Helpers

Available from `@pagesmith/site`:

- `defineSiteConfig(config)`
- `loadSiteConfig(configPath?)` (raw JSON5 parse)
- `parseSiteConfig(config)` (schema-backed validation)
- `normalizeBasePath(basePath)`
- `normalizePresetSpecifier(value)`
- `resolveSitePresetSpecifier(configPath?, fallback?)`
- `stripBasePath(url, basePath)`
- `withBasePath(basePath, path)`
- `withTrailingSlash(path)`

Scoped Pagesmith package names are normalized to `/preset`, for example `preset: '@pagesmith/docs'` becomes `@pagesmith/docs/preset`.

For typed custom-site config, `@pagesmith/site/schemas` exports `SiteUserConfigSchema` plus the related footer, search, theme, analytics, server, and sidebar schema helpers.

## Public Exports

### Main entry

- `@pagesmith/site`
- `@pagesmith/site/markdown`
- `@pagesmith/site/schemas`
- `@pagesmith/site/loaders`
- `@pagesmith/site/assets`
- `@pagesmith/site/config`
- `@pagesmith/site/preset`

### JSX

- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/jsx-dev-runtime`

### CSS

- `@pagesmith/site/css`
- `@pagesmith/site/css/chrome`
- `@pagesmith/site/css/content`
- `@pagesmith/site/css/standalone`
- `@pagesmith/site/css/code-block`
- `@pagesmith/site/css/code-inline`
- `@pagesmith/site/css/tabs`
- `@pagesmith/site/css/viewport`
- `@pagesmith/site/css/fonts`

### Runtime

- `@pagesmith/site/runtime`
- `@pagesmith/site/runtime/chrome`
- `@pagesmith/site/runtime/content`
- `@pagesmith/site/runtime/standalone`
- `@pagesmith/site/runtime/code-blocks`
- `@pagesmith/site/runtime/code-tabs`
- `@pagesmith/site/runtime/footer-year`
- `@pagesmith/site/runtime/search-trigger`
- `@pagesmith/site/runtime/sidebar`
- `@pagesmith/site/runtime/skip-link`
- `@pagesmith/site/runtime/toc-highlight`
- `@pagesmith/site/runtime/theme`

### Components / Layouts / Theme

- `@pagesmith/site/components`
- `@pagesmith/site/layouts`
- `@pagesmith/site/theme`

### Vite / SSG

- `@pagesmith/site/vite`
- `@pagesmith/site/ssg-utils`
- `@pagesmith/site/build-validator`

## Further Reading

- `REFERENCE.md`
- `skills/pagesmith-site-setup/references/setup-site.md`
- `skills/pagesmith-site-setup/references/site-guidelines.md`
- `skills/pagesmith-site-setup/references/usage.md`
- `../core/README.md`
- `../docs/README.md`

## License

MIT
