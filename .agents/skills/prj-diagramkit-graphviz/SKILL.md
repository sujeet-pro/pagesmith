---
name: prj-diagramkit-graphviz
description: Generate Graphviz DOT diagrams (.dot/.gv/.graphviz) and render to SVG/PNG/JPEG/WebP/AVIF with diagramkit. Strong algorithmic layout for dependency graphs, call graphs, hierarchical DAGs, and rank-constrained visualizations. Uses WASM — no browser needed. Use when graph structure matters more than hand-tuned positioning, or when working with existing .dot/.gv source files.
---

# prj-diagramkit-graphviz

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-graphviz/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-graphviz/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- Graphviz uses WASM — you do NOT need `npm run diagramkit:warmup` for Graphviz-only work.
- Put `.dot` sources in a sibling `diagrams/` folder next to the markdown page; `sameFolder: true` emits `*-light.svg` / `*-dark.svg` alongside them.
- Use `npm run render:diagrams` after edits.
