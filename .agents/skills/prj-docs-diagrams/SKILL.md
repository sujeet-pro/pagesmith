---
name: prj-docs-diagrams
description: Decide when a diagram belongs in Pagesmith docs and how to embed it (sibling `diagrams/` folder, `<figure>` for Pagesmith docs, `<picture>` for GitHub). Delegates engine selection to prj-diagramkit-auto, per-engine authoring to prj-diagramkit-mermaid/-excalidraw/-draw-io/-graphviz, and repo-wide audit/re-render/contrast-fix to prj-diagramkit-review. Use when writing or updating docs, explaining architecture or flows, refreshing repo docs visuals, or generating diagrams across documentation pages.
---

# Project Docs Diagrams

Pagesmith-specific wrapper around the `prj-diagramkit-*` skills. This skill owns **when** to add a diagram and **how** to embed it in Pagesmith docs; all engine selection, authoring rules, rendering, and validation are delegated to diagramkit's own skills (surfaced in this repo as `prj-diagramkit-*`).

## Delegates To The diagramkit Skills

| Task                                                               | Skill                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Choose the right engine for a new diagram                          | [`prj-diagramkit-auto`](../prj-diagramkit-auto/SKILL.md)                      |
| Author a Mermaid source (`.mermaid`)                               | [`prj-diagramkit-mermaid`](../prj-diagramkit-mermaid/SKILL.md)                |
| Author an Excalidraw source (`.excalidraw`)                        | [`prj-diagramkit-excalidraw`](../prj-diagramkit-excalidraw/SKILL.md)          |
| Author a Draw.io source (`.drawio`)                                | [`prj-diagramkit-draw-io`](../prj-diagramkit-draw-io/SKILL.md)                |
| Author a Graphviz source (`.dot` / `.gv`)                          | [`prj-diagramkit-graphviz`](../prj-diagramkit-graphviz/SKILL.md)              |
| Audit, re-render, validate, and WCAG-fix every diagram in the repo | [`prj-diagramkit-review`](../prj-diagramkit-review/SKILL.md)                  |
| Install or upgrade diagramkit in a sibling repo                    | [`prj-diagramkit-setup`](../prj-diagramkit-setup/SKILL.md)                    |

All of the above resolve to `node_modules/diagramkit/skills/<name>/SKILL.md`, so they always match the diagramkit CLI/API installed in this repo. Read `node_modules/diagramkit/REFERENCE.md` before running any `diagramkit` command.

## Quick Start

