# Architecture

Pagesmith is organized as a multi-package workspace under the `@pagesmith/` npm scope. The two main packages:

```text
@pagesmith/core
  content layer (collections, loaders, store, validation)
  markdown pipeline
  JSX runtime
  CSS builder
  SSG builder, dev server, preview server
  diagramkit integration
  AI companion installers

@pagesmith/docs (built on @pagesmith/core)
  convention-based documentation
  build pipeline, content collector, generators
  doc theme (layouts + styles + runtime)
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
