---
name: pagesmith-site-setup
description: Bootstrap a custom Pagesmith-powered site using @pagesmith/site when @pagesmith/docs is too opinionated. Use when the user wants Pagesmith's content layer, JSX runtime, CSS bundles, and SSG helpers but must keep full control of layouts, routing, or framework integration (React, Solid, Svelte, Next.js, plain templating).
allowed-tools: Bash(npx pagesmith-site *)
---

# Bootstrap A Custom Pagesmith Site

Use this skill when `@pagesmith/docs` is too restrictive — custom layouts, non-docs content type, mixed framework usage, marketing landing plus blog, etc. You get Pagesmith's content engine, JSX server runtime, shared CSS, TOC highlighting, search, and SSG, without the docs preset.

If the user wants docs specifically, prefer `pagesmith-docs-setup` instead.

## Read the locally installed reference first

Before editing config or running CLI commands, open `node_modules/@pagesmith/site/REFERENCE.md` and `node_modules/@pagesmith/core/REFERENCE.md` in the consumer's project. They are version-matched to the installed packages and authoritative for `pagesmith.config.json5`, the `pagesmith-site` CLI flags, the Vite plugin exports under `@pagesmith/site/vite` / `@pagesmith/core/vite`, the CSS/runtime entry points, and the JSX/component exports. If they disagree with this skill or general training data, follow the local files.

Always invoke the CLI through `npx pagesmith-site <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin`. Do not assume a globally installed `pagesmith-site` or `pagesmith` binary — it may be a different version with different flags.

If `@pagesmith/site` is not installed yet, run `npm add @pagesmith/site` first so the local `REFERENCE.md` exists.

## Prerequisites

- Node.js 24+.
- A repo with Vite or a Vite-friendly build system.
- `package.json` with `type: module`.

## Install

```bash
npm add @pagesmith/site pagefind
```

`pagefind` is optional — skip it if you are not using search.

## Create `pagesmith.config.json5`

```json5
{
  $schema: "./node_modules/@pagesmith/site/schemas/pagesmith-site.schema.json",
  name: "my-site",
  title: "My Site",
  description: "A custom Pagesmith site.",
  origin: "https://example.com",
  basePath: "/",
  contentDir: "./content",
  outDir: "./dist",
}
```

Notes:

- `origin` + `basePath` drive canonical URLs and sitemap. Use real production values even for local builds.
- `contentDir` is relative to the config file. Keep it inside the repo so CI can read it.
- `outDir` can be anything; `./dist` is conventional for non-docs sites.

## Define content collections

Create `content.config.ts` at the project root:

```ts
import { defineCollection, defineCollections, z } from "@pagesmith/core";

const posts = defineCollection({
  loader: "markdown",
  directory: "content/posts",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: "json5",
  directory: "content/authors",
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    links: z.record(z.string()).default({}),
  }),
});

export default defineCollections({ posts, authors });
```

Always import `z` from `@pagesmith/core` (re-exported from `@pagesmith/site`). Do **not** `import { z } from 'zod'` — Pagesmith pins its own Zod version.

See `pagesmith-core-add-collection` for more collection patterns (including shortcuts `blogCollection`, `projectsCollection`, `docsCollection`).

## Wire Vite

Prefer the convenience plugin — it composes content, SSG, and shared assets:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { pagesmithSite } from "@pagesmith/site/vite";
import collections from "./content.config";

