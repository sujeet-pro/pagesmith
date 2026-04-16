---
name: add-preset
description: Point the pagesmith-site CLI at a custom site preset. Use when you want to consume a third-party or internal preset that bundles a theme, layouts, and init flow.
---

# Use A Site Preset

## What A Preset Is

A preset is a package that exports an object with `init`, `dev`, `build`, `preview`, and optionally `mcp` hooks. The most common preset is `@pagesmith/docs/preset`.

## Steps

1. Install the preset package:

```bash
npm add @pagesmith/docs       # bundles the docs preset
# or
npm add @your-scope/pagesmith-preset-x
```

2. Tell the CLI to use it. In priority order, the CLI reads:

- `--preset <specifier>` on the command line
- `PAGESMITH_PRESET` env var
- `preset:` or `presets:` field in `pagesmith.config.json5`

Preferred form — pin it in config:

```json5
{
  preset: '@pagesmith/docs',
  name: 'My Docs',
  // ...
}
```

3. Run the CLI as usual:

```bash
npx pagesmith-site init
npx pagesmith-site dev
npx pagesmith-site build
npx pagesmith-site preview
```

When the preset package ships its own wrapper CLI (like `pagesmith-docs`), that CLI just calls `pagesmith-site` with the preset pre-set.

## Rules

- Keep the preset specifier in `pagesmith.config.json5`, not scattered across scripts.
- If you develop the preset in the same repo, either `npm link` it or use a workspace path so resolution is deterministic.

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/site-guidelines.md`
