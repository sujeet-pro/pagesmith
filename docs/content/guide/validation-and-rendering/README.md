# Validation and Rendering

Pagesmith separates validation from rendering so you can keep content workflows fast.

## Validation Pipeline

For markdown collections, Pagesmith now shares one parsed MDAST tree across built-in validators instead of parsing the same file multiple times.

Built-in validators cover:

- schema validation through Zod
- internal and external link checks
- heading depth and duplicate `h1` checks
- code block meta validation

Add collection-specific validators with the `validators` array or a lightweight `validate(entry)` hook.

## Rendering Model

`ContentEntry.render()` is lazy:

- content loads with metadata, schema validation, and AST validation
- markdown becomes HTML only when you call `render()`
- rendered output is cached per entry

Returned render metadata includes:

- `html`
- `headings`
- `readTime`

Read time is computed from the original markdown source instead of rendered HTML, which produces better estimates for real content.

## Plugins

Pagesmith merges content plugins into the markdown pipeline so plugin-level remark, rehype, and validation hooks actually run during entry rendering and validation.

## Direct Conversion

Use the content layer when you need collection semantics. Use direct conversion when you only have an isolated markdown string:

```ts
const fragment = await layer.convert('# Hello')
```

## Validation in CI

Recommended checks:

```bash
vp check
vp test
```

Use `layer.validate()` in application code when you want content validation results as structured data.
