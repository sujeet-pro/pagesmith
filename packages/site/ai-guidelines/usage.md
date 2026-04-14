# `@pagesmith/site` Usage For AI Agents

Use this file as the primary instruction source for `@pagesmith/site`.

## Getting Started

1. Install: `npm add @pagesmith/site`
2. For repo bootstrap or retrofit work, read: `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
3. Read the full reference: `node_modules/@pagesmith/site/REFERENCE.md`
4. Read `node_modules/@pagesmith/core/REFERENCE.md` for the content-layer half of the integration

## When To Pick `@pagesmith/site`

- Custom Pagesmith sites on top of `@pagesmith/core`
- Framework-based static sites using Vite SSG
- Projects that need the Pagesmith JSX runtime
- Projects that need the Pagesmith CLI outside the docs preset
- Projects that want shared JSX chrome/layouts or shared CSS/runtime behavior such as TOC highlighting, theme persistence, sidebar controls, or code-block UI

## Choose `@pagesmith/core` vs `@pagesmith/site` vs `@pagesmith/docs`

- Use `@pagesmith/core` for collections, markdown rendering, validation, loaders, and other headless-only integrations.
- Use `@pagesmith/site` when the app should stay on one Pagesmith package for content APIs, `pagesmithContent`, SSG, CLI, JSX, reusable components/layouts, CSS, runtime JS, and shared site helpers.
- Use `@pagesmith/docs` when you want the docs preset and want docs consumers to stay on one package.

## Supported Integration Shapes

### Vite site build

1. Define content collections with `@pagesmith/site`.
2. Use `pagesmithContent` from `@pagesmith/site/vite`.
3. Use `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`.
4. Keep the SSR entry exporting `getRoutes()` and `render()`.
5. Use `@pagesmith/site/jsx-runtime` when the site uses Pagesmith's TSX runtime.
6. Prefer `@pagesmith/site/components` and `@pagesmith/site/layouts` when the site wants the shared Pagesmith chrome instead of a docs-local fork.

### Existing app or framework host

1. Define content collections with `@pagesmith/site`.
2. Load and render markdown through `createContentLayer()` and `entry.render()` from `@pagesmith/site`.
3. Import `@pagesmith/site/css/content` when the app wants the shipped prose and code-block chrome.
4. Mount `@pagesmith/site/runtime/content` once when the app wants copy buttons, code tabs, and collapse toggles.
5. Use `SiteUserConfigSchema` from `@pagesmith/site/schemas` plus `normalizeBasePath()` / `withBasePath()` from `@pagesmith/site` when the app needs a typed Pagesmith-flavored site config layer.

### Shared site chrome

1. Render with `@pagesmith/site/components` and `@pagesmith/site/layouts`.
2. Import `@pagesmith/site/css/chrome` plus `@pagesmith/site/runtime/chrome` when only the site chrome is needed.
3. Import `@pagesmith/site/css/standalone` plus `@pagesmith/site/runtime/standalone` when the page also uses the shipped prose/code-block layer.

## Non-negotiable Rules

- Do not tell users to import `pagesmithSsg`, `sharedAssetsPlugin`, CSS bundles, or runtime JS from `@pagesmith/core`.
- Do not describe `@pagesmith/site` as the content store.
- Keep CLI guidance aligned with the preset model: the canonical binary is `pagesmith-site`, the fallback preset is `@pagesmith/site/preset`, and docs-first workflows should use `pagesmith-docs`.
- Use `@pagesmith/site/runtime/*` instead of ad-hoc copy buttons, TOC scroll-spy code, or theme/font-size persistence scripts when the shipped behavior fits.

## Agent Prompts

### Prompt: Add Pagesmith site-building to a Vite repo

> Add Pagesmith site-building support to this repository. Read `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`, `node_modules/@pagesmith/site/REFERENCE.md`, `node_modules/@pagesmith/site/ai-guidelines/site-guidelines.md`, and `node_modules/@pagesmith/core/REFERENCE.md` first. Prefer `@pagesmith/site` as the app-facing package: keep content collections on `@pagesmith/site`, wire `pagesmithContent`, `pagesmithSsg`, and `sharedAssetsPlugin` from `@pagesmith/site/vite`, and use `@pagesmith/site/jsx-runtime` if the site uses TSX.

### Prompt: Add Pagesmith content styling/runtime to an existing app

> Add Pagesmith's shared markdown presentation layer to this existing app. Read `node_modules/@pagesmith/site/REFERENCE.md` and `node_modules/@pagesmith/core/REFERENCE.md` first. Keep collections and markdown rendering on `@pagesmith/site` unless the project intentionally stays on the lower-level core package, then use `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content` only for the shared prose, code-block, copy, tab, and collapse behavior.

### Prompt: Use the Pagesmith CLI with a custom preset

> Add a custom Pagesmith preset to this project. Read `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` and `node_modules/@pagesmith/site/REFERENCE.md` first. Configure top-level `preset` or `presets` in `pagesmith.config.json5`, or use `--preset` / `PAGESMITH_PRESET` with `pagesmith-site`. Keep the preset factory export compatible with `default`, `sitePreset`, `docsPreset`, or `preset`.

### Prompt: Add shared Pagesmith site chrome

> Replace ad-hoc site chrome code with Pagesmith's built-in site components and runtime. Read `node_modules/@pagesmith/site/REFERENCE.md`, prefer `@pagesmith/site/components` and `@pagesmith/site/layouts` for the shared JSX shell, and pair them with `@pagesmith/site/css/chrome`, `@pagesmith/site/runtime/chrome`, or `@pagesmith/site/runtime/standalone` as appropriate. Preserve the existing DOM structure when possible and prefer `[data-ps-*]` hooks over project-specific one-off scripts.

## Package Files Reference

| File | Purpose |
| --- | --- |
| `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` | Canonical bootstrap/retrofit prompt for `@pagesmith/site` |
| `node_modules/@pagesmith/site/REFERENCE.md` | Complete CLI, preset, JSX, CSS, runtime, and SSG reference |
| `node_modules/@pagesmith/site/README.md` | Quick start and package overview |
| `node_modules/@pagesmith/site/ai-guidelines/site-guidelines.md` | Package-specific rules and responsibilities |
| `node_modules/@pagesmith/site/ai-guidelines/usage.md` | This file |
| `node_modules/@pagesmith/site/ai-guidelines/recipes.md` | Common integration recipes |
| `node_modules/@pagesmith/site/ai-guidelines/migration.md` | Upgrade notes for sites moving from older Pagesmith layouts |

## Related Package Docs

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/ai-guidelines/usage.md`
