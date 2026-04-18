---
name: prj-diagramkit-review
description: Audit and repair every diagram in a repository — lint each source file against its engine's authoring rules, force-regenerate every SVG, validate all rendered SVGs (structure, embed-safety, WCAG contrast), and iteratively fix issues by delegating engine-specific repairs to prj-diagramkit-mermaid, prj-diagramkit-excalidraw, prj-diagramkit-draw-io, and prj-diagramkit-graphviz. Use when the user asks to review/audit existing diagrams, fix contrast warnings, regenerate stale SVGs, or run a pre-merge diagram health check.
---

# prj-diagramkit-review

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-review/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-review/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- Scope the audit to the repo's diagram-bearing folders: `docs/content/**/diagrams/`, `packages/*/diagrams/`, `packages/*/skills/**/diagrams/`, `examples/**/diagrams/`. Skip `node_modules/`, `.temp/`, `gh-pages/`, and anything inside `dist/`.
- `prj-pagesmith-review` calls this skill. Run it before release and any time a diagram source changes.
- Write the review report under `.temp/diagram-review/<timestamp>/report.md` (repo-wide rule: all scratch output goes in `.temp/`).
- Use `npm run render:diagrams` for force re-renders — it already passes the right flags for this repo and runs `validate:diagrams` afterwards.
- `npm run validate:diagrams` runs the SVG-only audit (structure + `<img>`-embed safety + WCAG 2.2 AA contrast) without re-rendering and is wired into `npm run build:docs`. It treats `LOW_CONTRAST_TEXT`, `CONTAINS_FOREIGN_OBJECT`, `CONTAINS_SCRIPT`, and `EXTERNAL_RESOURCE` warnings as fatal.
- After fixes, also run `vp check` to confirm nothing else regressed.
