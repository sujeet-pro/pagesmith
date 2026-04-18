---
name: prj-diagramkit-excalidraw
description: Generate Excalidraw diagrams (.excalidraw) and render to SVG/PNG/JPEG/WebP/AVIF with diagramkit. Freeform hand-drawn-style architecture overviews, system context maps, concept diagrams, and whiteboard visuals. Use when creating diagrams that need flexible layout, a hand-drawn aesthetic, or when the audience benefits from an approachable whiteboard-style visual.
---

# prj-diagramkit-excalidraw

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-excalidraw/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-excalidraw/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- Put the `.excalidraw` source in a sibling `diagrams/` folder next to the markdown page; `sameFolder: true` in `diagramkit.config.json5` emits `*-light.svg` / `*-dark.svg` alongside it.
- Use `npm run render:diagrams` after edits.
- Follow `.agents/skills/prj-docs-diagrams/SKILL.md` embed patterns (`<figure>` with `.only-light`/`.only-dark` for Pagesmith docs; `<picture>` for GitHub-facing READMEs).