export default defineConfig({
  plugins: [pagesmithSite({ collections })],
});
```

For fine-grained control, compose the underlying plugins yourself:

```ts
import { defineConfig } from "vite";
import { pagesmithContent } from "@pagesmith/core/vite";
import { pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";
import collections from "./content.config";

export default defineConfig({
  plugins: [
    pagesmithContent({ collections }),
    pagesmithSsg({ routes: ["/", "/about", "/blog"] }),
    sharedAssetsPlugin(),
  ],
});
```

## CSS bundles

`@pagesmith/site` ships CSS modules. Import only what you need:

```ts
import "@pagesmith/site/css/chrome"; // header/footer/shell
import "@pagesmith/site/css/content"; // prose typography
import "@pagesmith/site/css/code-block"; // fenced code blocks
import "@pagesmith/site/css/code-inline"; // inline code
import "@pagesmith/site/css/fonts"; // default typography stack
```

If you drop `fonts`, provide alternatives or typography breaks.

## Runtime JS (progressive enhancement)

Opt into the runtimes you actually want. Each is a tiny browser module that no-ops when its `data-ps-*` hook is absent:

```ts
import "@pagesmith/site/runtime/theme"; // color scheme / theme / text-size controls
import "@pagesmith/site/runtime/toc-highlight"; // active-heading highlighting in the TOC
import "@pagesmith/site/runtime/code-blocks"; // copy buttons + collapsible regions in code fences
import "@pagesmith/site/runtime/code-tabs"; // tab switching for grouped fences
import "@pagesmith/site/runtime/sidebar"; // collapsible sidebar + mobile sidebar modal
import "@pagesmith/site/runtime/search-trigger"; // Cmd/Ctrl-K + `[data-ps-search-trigger]`
import "@pagesmith/site/runtime/footer-year"; // auto-advance copyright year
import "@pagesmith/site/runtime/skip-link"; // focus management for the skip link
```

Convenience bundles:

- `@pagesmith/site/runtime/chrome` — wires header, sidebar, footer, TOC, theme controls.
- `@pagesmith/site/runtime/content` — wires code blocks + code tabs.
- `@pagesmith/site/runtime/standalone` — chrome + content bundle for single-script sites.

The hook attributes are on the `data-ps-*` prefix (legacy `data-theme-*`/`data-footer-*` aliases still work). For example: `data-ps-theme-toggle-button`, `data-ps-theme-dropdown`, `data-ps-toc`, `data-ps-code-copy`, `data-ps-code-collapse-toggle`, `data-ps-footer-scheme`, `data-ps-footer-theme`, `data-ps-footer-text-size`. When you write your own markup, keep these attributes on the interactive elements so the runtimes can find them.

## Layouts and components

```tsx
import { PageShell, HomeLayout, ListingLayout, NotFoundLayout } from "@pagesmith/site/layouts";
import {
  SiteDocument, // also exported as Html
  SiteHeader,
  SiteSidebar,
  SiteSidebarModal,
  SiteFooter,
  TableOfContents,
  AccordionTableOfContents,
  Breadcrumbs,
  ListingCards,
  ThemeDropdownControls,
  FooterThemeControls,
  HeroSection,
  ActionButtons,
  ContentMeta,
} from "@pagesmith/site/components";
```

Compose your own layout or use `PageShell` as a starting point. Keep `data-ps-*` attributes on the elements your runtimes target.

## Scripts

```json
{
  "scripts": {
    "dev": "pagesmith-site dev",
    "build": "pagesmith-site build",
    "preview": "pagesmith-site preview"
  }
}
```

`pagesmith-site` is the shipped bin. It honors `pagesmith.config.json5`, compiles JSX, handles SSG, and emits `outDir` on build.

## Framework integration templates

For opinionated starting points, copy from the Pagesmith examples repo:

- React SSR → `examples/frameworks/with-react/`
- Solid SSR → `examples/frameworks/with-solid/`
- Svelte SSR → `examples/frameworks/with-svelte/`
- Next.js → `examples/frameworks/with-nextjs/`
- Vanilla EJS / Handlebars → `examples/frameworks/with-vanilla-ejs/`, `examples/frameworks/with-vanilla-hbs/`

Each example has its own `vite.config.ts`, entry, server, and layout. Treat them as reference implementations, not libraries.

## Verify

1. `npx pagesmith-site dev` — content collections resolve, TOC highlight works on sample pages.
2. `npx pagesmith-site build` — exits 0, `outDir` contains HTML and assets.
3. `npx pagesmith-site preview` — serves from `outDir`.
4. Visit a page; confirm progressive enhancement (theme toggle, code copy) works.

## Gotchas

- Don't mix `pagesmith-docs` and `pagesmith-site` bins for the same site — pick one. `pagesmith-docs` is `pagesmith-site` with the docs preset pre-attached.
- Keep `origin` blank-safe — some SSG code assumes `origin` is a full URL. Do not pass `null` or an empty string.
- Shared CSS classes use `pagesmith-` prefixes. Do not rely on internal class names that are undocumented.
- The JSX runtime is server-only — it compiles to strings. Client-side React/Vue hydration requires your own wiring.
- When an `@pagesmith/docs` preset also fits, it's faster to use `pagesmith-docs-setup` and override via `pagesmith-docs-customize-theme`. Only bootstrap a custom site when the preset is a poor fit.

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `./references/setup-site.md`
- `./references/site-guidelines.md`
- `./references/usage.md`
- `./references/recipes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
