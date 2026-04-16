---
name: add-search
description: Enable (or customize) Pagefind-powered search in a Pagesmith docs site. Use when turning on search, adjusting index weights, or styling the search UI.
---

# Add Search

## Enable

In `pagesmith.config.json5`:

```json5
{
  search: {
    enabled: true,
  },
}
```

That's it. `@pagesmith/docs` bundles Pagefind, wires it into the build, and exposes a Cmd+K / Ctrl+K keyboard shortcut plus a visible trigger in the header.

## Index Weights

Override the default boost values per heading level:

```json5
{
  search: {
    enabled: true,
    weights: {
      title: 10,
      h1: 5,
      h2: 3,
      h3: 2,
      body: 1,
    },
  },
}
```

## Scope

Limit what gets indexed by excluding sections:

```json5
{
  search: {
    enabled: true,
    exclude: ['drafts', 'changelog'],
  },
}
```

## UI Integration

The built-in trigger lives in the header. To add a custom trigger anywhere, render:

```tsx
import { SearchTrigger } from '@pagesmith/docs/components'

<SearchTrigger label="Search docs" />
```

The component renders nothing when `search.enabled` is false, so it's safe to leave in templates across environments.

## Verification

- `npx pagesmith-docs build` writes the Pagefind index under `outDir/pagefind/`.
- `npx pagesmith-docs preview` serves it correctly because the preview server streams from disk.
- Check the index size — if it exceeds a few MB, review `exclude` patterns.

## Rules

- Do not run Pagefind directly; Pagesmith orchestrates build + index + runtime together.
- When `basePath` is set, the client fetches `<basePath>/pagefind/...`. Don't hand-assemble that URL — use the shipped `SearchTrigger`.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
- Pagefind docs: https://pagefind.app/
