---
name: prj-maintain-docs
description: Align the docs site, package-facing guidance, diagrams, and consumer AI artifacts with the current implementation — remove stale claims, add gaps, verify diagrams for accuracy, re-render when sources or workflows changed, and run validation. Use when public behavior, markdown, docs workflow, routing, schemas, or architecture docs change.
---

# Project Maintain Docs

Single workflow for **documentation truth**: read the code and shipped package guidance, update `docs/content/` and related surfaces, fix or extend diagrams, sync per-package `skills/` / `llms*.txt` / schemas, and validate. For **examples/** specifically (parity and new workspaces), use [`prj-maintain-examples`](../prj-maintain-examples/SKILL.md).

## Quick start

1. Read `AGENTS.md` (markdown parity, hosting, diagrams, sync rules).
2. Read consumer-facing references you might contradict:
   - `packages/core/skills/pagesmith-core-setup/references/core-guidelines.md`
   - `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`
   - `packages/core/skills/pagesmith-core-setup/references/usage.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/usage.md`
   - `packages/docs/schemas/*.schema.json`
3. Audit the implementation that changed (`packages/*/src/**`) and treat it as source of truth for prose.

## Truth pass (docs vs code)

1. Identify what behavior actually ships from the diff or feature area.
2. For each doc page, package reference, or diagram that mentions that behavior: **remove** statements that are no longer true; **add** missing steps, options, limits, and edge cases.
3. If architecture or flow changed, treat existing diagrams as **suspect** until re-validated (see Diagrams below).

## Workflow

1. Update root docs under `docs/content/` and `pagesmith.config.json5` when docs-package or site behavior changed.
2. Update published package guidance: `packages/*/skills/pagesmith-*-setup/references/`, `packages/*/README.md`, `packages/*/REFERENCE.md`.
3. Sync **consumer** surfaces when behavior reaches end users:
   - Root `skills/pagesmith-*/SKILL.md` and `skills/README.md`
   - `packages/docs/schemas/*.schema.json` when config / frontmatter / meta rules changed
   - `packages/core/src/ai/**` when assistant artifacts or packaged paths changed
   - Keep consumer text free of monorepo-only paths; use `node_modules/@pagesmith/...` where you mean installed packages.
4. **Diagrams** — add or refresh when they replace a long explanation of architecture, flow, lifecycle, topology, or dependencies; skip when a short paragraph or code sample is clearer.
5. Add or refresh diagrams under sibling `diagrams/` folders; run `npm run render:diagrams` after source edits; never hand-edit `-light.svg` / `-dark.svg`.
6. When example sites need the same narrative as the root docs, coordinate with [`prj-maintain-examples`](../prj-maintain-examples/SKILL.md) (do not duplicate the full examples workflow here).

## Diagrams — delegate to diagramkit

| Task                                          | Where                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Choose engine                                 | [`prj-diagramkit-auto`](../prj-diagramkit-auto/SKILL.md) → then `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`                                             |
| Author sources (per engine)                   | `node_modules/diagramkit/skills/diagramkit-mermaid/`, `diagramkit-excalidraw/`, `diagramkit-draw-io/`, `diagramkit-graphviz/` — version-pinned with the installed package |
| Repo-wide audit, re-render, WCAG / SVG safety | [`prj-diagramkit-review`](../prj-diagramkit-review/SKILL.md)                                                                                                              |
| Bootstrap diagramkit in another repo          | `node_modules/diagramkit/skills/diagramkit-setup/SKILL.md` (no duplicate under `.agents/skills/` in this repo)                                                            |

Read `node_modules/diagramkit/REFERENCE.md` before CLI use. Warm Chromium when needed: `npm run diagramkit:warmup`.

**Layout:** `diagramkit.config.json5` uses `sameFolder: true`. Editable source lives beside rendered files, e.g. `docs/content/.../diagrams/foo.mermaid` → `foo-light.svg`, `foo-dark.svg`.

### Embed patterns (Pagesmith vs GitHub)

Pagesmith-rendered docs (`docs/content/**`, example doc pages with shared theme CSS):

```html
<figure>
  <img src="./diagrams/system-overview-light.svg" class="only-light" alt="…" />
  <img src="./diagrams/system-overview-dark.svg" class="only-dark" alt="…" />
  <figcaption>Docs build pipeline</figcaption>
</figure>
```

Simple B/W diagrams:

```html
<figure>
  <img src="./diagrams/simple-flow.svg" class="invert-on-dark" alt="…" />
  <figcaption>Build flow</figcaption>
</figure>
```

GitHub-facing markdown (`README.md`, `REFERENCE.md`):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./diagrams/system-overview-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./diagrams/system-overview-light.svg" />
  <img alt="…" src="./diagrams/system-overview-light.svg" />
</picture>
```

### Diagram accuracy checklist

- Does the visual still match the implementation and docs **after** your change?
- If flows, components, or ownership changed, **update the source** and re-render; do not patch old SVGs.
- Per-page: engine fit, sibling sources + renders, correct embed pattern, descriptive alt text, `npm run render:diagrams` after edits.
- Before release or after broad diagram edits, hand off to [`prj-diagramkit-review`](../prj-diagramkit-review/SKILL.md) for a full-repo pass.

## Verification

- Search for stale terminology, broken diagram references, or missing assets.
- `npm run render:diagrams` when diagram sources changed.
- Targeted tests for changed behavior.
- `npm run validate:examples` when example output or example content changed (often pairs with `prj-maintain-examples`).
- `npm run validate:pagesmith` or `validate:pagesmith:full` after docs/content edits — validates markdown, links, images, `<picture>` rules, build output, required files (`llms.txt`, `llms-full.txt`, etc.), and asset passthrough paths from `pagesmith.config.json5#assets`.

### When validation fails

Follow the remediation paths in [`prj-review-repo`](../prj-review-repo/SKILL.md) (validation troubleshooting section).

## Full-repo documentation pass (prompt shell)

Use when refreshing **all** docs visuals and parity:

Read `AGENTS.md`, `CLAUDE.md`, this file, [`prj-diagramkit-auto`](../prj-diagramkit-auto/SKILL.md), and the relevant `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`; scan `docs/content/**/*.md`, `packages/*/README.md`, `packages/*/REFERENCE.md`, `packages/*/skills/pagesmith-*-setup/references/**/*.md`, `examples/**/*.md`. For each page: decide if a diagram helps; if yes, sibling `diagrams/`, engine via `prj-diagramkit-auto`, render, embed, alt text. Finish with `npm run render:diagrams`, [`prj-diagramkit-review`](../prj-diagramkit-review/SKILL.md), and `npm run validate:pagesmith`.

## Key facts

- Markdown stack: built-in Pagesmith renderer on Shiki (`packages/core/src/markdown/`).
- Contributor prose: `AGENTS.md` + `.agents/skills/prj-*`; tarball guidance: `packages/*/skills/pagesmith-*-setup/references/`.
- Docs config: `pagesmith.config.json5`; site content: `docs/content/`.
- Diagrams: `diagramkit` + `diagramkit.config.json5`; canonical URLs stay slashless and GitHub Pages–friendly.
