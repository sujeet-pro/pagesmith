---
name: prj-extend-packages
description: Extend @pagesmith/core or @pagesmith/site — add a content loader, a remark/rehype markdown plugin, or a new site preset. Use when introducing a new content format, markdown pipeline behavior, or an opinionated site flavor with its own preset package.
---

# Project Extend Packages

Pick the section that matches the work. Each workflow ends with updating published guidance and running validation (`npm run cicd` or the minimal subset noted).

---

## Add a content loader (`@pagesmith/core`)

### Quick start

1. Read `packages/core/CLAUDE.md` and `packages/core/src/loaders/` for the current loader contract.
2. Read `packages/core/skills/pagesmith-core-setup/references/core-guidelines.md` for the documented loader behavior.

### Workflow

1. Implement the loader class in `packages/core/src/loaders/<name>.ts`:
   - Implement the `Loader` interface from `packages/core/src/loaders/types.ts`.
   - Set `name`, `extensions`, and `load(filePath) -> LoaderResult`.
   - Reuse `LoaderError` from `packages/core/src/loaders/errors.ts` for failure cases.
2. Register it:
   - Add a new literal to the `LoaderType` union in `packages/core/src/loaders/types.ts`.
   - Wire the loader in `packages/core/src/loaders/index.ts` (`resolveLoader` + `defaultIncludePatterns`).
3. Export:
   - Re-export from `packages/core/src/loaders/index.ts`.
   - Confirm the `@pagesmith/core/loaders` entry in `packages/core/package.json` exports surfaces the new loader.
4. Validate:
   - Add a `packages/core/src/__tests__/<name>-loader.test.ts` that covers happy path, parse error, and missing-file cases.
   - Add a fixture under `tests/integration/fixtures/` if the loader needs real files.
5. Update guidance:
   - `packages/core/skills/pagesmith-core-setup/references/core-guidelines.md` (loader table)
   - `packages/core/skills/pagesmith-core-setup/references/usage.md` (recipe)
   - Root docs under `docs/content/reference/core/api/` and `docs/content/guide/content-layer/`
   - Update the consumer-facing skill at `skills/pagesmith-core-add-loader/SKILL.md` if the new loader changes the consumer workflow, and refresh `skills/README.md` if you introduced a new skill entry.
6. Run `npm run cicd` (or at minimum `vp test run` + `vp check`).

### Rules

- Zero IO outside of `load()`; loaders must be pure w.r.t. the store.
- Return `{ data, rawContent? }` only — no side effects.
- Do not add runtime dependencies for niche formats without justification; prefer a tiny parser or a peer-dep pattern.

---

## Add a markdown plugin (`@pagesmith/core`)

### Quick start

1. Read `packages/core/src/markdown/pipeline.ts` — this is the single source of truth for plugin order.
2. Read the "Markdown Parity" section of `AGENTS.md` and `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`.
3. Decide:
   - First-party plugin (goes in `packages/core/src/markdown/plugins/`)
   - Third-party plugin (consumed only; no source in this repo)
   - User-facing extension point (belongs in `MarkdownConfig.remarkPlugins` / `rehypePlugins`)

### Workflow

1. If writing a first-party plugin:
   - Create `packages/core/src/markdown/plugins/<name>.ts` using `unified`'s plugin type.
   - Walk the tree with `unist-util-visit` or equivalent.
   - Add unit tests under `packages/core/src/__tests__/`.
2. Wire it into the pipeline:
   - Decide insertion point carefully. Document it in the comment at the top of `pipeline.ts`.
   - Respect ordering constraints (frontmatter before GFM transforms, rehype-stringify last, etc.).
3. Update documentation:
   - `packages/core/CLAUDE.md` markdown-pipeline section.
   - `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`.
   - `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` if docs consumers need to know.
   - Root docs under `docs/content/guide/markdown/` and `docs/content/reference/core/markdown-reference/`.
   - Example pages demonstrating the new syntax in at least `examples/blog-site/` and `examples/doc-site/`.
4. Validation:
   - Add markdown snapshot / HTML assertions in `packages/core/src/__tests__/markdown.test.ts`.
   - Add a validator (or extend an existing one) in `packages/core/src/validation/` if misuse needs to warn.
5. Run `npm run cicd` or at least `vp test run packages/core` and `npm run validate:examples`.

### Rules

- Never re-order existing plugins without a test proving the output is unchanged for the default path.
- Keep plugin options tiny and strongly typed; avoid free-form maps unless necessary.
- If the plugin depends on theme / CSS classes, add the CSS in `packages/site/src/styles/` alongside a runtime if needed.

---

## Add a site preset (`@pagesmith/site` / preset package)

### Quick start

1. Read `packages/site/src/preset.ts`, `packages/site/src/cli/load-preset.ts`, and `packages/docs/src/preset.ts` for a reference implementation of a preset.
2. Read `packages/site/skills/pagesmith-site-setup/references/site-guidelines.md`.

### Workflow

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

### Rules

- Every preset must define `init`, `dev`, `build`, and `preview`. `mcp` is optional.
- Preset config schema must have a stable `$id` and ship as a published JSON Schema file.
- Keep preset-owned CSS and runtime behind `@pagesmith/site/css/*` / `@pagesmith/site/runtime/*` re-exports when possible to keep bundle composition predictable.
