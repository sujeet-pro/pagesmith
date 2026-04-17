---
name: prj-docs-diagrams
description: Review Pagesmith docs and add diagrams with diagramkit. Use when writing or updating docs, explaining architecture or flows, refreshing repo docs visuals, or when the user asks to generate diagrams across documentation pages.
---
# Project Docs Diagrams

Single source of truth for adding and maintaining diagrams in this repo. Self-contained — do not chase external `skills/` files.

## Quick Start

1. Read `AGENTS.md` for the repo-wide hosting, markdown, and diagram rules.
2. For package-facing docs, also read:
   - `packages/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
3. Warm up Chromium once on a machine if Mermaid, Excalidraw, or draw.io renders are needed:

```bash
npm run diagramkit:warmup
```

## When To Add A Diagram

Add a diagram when it makes a page easier to understand by replacing or compressing:

- architecture overviews
- request or data flows
- setup or deployment pipelines
- navigation or content organization
- state transitions
- lifecycle explanations
- package or module dependencies
- decision trees

Skip diagrams when a short paragraph, table, or code sample is already clearer than a visual.

## Choose The Right Engine

| Need | Best choice | Why |
| --- | --- | --- |
| Flowcharts, sequence diagrams, state diagrams, ER diagrams, timelines, simple C4 views | Mermaid | Text-first, diff-friendly, fast to revise |
| Architecture overviews, system context, conceptual sketches, presentation-style visuals | Excalidraw | Flexible freeform layout with a hand-drawn look |
| Network topology, cloud/vendor icon diagrams, BPMN, precise manual layout, multi-page visuals | draw.io | Rich libraries and tight layout control |
| Dependency graphs, call graphs, rank-constrained graphs, existing `.dot` assets | Graphviz | Strong algorithmic layout and graph semantics |

## Output Layout

Page-local layout (`diagramkit.config.json5` uses `sameFolder: true`, so rendered files land beside the source file):

```text
docs-site/content/guide/architecture/README.md
docs-site/content/guide/architecture/diagrams/system-overview.mermaid
docs-site/content/guide/architecture/diagrams/system-overview-light.svg
docs-site/content/guide/architecture/diagrams/system-overview-dark.svg
```

## Workflow

1. Review the target markdown page and decide whether a diagram would simplify architecture, flow, lifecycle, dependency, topology, or decision-path explanations.
2. Create a sibling `diagrams/` folder next to the markdown file when a diagram helps.
3. Choose the simplest engine from the table above.
4. Keep the editable source file in that `diagrams/` folder. Use semantic file names (`request-flow.mermaid`, `docs-build-pipeline.drawio`).
5. For Mermaid sources that will be embedded as `<img>`, add `%%{init: {'htmlLabels': false}}%%` at the top so the rendered SVG works in browsers and webviews.
6. Run `npm run render:diagrams` so light and dark SVG variants are generated beside the source file.
7. Update markdown to embed the generated SVGs (see "Embed Patterns" below).
8. Add descriptive alt text and a nearby sentence that tells the reader what to notice.
9. Re-run `npm run render:diagrams` after every diagram source change before finishing.

## Authoring Rules

- Prefer focused diagrams over giant kitchen-sink diagrams.
- Keep labels explicit and reader-facing.
- Add descriptive alt text on every embedded image.
- Add a short sentence near the diagram that tells the reader what to notice.
- Keep source diagrams and rendered outputs committed together.
- Do not hand-edit generated `-light.svg` or `-dark.svg` outputs.
- Prefer SVG. Add PNG only when another surface explicitly needs a raster.

## Embed Patterns

Pagesmith-rendered docs (`docs-site/content/**`, `examples/**/docs/**`, any surface with the shared theme CSS):

```html
<figure>
  <img src="./diagrams/system-overview-light.svg" class="only-light" alt="System overview showing how docs content flows through Pagesmith build and preview, with collection loading, markdown pipeline, and static output stages">
  <img src="./diagrams/system-overview-dark.svg" class="only-dark" alt="System overview showing how docs content flows through Pagesmith build and preview, with collection loading, markdown pipeline, and static output stages">
  <figcaption>Docs build pipeline</figcaption>
</figure>
```

Simple black-and-white diagrams that don't need separate light/dark renders:

```html
<figure>
  <img src="./diagrams/simple-flow.svg" class="invert-on-dark" alt="Simple flow showing request path through the build pipeline from source to output">
  <figcaption>Build flow</figcaption>
</figure>
```

For non-image content that should toggle with the color scheme, use `.show-on-light` / `.show-on-dark` on any element.

GitHub-facing markdown (package `README.md`, package `REFERENCE.md`, repo `README.md`, anything primarily consumed on GitHub):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./diagrams/system-overview-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./diagrams/system-overview-light.svg" />
  <img alt="System overview showing how docs content flows through Pagesmith build and preview" src="./diagrams/system-overview-light.svg" />
</picture>
```

## Review Checklist

- Does the page become easier to understand with a diagram?
- Is the chosen engine the simplest one that fits?
- Are the source file and rendered `-light.svg` / `-dark.svg` siblings?
- Is the markdown embedding pattern correct for the target surface (`<figure>` for Pagesmith, `<picture>` for GitHub)?
- Is the alt text descriptive and specific?
- Did you rerun `npm run render:diagrams` after edits?
- Did you avoid hand-editing generated image files?

## Full-Repo Pass Prompt

Copy this prompt when you want an agent to review the entire repo's documentation and add diagrams where they materially simplify explanation.

```text
Review all documentation in this repository and add diagrams wherever they materially simplify explanation.

Before editing anything, read:
- AGENTS.md
- CLAUDE.md
- .agents/skills/prj-docs-diagrams/SKILL.md
- packages/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md
- packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md
- every project skill under .agents/skills/prj-*/SKILL.md

Audit these documentation surfaces:
- docs-site/content/**/*.md
- packages/*/README.md
- packages/*/REFERENCE.md
- packages/*/skills/pagesmith-*-setup/references/**/*.md
- examples/**/*.md

For each documentation page:
1. Decide whether a diagram would simplify a workflow, architecture, lifecycle, dependency graph, topology, taxonomy, or decision path.
2. If a diagram helps, create a sibling `diagrams/` folder next to the markdown file.
3. Choose the best source format using the engine table in prj-docs-diagrams:
   - Mermaid for text-first flows
   - Excalidraw for architecture sketches
   - draw.io for precise infrastructure or BPMN
   - Graphviz for dependency graphs
4. Keep the editable source file in that `diagrams/` folder.
5. Run `npm run render:diagrams` so light and dark SVG variants are generated beside the source file.
6. Update the markdown file to embed the generated SVG files:
   - Use `.only-light` / `.only-dark` image pairs for Pagesmith-rendered docs
   - Use `<picture>` for GitHub-facing markdown like README or REFERENCE files
7. Add descriptive alt text and a nearby sentence that explains what the reader should notice.
8. If a page is pure reference material and no meaningful diagram would help, leave it unchanged and mention that decision in the summary.

After all edits:
1. Run `npm run render:diagrams` again.
2. Run `vp check`.
3. Summarize which pages received diagrams, which engine was used, and which pages were intentionally skipped.
```
