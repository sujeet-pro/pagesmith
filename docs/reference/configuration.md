# Configuration

## Content Config Shape

```ts
defineConfig({
  root: process.cwd(),
  collections: { posts, pages, authors },
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
    shiki: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultShowLineNumbers: true,
    },
  },
  diagrams: {
    enabled: true,
    displayMode: 'picture',
    outputDir: '.diagrams',
    manifestFile: 'diagrams.manifest.json',
    useManifest: true,
    sameFolder: false,
  },
  plugins: [],
})
```

## Diagram Options

- `enabled`
- `displayMode`
- `outputDir`
- `manifestFile`
- `useManifest`
- `sameFolder`
- `extensionMap`
- `defaultFormat`
- `defaultTheme`

## Collection Defaults

- loader-specific include globs are inferred automatically
- markdown validators are enabled unless `disableBuiltinValidators` is set
- schema validation returns structured issues and preserves raw data when parsing fails
