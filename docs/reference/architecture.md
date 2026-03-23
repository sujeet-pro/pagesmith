# Architecture

Pagesmith is organized around three layers:

```text
@pagesmith/core
  markdown pipeline
  JSX runtime
  CSS builder

@pagesmith/content
  content collections
  filesystem loaders
  schema + AST validation
  lazy rendering
  diagramkit integration
  AI companion installers

pagesmith
  optional SSG
  dev server
  build pipeline
```

## Content Loading Flow

```text
discover files
  -> load raw entry
  -> transform
  -> computed fields
  -> schema validation
  -> markdown validators
  -> plugin validators
  -> ContentEntry<T>
```

## Important Refactors in This Repo

- markdown validation now shares one MDAST parse across validators
- schema validation now parses once and reuses the coerced result
- markdown processors are cached by config object
- diagram management routes through diagramkit instead of duplicated renderer stacks
- loader parse failures are wrapped with structured file-aware errors
- example Vite plugins share one virtual-module helper
