# Examples

The repo includes framework and runtime examples that all consume the content layer instead of hiding it behind framework-specific abstractions.

## Included Examples

- Blog Site — custom layout site using `@pagesmith/core` (has own layouts/styles/runtime)
- Doc Site — convention-based docs using `@pagesmith/docs`
- React with virtual content modules
- Solid with virtual content modules
- Svelte with virtual content modules
- Vanilla EJS
- Vanilla Handlebars

## Shared Example Content

The `examples/shared-content` workspace contains:

- a shared content config
- sample posts and pages
- structured author/config data
- a reusable Vite virtual-module helper used across the Vite examples

## What the Examples Show

- how to serialize rendered entries into framework-friendly modules
- how to preserve lazy rendering until build time
- how to pull runtime CSS from `@pagesmith/core/runtime`
- how to keep content modeling separate from view code
