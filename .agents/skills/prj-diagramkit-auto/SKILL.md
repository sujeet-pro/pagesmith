---

## name: prj-diagramkit-auto

description: Select the diagramkit engine (Mermaid, Excalidraw, Draw.io, or Graphviz) for a task, then follow node_modules/diagramkit/skills/diagramkit-/SKILL.md for authoring. Use when creating a diagram without a chosen engine or when comparing engines.

# prj-diagramkit-auto

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ `[node_modules/diagramkit/skills/diagramkit-auto/SKILL.md](../../../node_modules/diagramkit/skills/diagramkit-auto/SKILL.md)`

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

After the auto skill picks an engine, open the matching **engine** skill under the same install — for example `node_modules/diagramkit/skills/diagramkit-mermaid/SKILL.md`, `diagramkit-excalidraw`, `diagramkit-draw-io`, or `diagramkit-graphviz`. Do not rely on repo-local copies of those files; the package is the source of truth.

Pagesmith-specific notes:

- After picking an engine and authoring the source file, put it in a sibling `diagrams/` folder next to the markdown that references it, then run `npm run render:diagrams` (not `npx diagramkit render .` directly) so the project-wide script is used.
- **Mermaid** sources embedded via `<img>` / `<figure>` / `<picture>`: prepend `%%{init: {'htmlLabels': false}}%%` and use `\n` (never `<br/>`) in multi-line labels.
- Follow the embed patterns in `.agents/skills/prj-maintain-docs/SKILL.md` (`<figure>` with `.only-light` / `.only-dark` for Pagesmith-rendered docs, `<picture>` for GitHub-facing READMEs).