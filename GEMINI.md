# Pagesmith

Pagesmith is a filesystem-first content toolkit organized as a multi-package workspace under the `@pagesmith/` npm scope.

Two main user-facing packages: `@pagesmith/core` for the shared content/runtime layer and `@pagesmith/docs` for convention-based documentation built on top of core.

Focus areas for this repo:

- typed content collections
- the built-in Vite content plugin exposed from `@pagesmith/core/vite`
- schema validation and AST-level content validation
- lazy markdown rendering
- docs sites powered by `@pagesmith/docs`, with bundled Pagefind search and navigation derived from `content/`
- docs layout overrides through fixed `theme.layouts.*` slots
- assistant artifact generation through `@pagesmith/core/ai`

Useful commands:

```bash
vp install
vp check
vp test
vp run build
vp run dev:docs
vp run build:examples
```

Prefer folder-based markdown entries when content references sibling assets.
