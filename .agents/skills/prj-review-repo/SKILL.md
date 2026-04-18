---

## name: prj-review-repo

description: Review Pagesmith monorepo changes with full repo context — behavior, boundaries, tests, docs/examples/diagram parity, and release readiness. Use when reviewing diffs or branches, before merge, or when preparing a release.

# Project Review Repo

Use this skill for **code review** in this repository. It assumes you have read `[AGENTS.md](../../../AGENTS.md)` and `[CLAUDE.md](../../../CLAUDE.md)`; they define layout, boundaries, scratch rules (`.temp/`), and contributor vs consumer guidance.

## Repo context (what to hold in mind)

| Area                                     | Location                                          |
| ---------------------------------------- | ------------------------------------------------- |
| Core markdown, validation, loaders       | `packages/core/src/`\*\*                          |
| Site preset, Vite, runtime CSS/layout    | `packages/site/src/**`                            |
| Docs tooling, validators, schemas        | `packages/docs/src/**`, `packages/docs/schemas/`  |
| Root docs site content                   | `docs/content/`, `pagesmith.config.json5`         |
| Examples                                 | `examples/**`                                     |
| Consumer npm guidance (ships in tarball) | `packages/*/skills/pagesmith-*-setup/references/` |
| Root consumer skills (post-install copy) | `skills/pagesmith-*/`                             |
| Contributor workflows                    | `.agents/skills/prj-*/SKILL.md`                   |

**Boundaries:** watch for accidental coupling from `packages/docs` into app runtime, or bypassing shared markdown validation. Public behavior changes should touch implementation, package references, root docs, examples, and diagrams in the **same branch** when applicable.

## Review focus

Prioritize:

- Behavior regressions in `packages/core/src/`** or `packages/docs/src/**`
- Package boundary violations (core ↔ site ↔ docs)
- Missing updates to `packages/*/skills/pagesmith-*-setup/references/`, `packages/docs/schemas/`, or root `skills/pagesmith-*`
- Drift in `docs/content/` or `examples/` relative to implementation
- Missing tests or validation for the change surface
- Diagrams that are outdated, missing for new complex flows, or lacking rendered assets / broken embeds

## Checklist

- Does the change alter **public** behavior?
- If yes: per-package `skills/**/references/`, root docs, affected examples, markdown tests?
- Markdown / rendering changed? → markdown guidelines + integration tests + feature examples
- Docs hosting / routing changed? → slashless URLs, GitHub Pages expectations (`AGENTS.md`)
- Schema / frontmatter rules changed? → `packages/docs/schemas/*.schema.json` + docs that use them
- New flows or architectures that are hard to follow without visuals? → diagrams or explicit “no diagram” rationale

## Verification

Use targeted tests first; broaden when the surface is large. After doc/example/diagram edits, run the validators below.

### Content + build validation

```bash
npm run build:library    # when packages/ changed
npm run build:docs       # when docs/ changed
npm run validate:pagesmith
npm run validate:pagesmith:full   # strict opt-in checks
```

`validate:pagesmith` exercises `validateDocs` on `pagesmith.config.json5` and `gh-pages/` (links, images, frontmatter, `<picture>`, build output, required files, asset passthrough sources). Combine with strict and external checks as needed for the change.

### When validation fails

- **Frontmatter schema** — fix markdown; only relax `content.config` if the documented contract still holds everywhere.
- **Broken internal link** — try `.md` / `README.md` resolution; prefer fixing links over disabling rules.
- **Raw `<img>` outside `<picture>`** — use `<picture>` theme variants or Markdown `![]()`.
- **Missing required output file** — add via the docs preset (favicon, sitemap, robots, `llms.txt`, etc.).
- **Broken anchor** — align slug with heading or fix the link.

### Diagrams

When diagram sources changed or review covers visuals, include `npm run render:diagrams` and delegate a full-repo diagram audit to `[prj-diagramkit-review](../prj-diagramkit-review/SKILL.md)`. For systematic doc alignment after implementation changes, see `[prj-maintain-docs](../prj-maintain-docs/SKILL.md)`.
