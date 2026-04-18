---
name: prj-diagramkit-mermaid
description: Generate Mermaid diagrams (.mermaid/.mmd/.mmdc) and render to SVG/PNG/JPEG/WebP/AVIF with diagramkit. Supports 21+ diagram types including flowchart, sequence, class, state, ER, gantt, gitgraph, mindmap, timeline, C4, pie, quadrant, sankey, XY, block, architecture, kanban, journey, packet, radar, and requirement. Use when creating or updating Mermaid diagram source files, rendering them to images, or choosing which Mermaid diagram type fits a task.
---

# prj-diagramkit-mermaid

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-mermaid/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-mermaid/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- Source files go in a sibling `diagrams/` folder next to the markdown page; rendered `*-light.svg` / `*-dark.svg` land alongside them (`sameFolder: true`).
- Because Mermaid outputs are embedded via `<img>` / `<figure>` / `<picture>` in Pagesmith docs, always prepend sources with `%%{init: {'htmlLabels': false}}%%` and use `\n` (never `<br/>`) in multi-line labels.
- Use `npm run render:diagrams` after edits, not `npx diagramkit render .` directly.
