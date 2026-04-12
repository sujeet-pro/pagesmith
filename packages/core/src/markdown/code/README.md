# Pagesmith Code Renderer

This folder defines the built-in code renderer contract for `@pagesmith/core`.

## Contract

Downstream features should target the Pagesmith-owned code block contract, not a
renderer-specific DOM shape.

Current contract markers:

- root class: `ps-code-block`
- renderer attribute: `data-ps-code-renderer`
- optional title attribute: `data-ps-code-title`
- optional frame attribute: `data-ps-code-frame`

The current implementation is a Pagesmith-owned Shiki-backed renderer, and the
rest of the markdown pipeline should treat the underlying renderer details as
internal.

## Packaging Criteria

Keep the renderer inside `@pagesmith/core` until all of the following are true:

1. The Pagesmith code block DOM and metadata contract is stable.
2. Tabs, runtime behavior, and CSS no longer depend on core-internal helpers.
3. There is clear reuse demand outside Pagesmith.
4. Independent release cadence outweighs monorepo dogfooding and integration tests.
