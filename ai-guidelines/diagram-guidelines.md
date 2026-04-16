# Repo Diagram Guidelines

Repo-maintainer guidance for generating diagrams and other documentation images in the Pagesmith monorepo.

Use this file when writing or updating docs under `docs-site/content/`, package `README.md` / `REFERENCE.md`, package `ai-guidelines/`, examples, or repo-maintainer guidance that would be clearer with a visual.

## Source Of Truth

- Repo docs authoring rules: `ai-guidelines/docs-guidelines.md`
- Repo markdown parity rules: `ai-guidelines/markdown-guidelines.md`
- Published docs-package guidance: `packages/docs/ai-guidelines/docs-guidelines.md`, `packages/docs/ai-guidelines/markdown-guidelines.md`
- Diagram toolchain: `diagramkit.config.json5`, `package.json` scripts, `node_modules/diagramkit/ai-guidelines/usage.md`, `node_modules/diagramkit/ai-guidelines/diagram-authoring.md`
- External skill references that informed this file:
  - `~/personal/agents-devkit/skills/diagram-mermaid/SKILL.md`
  - `~/personal/agents-devkit/skills/diagram-excalidraw/SKILL.md`
  - `~/personal/agents-devkit/skills/diagram-drawio/SKILL.md`
  - `~/personal/agents-devkit/skills/diagram-graphviz/SKILL.md`

## Repo Defaults

- Use `diagramkit` for diagram rendering in this repo.
- Keep editable diagram source files versioned with the docs they belong to.
- Put diagrams in a `diagrams/` folder next to the markdown file that references them.
- Render light and dark SVG variants as direct siblings of the source file.
- Prefer SVG for docs. Add PNG only when another surface explicitly needs a raster image.
- Re-render from source instead of hand-editing generated image files.

## Output Layout

Preferred page-local layout:

```text
docs-site/content/guide/architecture/README.md
docs-site/content/guide/architecture/diagrams/system-overview.mermaid
docs-site/content/guide/architecture/diagrams/system-overview-light.svg
docs-site/content/guide/architecture/diagrams/system-overview-dark.svg
```

The repo-level `diagramkit.config.json5` uses `sameFolder: true`, so rendered files land beside the source diagram file instead of inside a hidden `.diagramkit/` folder.

## Commands

Run these from the repo root:

```bash
npm run diagramkit:warmup
npm run render:diagrams
npm run render:diagrams:watch
```

Use `npm run diagramkit:warmup` before the first Mermaid, Excalidraw, or draw.io render on a machine that may not have Chromium installed yet.

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


| Need                                                                                          | Best choice | Why                                             |
| --------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------- |
| Flowcharts, sequence diagrams, state diagrams, ER diagrams, timelines, simple C4 views        | Mermaid     | Text-first, diff-friendly, and fast to revise   |
| Architecture overviews, system context, conceptual sketches, presentation-style visuals       | Excalidraw  | Flexible freeform layout with a hand-drawn look |
| Network topology, cloud/vendor icon diagrams, BPMN, precise manual layout, multi-page visuals | draw.io     | Rich libraries and tight layout control         |
| Dependency graphs, call graphs, rank-constrained graphs, existing `.dot` assets               | Graphviz    | Strong algorithmic layout and graph semantics   |


## Authoring Rules

- Prefer focused diagrams over giant kitchen-sink diagrams.
- Use semantic file names such as `request-flow.mermaid` or `docs-build-pipeline.drawio`.
- For Mermaid diagrams that will be embedded as `<img>` assets, add `%%{init: {'htmlLabels': false}}%%` at the top of the source so the rendered SVG stays compatible with browser and webview image rendering.
- Keep labels explicit and reader-facing.
- Add descriptive alt text in the markdown file.
- Add a short sentence near the diagram that tells the reader what to notice.
- Keep source diagrams and rendered outputs committed together.
- Re-run `npm run render:diagrams` after every source change before finishing.

## Embed In Pagesmith Docs

For Pagesmith-rendered docs pages, wrap the light/dark pair in a `<figure>` with a `<figcaption>` and use the built-in theme classes. Use `alt` for a detailed description of what the image renders (for accessibility). Use `<figcaption>` for a short visible label.

```html
<figure>
  <img src="./diagrams/system-overview-light.svg" class="only-light" alt="System overview showing how docs content flows through Pagesmith build and preview, with collection loading, markdown pipeline, and static output stages">
  <img src="./diagrams/system-overview-dark.svg" class="only-dark" alt="System overview showing how docs content flows through Pagesmith build and preview, with collection loading, markdown pipeline, and static output stages">
  <figcaption>Docs build pipeline</figcaption>
</figure>
```

For simple black-and-white diagrams that don't need separate light/dark renders, use `.invert-on-dark` instead:

```html
<figure>
  <img src="./diagrams/simple-flow.svg" class="invert-on-dark" alt="Simple flow showing request path through the build pipeline from source to output">
  <figcaption>Build flow</figcaption>
</figure>
```

For non-image content that should toggle with the color scheme, use `.show-on-light` / `.show-on-dark` on any element.

Use the `<figure>` pattern for:

- `docs-site/content/**`
- `examples/**/docs/**`
- other Pagesmith-rendered markdown surfaces that support the shared theme CSS

## Embed In GitHub-Facing Markdown

For surfaces that rely on GitHub-style markdown rendering, use a `<picture>` element so the viewer can pick the correct theme variant:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./diagrams/system-overview-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./diagrams/system-overview-light.svg" />
  <img alt="System overview showing how docs content flows through Pagesmith build and preview" src="./diagrams/system-overview-light.svg" />
</picture>
```

Use this for:

- package `README.md`
- package `REFERENCE.md`
- repo `README.md`
- any markdown surface that is primarily consumed on GitHub

## Diagram Review Checklist

- Does the page become easier to understand with a diagram?
- Is the chosen engine the simplest one that fits?
- Are the source file and rendered `-light.svg` / `-dark.svg` siblings?
- Is the markdown embedding pattern correct for the target surface?
- Is the alt text descriptive and specific?
- Did you rerun `npm run render:diagrams` after edits?
- Did you avoid hand-editing generated image files?

## Related Files

- `ai-guidelines/docs-diagram-pass-prompt.md`
- `packages/docs/ai-guidelines/docs-guidelines.md`
- `packages/docs/ai-guidelines/markdown-guidelines.md`

