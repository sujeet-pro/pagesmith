# Examples

The repo includes framework and runtime examples that all consume the content layer instead of hiding it behind framework-specific abstractions.

## Included Examples

- React with virtual content modules
- Solid with virtual content modules
- Svelte with virtual content modules
- Vanilla EJS
- Vanilla Handlebars
- Minimal SSG
- Bun
- Deno
- Node

## Shared Example Content

The `examples/shared-content` workspace contains:

- a shared content config
- sample posts and pages
- structured author/config data
- a reusable Vite virtual-module helper used across the Vite examples

## What the Examples Show

- how to serialize rendered entries into framework-friendly modules
- how to preserve lazy rendering until build time
- how to pull runtime CSS from `@pagesmith/content/runtime`
- how to keep content modeling separate from view code
