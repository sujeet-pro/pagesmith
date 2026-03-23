# API Reference

## `defineCollection(def)`

Defines a typed collection. The most important fields are:

- `loader`
- `directory`
- `schema`
- `transform`
- `computed`
- `filter`
- `validate`
- `validators`
- `slugify`

## `defineConfig(config)`

Creates a content-layer config object with:

- `collections`
- `root`
- `markdown`
- `diagrams`
- `plugins`

## `createContentLayer(config)`

Returns a content layer with these primary methods:

- `getCollection(name)`
- `getEntry(collection, slug)`
- `validate(collection?)`
- `renderDiagrams(options?)`
- `convert(markdown, options?)`
- `invalidate(collection, slug)`
- `invalidateCollection(collection)`
- `invalidateAll()`

## `ContentEntry<T>`

Each loaded entry exposes:

- `slug`
- `collection`
- `filePath`
- `data`
- `rawContent`
- `render(options?)`
- `clearRenderCache()`

## `@pagesmith/content/ai`

AI helper exports:

- `getAiArtifactContent()`
- `getAiArtifacts()`
- `installAiArtifacts()`

Primary types:

- `AiAssistant`
- `AiArtifact`
- `AiInstallOptions`
- `AiInstallResult`

## CLI

```bash
pagesmith-content diagrams <dir>
pagesmith-content ai install --assistant all --scope project
```
