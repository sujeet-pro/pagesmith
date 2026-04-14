---
name: prj-docs-diagrams
description: Review Pagesmith docs and add diagrams with diagramkit. Use when writing or updating docs, explaining architecture or flows, refreshing repo docs visuals, or when the user asks to generate diagrams across documentation pages.
---
# Project Docs Diagrams

## Quick Start

1. Read:
   - `ai-guidelines/docs-guidelines.md`
   - `ai-guidelines/markdown-guidelines.md`
   - `ai-guidelines/diagram-guidelines.md`
2. For package-facing docs, also read:
   - `packages/docs/ai-guidelines/docs-guidelines.md`
   - `packages/docs/ai-guidelines/markdown-guidelines.md`
3. Warm up Chromium once on a machine if Mermaid, Excalidraw, or draw.io renders are needed:

```bash
npm run diagramkit:warmup
```

## Workflow

1. Review the target markdown page and decide whether a diagram would simplify architecture, flow, lifecycle, dependency, topology, or decision-path explanations.
2. Create a sibling `diagrams/` folder next to the markdown file when a diagram helps.
3. Choose the simplest engine that fits:
   - Mermaid for text-first flows, sequences, state, ER, or timelines
   - Excalidraw for architecture sketches and conceptual overviews
   - draw.io for precise infrastructure, vendor-icon, or BPMN diagrams
   - Graphviz for dependency graphs, call graphs, or existing `.dot` assets
4. Keep the editable source file in that `diagrams/` folder.
5. Run `npm run render:diagrams` so light and dark SVG variants are generated beside the source file.
6. Update markdown to embed the generated SVGs:
   - Pagesmith-rendered docs use `.only-light` / `.only-dark`
   - GitHub-facing markdown uses a `<picture>` element
7. Add descriptive alt text and a nearby sentence that tells the reader what to notice.
8. Re-run `npm run render:diagrams` after every diagram source change before finishing.

## Rules

- Prefer SVG for docs surfaces.
- Do not hand-edit generated `-light.svg` or `-dark.svg` outputs.
- Keep source diagrams and rendered outputs committed together.
- Always add `%%{init: {'htmlLabels': false}}%%` at the top of Mermaid source files so SVGs render correctly when embedded via `<img>` in browsers and webviews.
- Skip diagrams on pure reference pages if a visual does not add clarity.
- When doing a full-repo pass, start from `ai-guidelines/docs-diagram-pass-prompt.md`.
