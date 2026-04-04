# Pagesmith

Pagesmith is a filesystem-first content toolkit organized as a multi-package workspace under the `@pagesmith/` npm scope.

Two main user-facing packages: `@pagesmith/core` for the shared content/runtime layer and `@pagesmith/docs` for convention-based documentation built on top of core.

## What matters most

- **`@pagesmith/core`** (`packages/core/`) — Content layer, markdown pipeline (Expressive Code for syntax highlighting), JSX runtime, CSS builder, schemas, loaders, validation, `z` re-export, and Vite plugins (`pagesmithContent`, `pagesmithSsg`) at `@pagesmith/core/vite`.
- **`@pagesmith/docs`** (`packages/docs/`) — Docs-site implementation on top of core: build/dev/preview CLI, default theme, bundled Pagefind search, nav/sidebar generation from `content/`, layout overrides through `theme.layouts.*`, asset mapping via `assets`, and config validation in `pagesmith.config.json5`. Features include `editLink` ("Edit this page" links), `lastUpdated` (git-based timestamps), auto-generated breadcrumbs, parallel page building, and an incremental dev server that skips CSS/JS/Pagefind for content-only changes. Default output is `gh-pages/`. Hosted at `projects.sujeet.pro/pagesmith`.
- The root docs site in [`docs/`](/Users/sujeet/personal/pagesmith/docs) uses the default docs package setup.
- [`examples/doc-site/`](/Users/sujeet/personal/pagesmith/examples/doc-site) demonstrates docs layout overrides.
- [`examples/blog-site/`](/Users/sujeet/personal/pagesmith/examples/blog-site) demonstrates a custom site built on `@pagesmith/core` with its own layouts and asset pipeline.
- Framework examples in `examples/with-*` demonstrate integration with React, Solid, Svelte, EJS, and Handlebars.
- Assistant artifact generation via CLI: `npx pagesmith init --ai`.
- MCP servers: `@pagesmith/docs/mcp` (docs tools) and `@pagesmith/core/mcp` (collection tools).

## Repo workflow

Use Vite+ commands:

```bash
vp install
vp check
vp test
vp run build
```

Useful commands:

```bash
vp run build:docs
vp run build:examples
vp run validate:examples
vp run dev:docs
vp run dev:eg:react
vp run dev:eg:doc-site
```

## Repo layout

```text
packages/
  core/                 @pagesmith/core — shared content/runtime layer + vite plugins
  docs/                 @pagesmith/docs — docs implementation + docs CLI

examples/
  blog-site/            Custom site using @pagesmith/core (own layouts/styles/runtime)
  doc-site/             @pagesmith/docs with layout overrides
  with-react/           Content layer + React
  with-solid/           Content layer + SolidJS
  with-svelte/          Content layer + Svelte
  with-vanilla-ejs/     Content layer + EJS
  with-vanilla-hbs/     Content layer + Handlebars

docs/                   Pagesmith's own docs (uses @pagesmith/docs defaults)

tests/
  e2e/
```

## Dependency graph

```text
@pagesmith/core         → standalone
@pagesmith/docs         → @pagesmith/core (dep)
```

## Config formats

- **`@pagesmith/core`** → Vite/plugin flow with `content.config.ts` or direct `createContentLayer(...)` usage
- **`@pagesmith/docs`** → `pagesmith.config.json5` plus a `content/` tree
- Docs layout overrides use fixed keys under `theme.layouts` such as `home`, `page`, and `notFound`

## Markdown pipeline

The markdown pipeline uses unified with Expressive Code for syntax highlighting:

```
remark-parse → remark-gfm → remark-math → remark-frontmatter
  → remark-github-alerts → remark-smartypants → [user remark plugins]
  → lang-alias transform → remark-rehype
  → rehype-mathjax (must run before Expressive Code so math is rendered to SVG first)
  → rehype-expressive-code (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis
  → heading extraction → [user rehype plugins] → rehype-stringify
```

Code block styling is handled entirely by Expressive Code through inline styles and scripts injected during processing.

## CSS exports

- `@pagesmith/core/css/content` — prose + inline code styles
- `@pagesmith/core/css/standalone` — full layout + prose + TOC
- `@pagesmith/core/css/viewport` — responsive viewport base
- `@pagesmith/core/css/fonts` — bundled Open Sans + JetBrains Mono

## AI guidelines

Package-local AI guidance is the canonical source of truth and must stay version-matched with each package.

- `packages/core/docs/llms.txt`
- `packages/core/docs/llms-full.txt`
- `packages/core/docs/agents/usage.md`
- `packages/docs/docs/llms.txt`
- `packages/docs/docs/llms-full.txt`
- `packages/docs/docs/agents/usage.md`

For consuming projects, point `CLAUDE.md`/`AGENTS.md` to installed package files under `node_modules`:

- `node_modules/@pagesmith/core/docs/agents/usage.md`
- `node_modules/@pagesmith/docs/docs/agents/usage.md`

The AI installer CLI (`npx pagesmith init --ai`) generates assistant context files including markdown guidelines (`.pagesmith/markdown-guidelines.md`) and a `/update-docs` Claude command for keeping docs in sync with implementation. The AI module code lives in `packages/core/src/ai/` (split into types, writers, and per-assistant content modules) and is used internally by the CLI.

## Guidance

- Prefer `defineCollection`, `defineCollections`, and `pagesmithContent` for the Vite content flow.
- Prefer `createContentLayer` and `defineConfig` when working directly with the lower-level content layer.
- Prefer `@pagesmith/docs` for docs sites that should work from configuration alone.
- Prefer `@pagesmith/core` for custom sites, custom layouts, and framework integrations.
- Prefer folder-based markdown entries when content references sibling assets.
- Keep schema validation and content validation in `@pagesmith/core` instead of scattering it into app code.
- Doc-specific schemas (site config, layout props, page data) live in `@pagesmith/docs/schemas/`.
- Keep README, docs, and `CLAUDE.md` aligned when user-facing behavior changes.
- Every release-impacting package change must update package-local AI files (`docs/llms*.txt`, `docs/agents/*.md`) in the same PR.
- All packages use the `@pagesmith/` npm scope.
- Top-level folders under `content/` define the main docs navigation in `@pagesmith/docs`.
- Everything is Vite-native. No webpack, no custom bundlers.
