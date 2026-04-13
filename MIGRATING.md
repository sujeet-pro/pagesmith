# Migrating to Current Pre-1.0 API

Pagesmith is still pre-1.0, so breaking changes are expected between minor releases while the package boundaries settle.

This guide covers the current split into `@pagesmith/core`, `@pagesmith/site`, and `@pagesmith/docs`.

## High-impact changes

### Three-package architecture

- `@pagesmith/core` is now the headless content layer.
- `@pagesmith/site` owns the `pagesmith-site` CLI (`pagesmith` remains a compatibility alias), JSX runtime, shared CSS/runtime bundles, SSG helpers, and preset loading.
- `@pagesmith/docs` is the opinionated docs preset and theme built on top of core + site.

### Import moves

Keep these imports in `@pagesmith/core`:

- collections, schemas, loaders, validation
- markdown helpers
- `pagesmithContent`
- MCP helpers from `@pagesmith/core/mcp`

Move these imports to `@pagesmith/site`:

- `pagesmithSsg`
- `sharedAssetsPlugin`
- `prerenderRoutes`
- `SsgRenderConfig`
- JSX runtime imports
- CSS bundle imports
- runtime JS imports
- `ssg-utils`

Typical migration:

```ts
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

```tsx
import { Fragment } from '@pagesmith/site/jsx-runtime'
```

```css
@import '@pagesmith/site/css/content';
```

### Docs preset and CLI

- `pagesmith-site` is the canonical CLI from `@pagesmith/site`.
- `pagesmith-docs` is the canonical CLI from `@pagesmith/docs`.
- Use `@pagesmith/docs/preset` only when you are deliberately driving docs through `pagesmith-site`; docs-first projects should prefer `pagesmith-docs` instead of configuring the preset manually.

### Example dev/build commands

- Use `vite dev` and `vite build` in example-style integrations.
- Framework-hosted integrations such as Next.js can keep their own build commands and use `@pagesmith/core` directly for content loading/rendering.
- Add `@pagesmith/site/css/*` and `@pagesmith/site/runtime/*` only when those apps want Pagesmith's shipped markdown presentation/runtime layer without Pagesmith's Vite plugins.
- Avoid relying on `vp` in downstream example apps unless you intentionally use Vite+ in that project.

### AI-first docs workflow

- Preferred setup path is `npx pagesmith-docs init --ai`.
- Onboarding-first navigation ordering is expected for docs guides.

## Suggested upgrade checklist

1. Update imports so content concerns stay on `@pagesmith/core` and site-building concerns move to `@pagesmith/site`.
2. Update JSX `jsxImportSource` values from `@pagesmith/core` to `@pagesmith/site` where you use the built-in JSX runtime.
3. Update CSS and runtime imports from `@pagesmith/core/css/*` and `@pagesmith/core/runtime/*` to `@pagesmith/site/css/*` and `@pagesmith/site/runtime/*`.
4. For docs projects, prefer `pagesmith-docs` and a plain `pagesmith.config.json5`; only keep `preset: '@pagesmith/docs'` when you are intentionally routing docs through `pagesmith-site`.
5. Re-run docs scaffolding if needed with `npx pagesmith-docs init --ai`.
6. Run:
   - `vp check`
   - `vp test`
   - `npm run build:examples`

## Where to look for version-matched details

- `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/site/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/docs/ai-guidelines/changelog-notes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
