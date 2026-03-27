# Diagramkit Integration

Pagesmith no longer owns its own diagram rendering stack. Diagram discovery, rendering, manifest tracking, and watch mode now route through `diagramkit`.

## Supported Diagram Types

Through diagramkit, Pagesmith supports:

- Mermaid
- Excalidraw
- Draw.io

Alias extensions are also supported through diagramkit's extension map.

## Filesystem Convention

```text
content/posts/hello-world/
  README.md
  system.mermaid
  sketch.excalidraw
  ui.drawio
  .diagrams/
    system-light.svg
    system-dark.svg
    diagrams.manifest.json
```

## Render Diagrams

```bash
pagesmith diagrams content/
pagesmith diagrams content/ --watch
pagesmith diagrams content/ --type mermaid
pagesmith diagrams content/ --file content/posts/hello-world/system.mermaid
```

## Configure Diagram Handling

```ts
defineConfig({
  collections: { posts },
  diagrams: {
    enabled: true,
    displayMode: 'picture',
    outputDir: '.diagrams',
    manifestFile: 'diagrams.manifest.json',
    useManifest: true,
  },
})
```

## Markdown Image Rewrites

When a markdown entry references a source diagram, Pagesmith rewrites the image to the rendered outputs:

```md
![System overview](./system.mermaid)
```

That becomes either:

- a `<picture>` element with light and dark sources
- two class-toggled `<img>` tags when `displayMode: 'class'`

## Why This Matters

Using diagramkit as the single diagram system keeps Pagesmith focused on being an FS-CMS instead of duplicating browser pools, renderers, and manifest logic.
