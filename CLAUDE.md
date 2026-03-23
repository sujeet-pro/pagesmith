# Pagesmith

Pagesmith is a file-based CMS centered on `@pagesmith/content`.

Use this repo when the task involves typed content collections, lazy markdown rendering, diagram handling through `diagramkit`, VitePress docs, or assistant-context installation for Claude, Codex, Gemini CLI, and `llms.txt`.

## What matters most

- `@pagesmith/content` is the primary package and product surface.
- `@pagesmith/core` holds the markdown pipeline, JSX runtime, and runtime CSS helpers.
- `pagesmith` is the optional SSG on top of the content layer.
- Diagram discovery, rendering, manifests, and watch mode now route through `diagramkit`.
- Docs live in `docs/` and are built with VitePress.

## Repo workflow

Use Vite+ commands:

```bash
vp install
vp check
vp test
```

Useful commands:

```bash
pagesmith-content diagrams content/
pagesmith-content ai install --assistant all --scope project
vp exec vitepress dev docs
vp exec vitepress build docs
```

## Repo layout

```text
packages/
  core/
  content/
  pagesmith/

examples/
  shared-content/
  with-react/
  with-solid/
  with-svelte/
  with-vanilla-ejs/
  with-vanilla-hbs/
  with-bun/
  with-deno/
  with-node/
  with-ssg/

docs/
```

## Guidance

- Prefer `defineCollection`, `defineConfig`, and `createContentLayer`.
- Prefer folder-based markdown entries when content references sibling assets or diagrams.
- Keep schema validation and content validation in the content layer instead of scattering it into app code.
- Route diagram questions to `diagramkit`, not the removed bespoke renderers.
- Keep README, docs, and assistant files aligned when public APIs or install commands change.
