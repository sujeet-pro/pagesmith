# Pagesmith

Pagesmith is a file-based CMS centered on `@pagesmith/content`.

Focus areas for this repo:

- typed content collections
- schema validation and AST-level content validation
- lazy markdown rendering
- diagram management through `diagramkit`
- VitePress documentation in `docs/`
- assistant installs through `pagesmith-content ai install`

Useful commands:

```bash
vp install
vp check
vp test
pagesmith-content diagrams content/
pagesmith-content ai install --assistant gemini --scope project
```

Prefer folder-based markdown entries when content references sibling assets or diagrams.
