---
name: prj-diagramkit-review
description: Audit and repair every diagram — lint sources per engine, force-regenerate SVGs, validate structure/embed-safety/WCAG contrast, and delegate per-engine fixes using node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md. Use for repo-wide diagram review, contrast fixes, stale renders, or pre-merge diagram checks.
---

# prj-diagramkit-review

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-review/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-review/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- Scope the audit to the repo's diagram-bearing folders: `docs/content/**/diagrams/`, `packages/*/diagrams/`, `packages/*/skills/**/diagrams/`, `examples/**/diagrams/`. Skip `node_modules/`, `.temp/`, `gh-pages/`, and anything inside `dist/`.
- `prj-review-repo` and `prj-maintain-docs` call this skill. Run it before release and any time diagram sources or rendered assets may be stale.
- Write the review report under `.temp/diagram-review/<timestamp>/report.md` (repo-wide rule: all scratch output goes in `.temp/`).
- Use `npm run render:diagrams` for force re-renders — it already passes the right flags for this repo and runs `validate:diagrams` afterwards.
- `npm run validate:diagrams` runs the SVG-only audit (structure + `<img>`-embed safety + WCAG 2.2 AA contrast) without re-rendering and is wired into `npm run build:docs`. It treats `LOW_CONTRAST_TEXT`, `CONTAINS_FOREIGN_OBJECT`, `CONTAINS_SCRIPT`, and `EXTERNAL_RESOURCE` warnings as fatal.
- After fixes, also run `vp check` to confirm nothing else regressed.
