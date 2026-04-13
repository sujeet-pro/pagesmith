# Pagesmith Doc Site Example

A config-driven documentation site built with `@pagesmith/docs`. This is the reference example for the package-owned `pagesmith-docs` CLI, root `pagesmith.config.json5`, markdown content under `content/`, and optional layout overrides under `theme/layouts/`.

## AI-First Starting Point

To recreate this shape in another repository, install `@pagesmith/docs` and start with `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`.

That prompt already covers:

- `pagesmith.config.json5` at the repo root
- GitHub Pages-style `origin` and `basePath` defaults
- starter `guide/` and `reference/` structure
- schema paths under `node_modules/@pagesmith/docs/schemas/`
- `pagesmith-docs init --yes --ai` for bootstrap work

## Quick Start

```bash
vp install
vp run dev:eg:doc-site
```

## Key Files

- `pagesmith.config.json5` is the source of truth for site metadata, search, output paths, footer links, and layout overrides
- `content/` contains the markdown site, including `guide/kitchen-sink.md` as the docs markdown regression page
- `theme/layouts/` shows how to override `DocHome` and `DocPage` without breaking the default docs contract
- `llms.txt` summarizes the docs-package layout and command surface for AI tools

## What This Example Demonstrates

- convention-based docs navigation from folders plus `meta.json5`
- built-in Pagefind search
- theme controls, footer controls, and persisted reader preferences
- local layout ownership while staying aligned with the package defaults

## Live Demo

[View live example](https://projects.sujeet.pro/pagesmith/examples/doc-site)
