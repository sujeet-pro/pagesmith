# `@pagesmith/site` Error Notes

Quick fixes for common `@pagesmith/site` problems.

## `Cannot find module '@pagesmith/site/...`

Typical causes:

- `@pagesmith/site` is not installed
- monorepo path aliases are missing
- imports still point at old `@pagesmith/core/*` site-facing paths

Fix:

- install `@pagesmith/site`
- update path aliases if working inside a monorepo
- move JSX/CSS/runtime/SSG imports from `core` to `site`

## `Preset "...\" does not implement dev()/build()/preview()`

The selected preset module loaded successfully, but the returned preset object does not implement the requested command.

Fix:

- verify the preset factory export
- verify the returned object shape
- verify that the intended command is implemented

## `Preset "...\" must export default, docsPreset, sitePreset, or preset as a function`

The preset module shape is wrong.

Fix:

- export one of the supported factory names
- ensure the export is a function
- ensure the function returns a preset object

## Theme / TOC runtime appears inactive

Typical causes:

- runtime entry is not loaded
- the DOM hooks do not match the shipped selectors
- TOC links are missing heading anchors

Fix:

- load `@pagesmith/site/runtime/theme`, `.../toc-highlight`, or `.../standalone`
- prefer `[data-ps-*]` hooks
- ensure headings have `id` attributes and TOC links point to them

## Preview server shows stale HTML

The preview server serves built files from disk. If output is stale, the usual issue is that the build directory was not rebuilt.

Fix:

- re-run the site build (for preset-driven sites: `pagesmith-site build`)
- verify the configured `outDir`
- verify the preview command is reading the same config and base path as the build
