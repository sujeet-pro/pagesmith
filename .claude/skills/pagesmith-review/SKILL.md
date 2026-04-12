---
name: pagesmith-review
description: Review Pagesmith changes for bugs, regressions, missing parity updates, and missing tests. Use when reviewing diffs, preparing a release, or checking whether docs/examples/package guidance stayed in sync.
---
# Pagesmith Review

## Review Focus

Prioritize findings about:

- behavior regressions in `packages/core/src/**` or `packages/docs/src/**`
- package boundary violations between core and docs
- missing updates to `packages/*/ai-guidelines/` or `packages/docs/schemas/`
- docs drift under `docs/content/`
- example drift under `examples/`
- missing tests or validation coverage

## Repo-Specific Checklist

- Does the change alter public behavior?
- If yes, were package ai-guidelines updated?
- If yes, were root docs pages updated?
- If yes, were all relevant examples updated?
- If markdown/rendering changed, were markdown docs and tests updated?
- If docs hosting or routing changed, were slashless URL and GitHub Pages expectations preserved?
- If docs schema/frontmatter changed, were `packages/docs/schemas/*.schema.json` updated?

## Verification

Use targeted tests first, then broader validation when the surface area is large.
