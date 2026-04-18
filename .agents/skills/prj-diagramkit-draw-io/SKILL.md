---
name: prj-diagramkit-draw-io
description: Generate Draw.io diagrams (.drawio/.drawio.xml/.dio) and render to SVG/PNG/JPEG/WebP/AVIF with diagramkit. Rich shape libraries, cloud vendor icons (AWS/Azure/GCP), BPMN, org charts, network topology, swimlanes, and multi-page layouts. Use when creating infrastructure-heavy diagrams, cloud architecture, or diagrams needing precise manual positioning and vendor icon libraries.
---

# prj-diagramkit-draw-io

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-draw-io/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-draw-io/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- Put the `.drawio` source in a sibling `diagrams/` folder next to the markdown page; `sameFolder: true` in `diagramkit.config.json5` emits `*-light.svg` / `*-dark.svg` alongside it.
- Use `npm run render:diagrams` after edits.
- Strip `<a xlink:href="…">` wrappers from any hand-exported drawio SVGs so they embed safely via `<img>` / `<figure>` / `<picture>`.
