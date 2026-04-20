# `@pagesmith/site` Changelog Notes

## v0.9.9 (next)

- New runtime module `@pagesmith/site/runtime/image-zoom` exporting `initImageZoom()`. It unhides the per-figure zoom buttons emitted by `@pagesmith/core` and opens a singleton full-viewport modal (Ctrl/Cmd+wheel zoom, +/- step, Esc/keyboard, theme-aware src swap for `data-zoom-src-light/dark`).
- `getContentJS()`, `getRuntimeJS()`, `runtime/content`, and `runtime/standalone` now include the image-zoom runtime by default.
- New CSS module `@pagesmith/site/styles/content/image-zoom.css`, bundled into both `content.css` and `standalone.css`. Adds `.ps-figure-zoomable`, `.ps-img-zoom-btn`, `.ps-img-zoom-modal`, `.ps-img-zoom-toolbar`, and the `ps-img-zoom-open` body lock.

## Current architecture highlights

- New public package: `@pagesmith/site`
- Owns the `pagesmith-site` CLI (with `pagesmith` kept as a compatibility alias)
- Owns the Pagesmith JSX runtime
- Owns CSS bundles and runtime JS
- Owns Vite SSG helpers such as `pagesmithSsg` and `sharedAssetsPlugin`
- `@pagesmith/docs` now sits on top of `@pagesmith/site`
- `@pagesmith/core` is now the headless content layer
