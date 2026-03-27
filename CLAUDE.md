# Pagesmith

Pagesmith is a file-based CMS and documentation tool, organized as a multi-package workspace under the `@pagesmith/` npm scope.

Two main user-facing packages: `@pagesmith/core` for custom layout sites (blogs, portfolios) and `@pagesmith/docs` for convention-based documentation.

## What matters most

- **`@pagesmith/core`** (`packages/core/`) — Content layer, markdown pipeline, JSX runtime, CSS builder, schemas, loaders, validation, diagrams, dev server, preview server, Vite content plugin (`@pagesmith/core/vite`), AI installer, and built-in project scaffolding via `pagesmith create`.
- **`@pagesmith/docs`** (`packages/docs/`) — Convention-based documentation: static build/dev server, Pagefind search, doc theme (layouts + styles + runtime), nav/sidebar generation from `content/`, and home/frontmatter conventions. Configured via `pagesmith.config.json5`. Built on `@pagesmith/core`.
- Diagram discovery, rendering, manifests, and watch mode route through `diagramkit`.
- Docs live in `docs/` and are built with `@pagesmith/docs` (self-dogfooding).

## Repo workflow

Use Vite+ commands:

```bash
vp install
vp check
vp test
```

Useful commands:

```bash
pagesmith build
pagesmith dev
pagesmith preview
pagesmith create my-docs
pagesmith diagrams content/
pagesmith ai install --assistant all --scope project
pagesmith ai install --assistant codex --scope project --docs
npm run build:docs
npm run validate:examples
npm run preview:example blog-site
```

## Repo layout

```text
packages/
  core/                 @pagesmith/core — content layer + vite plugin + CLI
  docs/                 @pagesmith/docs — convention-based documentation + Pagefind

examples/
  blog-site/            Custom layout site using @pagesmith/core (has own layouts/styles/runtime)
  doc-site/             Convention-based docs using @pagesmith/docs
  shared-content/       Content layer example (shared)
  with-react/           Content layer + React
  with-solid/           Content layer + SolidJS
  with-svelte/          Content layer + Svelte
  with-vanilla-ejs/     Content layer + EJS
  with-vanilla-hbs/     Content layer + Handlebars

docs/                   Pagesmith's own docs (uses @pagesmith/docs)

tests/
  e2e/
```

## Dependency graph

```text
@pagesmith/core         → standalone
@pagesmith/docs         → @pagesmith/core (dep)
```

## Config formats

- **`@pagesmith/core`** → Vite plugin flow with root `content.config.ts` + `vite.config.ts`, or `pagesmith.config.ts` for lower-level content-layer/SSG usage
- **`@pagesmith/docs`** → `pagesmith.config.json5` (convention-based docs SSG)
- CLI auto-detects: `.ts` → core mode, `.json5` → docs mode

## Guidance

- Prefer `defineCollection`, `defineCollections`, and `pagesmithContent` for the Vite content flow.
- Prefer `createContentLayer` and `defineConfig` when working directly with the lower-level content layer.
- Prefer folder-based markdown entries when content references sibling assets or diagrams.
- Keep schema validation and content validation in `@pagesmith/core` instead of scattering it into app code.
- Doc-specific schemas (site config, layout props, page data) live in `@pagesmith/docs/schemas/`.
- Route diagram questions to `diagramkit`, not bespoke renderers.
- Keep README, docs, and assistant files aligned when public APIs or install commands change.
- All packages use the `@pagesmith/` npm scope.
- Top-level folders under `content/` define the main docs navigation in `@pagesmith/docs`.
