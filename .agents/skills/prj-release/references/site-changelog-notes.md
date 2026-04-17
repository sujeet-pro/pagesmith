# `@pagesmith/site` Changelog Notes

## Current architecture highlights

- New public package: `@pagesmith/site`
- Owns the `pagesmith-site` CLI (with `pagesmith` kept as a compatibility alias)
- Owns the Pagesmith JSX runtime
- Owns CSS bundles and runtime JS
- Owns Vite SSG helpers such as `pagesmithSsg` and `sharedAssetsPlugin`
- `@pagesmith/docs` now sits on top of `@pagesmith/site`
- `@pagesmith/core` is now the headless content layer
