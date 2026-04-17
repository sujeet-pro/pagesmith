# `@pagesmith/site` Changelog Notes

## v0.9.6

- `pagesmith-site validate` now accepts `--require-canonical-internal-links` / `--no-require-canonical-internal-links`. Off by default at this layer; downstream presets (including `@pagesmith/docs`) can turn it on.
- Added a matching `requireCanonicalInternalLinks` field on `SiteValidateOptions` so custom site presets can opt in programmatically.
- `getChromeJS()`, `getRuntimeJS()`, and `getContentJS()` now follow hashed re-export chunks emitted by the bundler so the concatenated runtime bundle always contains real implementation (fixes `returns a self-contained …` test coverage and any downstream consumer that was seeing `import { t as … } from '…'` instead of inlined logic).
- `pagesmith-site` REFERENCE now documents every flag the CLI accepts.

## Current architecture highlights

- New public package: `@pagesmith/site`
- Owns the `pagesmith-site` CLI (with `pagesmith` kept as a compatibility alias)
- Owns the Pagesmith JSX runtime
- Owns CSS bundles and runtime JS
- Owns Vite SSG helpers such as `pagesmithSsg` and `sharedAssetsPlugin`
- `@pagesmith/docs` now sits on top of `@pagesmith/site`
- `@pagesmith/core` is now the headless content layer