1. Read `AGENTS.md` for the repo-wide hosting, markdown, and diagram rules.
2. For package-facing docs, also skim:
   - `packages/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`
   - `packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
3. Warm up Chromium once per machine if Mermaid, Excalidraw, or Draw.io renders are needed:

   ```bash
   npm run diagramkit:warmup
   ```

4. Decide **whether** a diagram helps (see "When To Add A Diagram" below).
5. Hand off engine selection + authoring to `prj-diagramkit-auto` (or the matching engine skill if you already know which one you want).
6. Apply the Pagesmith-specific layout and embed rules in the sections below.
7. Re-render with `npm run render:diagrams`.

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

Always route through `prj-diagramkit-auto` — it owns the engine-selection logic and tie-breakers. The tl;dr table below is kept as a quick mental model only; in any disagreement, `prj-diagramkit-auto` wins.

| Need                                                                                          | Engine     | Why                                             |
| --------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| Flowcharts, sequence diagrams, state diagrams, ER, timelines, simple C4 views                 | Mermaid    | Text-first, diff-friendly, fast to revise       |
| Architecture overviews, system context, conceptual sketches, presentation-style visuals       | Excalidraw | Flexible freeform layout with a hand-drawn look |
| Network topology, cloud/vendor icon diagrams, BPMN, precise manual layout, multi-page visuals | Draw.io    | Rich libraries and tight layout control         |
| Dependency graphs, call graphs, rank-constrained graphs, existing `.dot` assets               | Graphviz   | Strong algorithmic layout and graph semantics   |

## Pagesmith Output Layout

`diagramkit.config.json5` uses `sameFolder: true`, so rendered files land beside the source file. The canonical layout for Pagesmith:

```text
docs/content/guide/architecture/README.md
docs/content/guide/architecture/diagrams/system-overview.mermaid
docs/content/guide/architecture/diagrams/system-overview-light.svg
docs/content/guide/architecture/diagrams/system-overview-dark.svg
```

Rules:

- Put the editable source in a sibling `diagrams/` folder next to the markdown.
- Use semantic file names (`request-flow.mermaid`, `docs-build-pipeline.drawio`).
- Never hand-edit generated `-light.svg` / `-dark.svg` outputs.
- Prefer SVG. Add PNG only when a downstream surface explicitly needs a raster.

## Pagesmith Workflow

1. Review the target markdown page and decide whether a diagram would simplify architecture, flow, lifecycle, dependency, topology, or decision-path explanations.
2. Create a sibling `diagrams/` folder next to the markdown file when a diagram helps.
3. Hand off engine choice + authoring to `prj-diagramkit-auto` (or straight to `prj-diagramkit-mermaid` / `-excalidraw` / `-draw-io` / `-graphviz` if already known).
4. Keep the editable source file in that `diagrams/` folder.
5. For Mermaid sources (which will be embedded as `<img>` / `<figure>` / `<picture>`), ensure the source starts with `%%{init: {'htmlLabels': false}}%%` — the engine skill enforces this, but double-check.
6. Run `npm run render:diagrams` so light and dark SVG variants are generated beside the source file.
7. Update the markdown to embed the generated SVGs using the patterns below.
8. Add descriptive alt text and a nearby sentence that tells the reader what to notice.
9. Re-run `npm run render:diagrams` after every diagram source change before finishing.

## Authoring Rules (Pagesmith Layer)

Engine-specific authoring rules (palettes, directives, IDs, node shapes, etc.) live in each `prj-diagramkit-<engine>` skill. These are the extra rules that apply **on top** of the engine skill for Pagesmith docs:

- Prefer focused diagrams over giant kitchen-sink diagrams.
- Keep labels explicit and reader-facing.
- Add descriptive alt text on every embedded image.
- Add a short sentence near the diagram that tells the reader what to notice.
- Commit diagram sources and rendered outputs together.
- Do not hand-edit generated `-light.svg` or `-dark.svg` outputs.

## Embed Patterns

Pagesmith-rendered docs (`docs/content/**`, `examples/**/docs/**`, any surface with the shared theme CSS):

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

Quick manual checklist for a single page. For a repo-wide audit (SVG validation, WCAG contrast, stale renders), hand off to `prj-diagramkit-review` instead.

- Does the page become easier to understand with a diagram?
- Is the chosen engine the simplest one that fits? (If unsure, re-check via `prj-diagramkit-auto`.)
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
- .agents/skills/prj-diagramkit-auto/SKILL.md            (engine selection)
- .agents/skills/prj-diagramkit-mermaid/SKILL.md         (only if you'll write Mermaid)
- .agents/skills/prj-diagramkit-excalidraw/SKILL.md      (only if you'll write Excalidraw)
- .agents/skills/prj-diagramkit-draw-io/SKILL.md         (only if you'll write Draw.io)
- .agents/skills/prj-diagramkit-graphviz/SKILL.md        (only if you'll write Graphviz)
- node_modules/diagramkit/REFERENCE.md               (CLI/API contract)
- packages/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md
- packages/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md
- every project skill under .agents/skills/prj-*/SKILL.md

Audit these documentation surfaces:
- docs/content/**/*.md
- packages/*/README.md
- packages/*/REFERENCE.md
- packages/*/skills/pagesmith-*-setup/references/**/*.md
- examples/**/*.md

For each documentation page:
1. Decide whether a diagram would simplify a workflow, architecture, lifecycle, dependency graph, topology, taxonomy, or decision path.
2. If a diagram helps, create a sibling `diagrams/` folder next to the markdown file.
3. Route engine selection through prj-diagramkit-auto. Then follow the matching prj-diagramkit-<engine> skill to author the source.
4. Run `npm run render:diagrams` so light and dark SVG variants are generated beside the source file.
5. Update the markdown file to embed the generated SVG files:
   - Use `<figure>` with `.only-light` / `.only-dark` image pairs for Pagesmith-rendered docs
   - Use `<picture>` for GitHub-facing markdown like README or REFERENCE files
6. Add descriptive alt text and a nearby sentence that explains what the reader should notice.
7. If a page is pure reference material and no meaningful diagram would help, leave it unchanged and mention that decision in the summary.

After all edits:
1. Run `npm run render:diagrams` again.
2. Hand off to prj-diagramkit-review for a full audit (validate structure, embed-safety, WCAG contrast).
3. Run `vp check`.
4. Summarize which pages received diagrams, which engine was used, and which pages were intentionally skipped.
```
