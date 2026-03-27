# Pagesmith

Pagesmith is a file-based CMS and documentation tool, organized as a multi-package workspace under the `@pagesmith/` npm scope.

Two main user-facing packages: `@pagesmith/core` for custom layout sites (blogs, portfolios) and `@pagesmith/docs` for convention-based documentation.

Focus areas for this repo:

- typed content collections
- the built-in Vite content plugin exposed from `@pagesmith/core/vite`
- schema validation and AST-level content validation
- lazy markdown rendering
- diagram management through `diagramkit`
- documentation built with `@pagesmith/docs` in `docs/`, with Pagefind search and navigation derived from `content/`
- assistant installs through `pagesmith ai install`

Useful commands:

```bash
vp install
vp check
vp test
pagesmith diagrams content/
pagesmith ai install --assistant gemini --scope project
pagesmith ai install --assistant gemini --scope project --docs
```

Prefer folder-based markdown entries when content references sibling assets or diagrams.
