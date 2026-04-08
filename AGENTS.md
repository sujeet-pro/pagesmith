# Pagesmith Agent Guide

Use this file as the default architectural context for AI-assisted edits in this repository.

## 1.0 Architecture Snapshot

Pagesmith is a filesystem-first content toolkit with two public packages under the `@pagesmith/` scope:

- `@pagesmith/core` (`packages/core/`) for shared content/runtime primitives:
  - content layer (`createContentLayer`, collections, loaders, validation),
  - markdown pipeline (unified + Expressive Code),
  - JSX runtime (`h`, `Fragment`, `HtmlString`),
  - CSS builder (LightningCSS) and runtime assets,
  - Vite plugins (`pagesmithContent`, `pagesmithSsg`, `sharedAssetsPlugin`),
  - MCP server (`createCoreMcpServer`) for AI tool integration.
- `@pagesmith/docs` (`packages/docs/`) for convention-based documentation:
  - docs CLI (`pagesmith init|dev|build|preview|mcp`),
  - docs config resolution/validation (`pagesmith.config.json5`),
  - navigation/sidebar generation from `content/` with `meta.json5` ordering,
  - default theme + layout override slots (`theme.layouts.*`),
  - bundled Pagefind search, sitemap, robots.txt generation,
  - MCP server (`createDocsMcpServer`) for docs tool integration.

## Dependency Graph

```text
@pagesmith/core         -> standalone (no workspace deps)
@pagesmith/docs         -> @pagesmith/core (runtime dep)
```

## 1.0 Architecture Principles (Guardrails)

These principles are locked for 1.0 and should drive all future edits unless an explicit architecture RFC supersedes them:

1. **Filesystem-first source of truth** — content and companion assets live in the repo, not in an external CMS or database.
2. **Strict package boundaries** — shared primitives belong in `@pagesmith/core`; docs conventions and orchestration belong in `@pagesmith/docs`.
3. **Validation at content boundaries** — schema and markdown/content validation must happen before render/runtime usage. The pipeline order is: discover -> load -> transform -> computed fields -> filter -> schema validate -> custom validate -> content validators -> plugin validators -> cache.
4. **Vite-native execution model** — no custom bundler layer; build/dev/preview flows stay Vite-centric.
5. **Progressive enhancement over JS-heavy runtime** — static-first HTML output with minimal client JS for UX improvements.
6. **Configuration before customization** — defaults should cover common docs workflows; advanced overrides remain opt-in.
7. **Docs and AI guidance in lockstep with behavior** — release-impacting changes must update user docs plus package AI guidance files in the same PR.

## Content Loading Pipeline

The content layer follows a strict pipeline when `getCollection(name)` is called:

```text
1. Discover files (fast-glob with loader-derived include patterns)
2. Load each file through the registered loader
3. Generate slug (custom slugify or toSlug)
4. Apply transform (def.transform)
5. Apply computed fields (def.computed)
6. Apply filter (def.filter) — false excludes from results
7. Schema validation (Zod safeParse)
8. Custom validation (def.validate)
9. Content validators (MDAST-based; built-in: link, heading, code-block)
10. Plugin validators
11. Cache in ContentStore (keyed by collection + slug)
```

## Markdown Pipeline

```text
remark-parse -> remark-gfm -> remark-math -> remark-frontmatter
  -> remark-github-alerts -> remark-smartypants -> [user remark plugins]
  -> lang-alias transform -> remark-rehype
  -> rehype-mathjax (must run before Expressive Code)
  -> rehype-expressive-code (dual themes, code frames, line numbers, copy)
  -> rehype-slug -> rehype-autolink-headings
  -> rehype-external-links -> rehype-accessible-emojis
  -> heading extraction -> [user rehype plugins] -> rehype-stringify
```

## Theme System

Class-based multi-theme with two orthogonal axes on `<html>`:
- **Color scheme**: `color-scheme-auto` | `color-scheme-light` | `color-scheme-dark` — controls `light-dark()` via CSS `color-scheme` property.
- **Theme**: `theme-paper` | `theme-high-contrast` — overrides CSS custom properties.
- Server default: `<html class="color-scheme-auto theme-paper">`.
- FOUC prevention: inline `<script>` reads `localStorage('pagesmith-theme')` before paint.
- Image switching uses `.only-light`/`.only-dark` classes (not `@media (prefers-color-scheme)`).
- Docs config: `theme.defaultColorScheme` (`'auto'|'light'|'dark'`) and `theme.defaultTheme` (`'paper'|'high-contrast'`).

## Practical Editing Rules

- Prefer `@pagesmith/docs` for docs-site workflows; prefer `@pagesmith/core` for custom sites/framework integrations.
- Keep validation logic centralized in `@pagesmith/core` rather than scattering checks in app code.
- Prefer folder-based markdown entries when pages reference sibling assets.
- Doc-specific schemas (site config, layout props, page data) live in `@pagesmith/docs/schemas/`.
- Keep AI files updated for release-impacting changes:
  - `packages/core/docs/llms*.txt`, `packages/core/docs/agents/*.md`
  - `packages/docs/docs/llms*.txt`, `packages/docs/docs/agents/*.md`
- Keep repository docs aligned when behavior changes: `README.md`, `CLAUDE.md`, `docs/content/**`, package READMEs/REFERENCE docs.
- All packages use the `@pagesmith/` npm scope.
- Top-level folders under `content/` define the main docs navigation in `@pagesmith/docs`.
- Everything is Vite-native. No webpack, no custom bundlers.

## Repo Commands

```bash
vp install
vp check
vp test
vp run build
vp run validate:examples
```

Use `npm run validate` before release-oriented merges.
