---
name: prj-pagesmith-review
description: Review Pagesmith changes for bugs, regressions, missing parity updates, missing tests, and docs/diagram drift. Use when reviewing diffs, preparing a release, or checking whether docs, examples, package guidance, and rendered diagram assets stayed in sync.
---
# Project Pagesmith Review

## Review Focus

Prioritize findings about:

- behavior regressions in `packages/core/src/**` or `packages/docs/src/**`
- package boundary violations between core and docs
- missing updates to `packages/*/skills/pagesmith-*-setup/references/` or `packages/docs/schemas/`
- docs drift under `docs/content/`
- example drift under `examples/`
- missing tests or validation coverage
- missing diagram updates where new docs flows or architectures became hard to understand without visuals
- missing rendered diagram assets or broken markdown embeds

## Repo-Specific Checklist

- Does the change alter public behavior?
- If yes, were the per-package `skills/**/references/` files updated?
- If yes, were root docs pages updated?
- If yes, were all relevant examples updated?
- If markdown/rendering changed, were markdown docs and tests updated?
- If docs hosting or routing changed, were slashless URL and GitHub Pages expectations preserved?
- If docs schema/frontmatter changed, were `packages/docs/schemas/*.schema.json` updated?
- If docs or README content added new flows or architectures, were diagrams added or intentionally skipped with a clear reason?

## Verification

Use targeted tests first, then broader validation when the surface area is large. When diagram sources changed, include `npm run render:diagrams` in the verification path and hand off a repo-wide diagram audit (re-render + SVG structure + `<img>`-embed safety + WCAG 2.2 AA contrast) to [`prj-diagramkit-review`](../prj-diagramkit-review/SKILL.md).

### Content + build validation

Always finish a doc/example/markdown change with the dedicated validator
before opening a PR:

```bash
npm run build:library    # only when packages/ changed
npm run build:docs       # only when docs/ changed
npm run validate:pagesmith         # content + gh-pages build (default rules)
npm run validate:pagesmith:full    # adds the strict opt-in checks
```

`validate:pagesmith` runs `validateDocs` against `pagesmith.config.json5` and
`gh-pages/`. It checks:

- Markdown frontmatter against any `content.config.{ts,mts,mjs,js}` schemas
  (none for the in-repo docs — the script falls back to structural rules).
- Internal links and images (resolved against `contentDir`, `publicDir`, the
  configured assets passthrough sources, and the existing `gh-pages/`).
- `<picture>` theme variants, raw `<img>` outside `<picture>`, alt text,
  adjacent `-light/-dark` pairs, code-block meta, heading structure.
- Build output internal links + srcset, asset hashes, SVG renderability,
  in-page anchors, and the required-files list (`favicon.svg|favicon.ico`,
  `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`).
- Repo-specific assertion that every passthrough source listed in
  `pagesmith.config.json5#assets` exists on disk.

`--full` additionally enforces `internalLinksMustBeMarkdown`,
`requireBothTrailingSlashForms`, and `requireRasterModernFormats`. Combine
with `--check-external` (passed via `pagesmith-docs validate`) to also fetch
hosted URLs.

### When validation fails

- **Frontmatter schema** — update the markdown to satisfy the schema, never
  loosen the schema in `content.config.ts` without confirming the
  documented contract still holds for downstream sites.
- **Broken internal link** — first try the `.md` / `README.md` suffix
  expansion; if the resolver still cannot find the target, the link is
  genuinely broken. Prefer fixing the markdown over loosening the rule.
- **Raw `<img>` outside `<picture>`** — wrap the snippet in `<picture>` (the
  validator allows `<img>` inside `<picture>` for theme variants) or switch
  to Markdown image syntax `![]()`.
- **Missing required output file** — add the file (favicon, sitemap, etc.)
  through the docs preset's standard mechanism rather than disabling the
  check.
- **Broken in-page anchor** — verify the heading the anchor points at still
  exists; rename the anchor to match the slug or update the heading.
