# Docs Diagram Pass Prompt

Copy and run this prompt when you want an agent to review the repo's documentation and add diagrams where they materially simplify explanation.

## Prompt

```text
Review all documentation in this repository and add diagrams wherever they materially simplify explanation.

Before editing anything, read:
- AGENTS.md
- CLAUDE.md
- ai-guidelines/docs-guidelines.md
- ai-guidelines/markdown-guidelines.md
- ai-guidelines/diagram-guidelines.md
- packages/docs/ai-guidelines/docs-guidelines.md
- packages/docs/ai-guidelines/markdown-guidelines.md
- every project skill under .claude/skills/prj-*/SKILL.md

Audit these documentation surfaces:
- docs/content/**/*.md
- packages/*/README.md
- packages/*/REFERENCE.md
- packages/*/ai-guidelines/**/*.md
- examples/**/*.md

For each documentation page:
1. Decide whether a diagram would simplify a workflow, architecture, lifecycle, dependency graph, topology, taxonomy, or decision path.
2. If a diagram helps, create a sibling `diagrams/` folder next to the markdown file.
3. Choose the best source format using ai-guidelines/diagram-guidelines.md:
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

