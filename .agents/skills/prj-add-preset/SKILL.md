---
name: prj-add-preset
description: Add a new @pagesmith/site preset (alongside the built-in default and @pagesmith/docs preset). Use when introducing a new opinionated site flavor with its own config schema, CLI init flow, and default theme.
---

# Project Add Preset

## Quick Start

1. Read `packages/site/src/preset.ts`, `packages/site/src/cli/load-preset.ts`, and `packages/docs/src/preset.ts` for a reference implementation of a preset.
2. Read `packages/site/skills/pagesmith-site-setup/references/site-guidelines.md`.

## Workflow

1. Pick a home for the preset:
   - Built-in variants live under `packages/site/src/presets/<name>/`.
   - Full-featured flavors ship as their own npm package (e.g. `@pagesmith/docs`) and depend on `@pagesmith/site`.
2. Implement the preset:
   - Export a `Preset` object (or a `definePreset(...)` call) with `init`, `dev`, `build`, `preview`, and optional `mcp`.
   - Provide default `vite.config`, default content config, default theme, default layouts.
   - Ship a Zod schema for preset-specific configuration and a JSON Schema under `packages/<preset>/schemas/`.
3. Wire CLI discovery:
   - `pagesmith-site` already honors `--preset` / `PAGESMITH_PRESET` / config `preset` / `presets`. Ensure the preset specifier resolves from a fresh install via `node_modules`.
   - Expose a CLI binary in the preset package (e.g. `pagesmith-<name>`) that calls `pagesmith-site` with `--preset` pre-set, if the preset is its own package.
4. Shipping artifacts:
   - `preset.ts` entry + typed config
   - `theme/` and `layouts/` for default JSX components
   - `schemas/*.schema.json` for IDE autocomplete on `pagesmith.config.json5`
   - `skills/setup-<preset>.md`, `usage.md`, `recipes.md`, `errors.md`, `migration.md`, `llms.txt`, `llms-full.txt`
   - `REFERENCE.md` at package root
   - `skills/` folder with consumer-installable SKILL.md files
5. Update:
   - `docs/content/guide/frameworks/` and `docs/content/reference/` with a per-preset series.
   - An `examples/` example demonstrating the preset end-to-end.
6. Validation:
   - Tests under the preset package's `src/__tests__/`.
   - Integration tests under `tests/integration/` that scaffold a fixture and run `pagesmith-site build` with the preset.

## Rules

- Every preset must define `init`, `dev`, `build`, and `preview`. `mcp` is optional.
- Preset config schema must have a stable `$id` and ship as a published JSON Schema file.
- Keep preset-owned CSS and runtime behind `@pagesmith/site/css/*` / `@pagesmith/site/runtime/*` re-exports when possible to keep bundle composition predictable.
