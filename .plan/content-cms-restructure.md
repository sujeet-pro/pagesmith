# Pagesmith → File-Based CMS Restructure

**Goal**: Reposition `@pagesmith/content` as the primary product — a framework-agnostic file-based CMS with validated content collections, multi-format support, diagram rendering, and optional runtime attachments.

**Status**: Complete

---

## Architecture Overview

```
@pagesmith/core          Markdown engine, JSX runtime, CSS builder, schemas
@pagesmith/content       Content CMS: collections, loaders, validation, diagrams, runtime CSS/JS
pagesmith                Full SSG (consumes @pagesmith/content)
```

`@pagesmith/content` is the star. It works with any framework. `pagesmith` is one consumer.

---

## Workstreams

### WS1: Content Validation Pipeline (packages/content)

- [ ] Port validators from pagesmith to content package (single-pass, extensible)
  - [ ] Link validation (internal links resolve, external links are well-formed)
  - [ ] Code block property validation (collapse line ranges exist, valid meta syntax)
  - [ ] Heading structure validation (no skipped levels, single h1)
  - [ ] Frontmatter schema validation (already exists via Zod)
- [ ] Add JSONC loader (JSON with comments)
- [ ] Validation works on raw AST — no HTML conversion needed
- [ ] Auto-configured validators with opt-out via config
- [ ] Extensible: users can add custom validators via `validate` hook on collection

### WS2: Diagram System (packages/content)

- [ ] Port diagram rendering from pagesmith to content package
  - [ ] .mermaid → SVG (light + dark variants)
  - [ ] .excalidraw → SVG (light + dark variants)
  - [ ] SVG post-processing (color contrast fixes from v5.sujeet.pro)
- [ ] Hidden folder convention: `.diagrams/` with `name-light.svg`, `name-dark.svg`, `manifest.json`
- [ ] CLI utility: `pagesmith-content diagrams [--force] [--watch] <folder>`
  - [ ] Recursive scan for .mermaid/.excalidraw
  - [ ] Generate into sibling `.diagrams/` hidden folder
- [ ] Two display modes (config-driven):
  - [ ] `picture` (default): `<picture>` with `<source media="(prefers-color-scheme: dark)">`
  - [ ] `class`: Two `<img>` tags with `.only-light`/`.only-dark` classes
- [ ] Rehype plugin to rewrite markdown image refs to rendered SVGs
- [ ] CSS for both display modes (exported as optional attachment)

### WS3: Runtime Attachments (packages/core + packages/content)

- [ ] Restructure CSS exports from @pagesmith/core:
  - [ ] `standalone.css` — reset + prose + code (already exists, refine)
  - [ ] `diagrams.css` — light/dark image switching (picture + class modes)
  - [ ] `tabs.css` — code tabs, capped at 8 tabs (extract from standalone)
  - [ ] `viewport.css` — max 100% viewport width, no extra horizontal spacing
- [ ] Keep `standalone.css` as the all-in-one import
- [ ] JS: `standalone.js` — copy-code only (markdown-specific, no theme/toc)
- [ ] Export paths from @pagesmith/content:
  - [ ] `@pagesmith/content/runtime/css` → getRuntimeCSS(), individual getters
  - [ ] `@pagesmith/content/runtime/js` → getRuntimeJS()
  - [ ] File paths for bundler integration

### WS4: Shared Sample Content (examples/shared-content)

- [ ] Create ONE comprehensive markdown file (`posts/kitchen-sink.md`) covering:
  - [ ] All heading levels (h1-h6) with proper nesting
  - [ ] GFM: tables, strikethrough, task lists, autolinks
  - [ ] Code blocks: multiple languages, line numbers, highlights, diffs, collapse
  - [ ] Consecutive titled code blocks → code tabs
  - [ ] Math (inline + block)
  - [ ] Images, figures, alt text
  - [ ] Diagram references (.mermaid, .excalidraw as images)
  - [ ] Internal + external links
  - [ ] Blockquotes, footnotes, definition lists
  - [ ] Frontmatter with all supported fields
- [ ] Sample .mermaid diagram (flowchart)
- [ ] Sample .excalidraw diagram (architecture)
- [ ] Sample JSON, YAML, TOML data files for non-markdown collections

### WS5: Example Apps (examples/)

- [ ] Simplify existing examples to use shared content
- [ ] `with-vanilla-ejs` — render all markdown variations (kitchen-sink.md)
  - [ ] EJS template, simple HTML, no framework overhead
  - [ ] Shows: content loading, rendering, runtime CSS/JS attachment
- [ ] `with-vanilla-hbs` — render all markdown variations (kitchen-sink.md)
  - [ ] Handlebars template
- [ ] `with-ssg` — minimal SSG example:
  - [ ] No client-side JS runtime (except global copy-code)
  - [ ] No theme system (uses OS preference via CSS)
  - [ ] Simple header/footer via template
  - [ ] Shows: build script, static output, asset handling
- [ ] Framework examples (React, Solid, Svelte) consume shared content

### WS6: Documentation (docs/)

- [ ] `docs/architecture.md` — system architecture with Mermaid diagrams
  - [ ] Package dependency graph
  - [ ] Content loading pipeline
  - [ ] Validation pipeline
  - [ ] Diagram rendering pipeline
- [ ] `docs/why-pagesmith.md` — motivation and benefits
  - [ ] Comparison with Contentlayer, Astro Content Collections, Velite
  - [ ] Single-pass validation advantage
  - [ ] Framework agnosticism
  - [ ] Runtime-agnostic (Bun/Deno/Node)
- [ ] `docs/getting-started.md` — quick start guide
- [ ] `docs/content-formats.md` — all supported formats + loader API
- [ ] `docs/validation.md` — validation pipeline, built-in validators, custom validators
- [ ] `docs/diagrams.md` — diagram rendering, display modes, CLI
- [ ] `docs/runtime.md` — CSS/JS attachments, customization
- [ ] `docs/api-reference.md` — full API with types
- [ ] `docs/guidelines.md` — coding conventions, content authoring guidelines
- [ ] `llm.txt` + `llms_full.txt` at repo root

### WS7: CLAUDE Files & Project Config

- [ ] Update root `CLAUDE.md` — reflect content CMS positioning
- [ ] Update `packages/pagesmith/CLAUDE.md` — clarify it consumes @pagesmith/content
- [ ] Create `packages/content/CLAUDE.md` — the primary package docs
- [ ] Create `packages/core/CLAUDE.md` — markdown engine docs

---

## Execution Order

**Phase 1** (parallel — independent workstreams):

- WS1: Content validation pipeline
- WS2: Diagram system
- WS3: Runtime attachments
- WS4: Shared sample content

**Phase 2** (depends on Phase 1):

- WS5: Example apps (needs runtime attachments + sample content)
- WS6: Documentation (needs all features implemented)
- WS7: CLAUDE files (needs architecture settled)

---

## Key Design Decisions

1. **Single-pass validation**: Validators inspect the unified AST (MDAST/HAST) during markdown processing, NOT the final HTML. This means validation is fast and doesn't require a separate render pass.

2. **Picture tag default**: The `<picture>` approach with `<source media="...">` is more semantic and works without JS. Class-based mode is available for existing themes that use JS-driven theme toggling.

3. **Hidden `.diagrams/` folder**: Keeps generated SVGs close to source without polluting the content directory. The manifest enables incremental rebuilds.

4. **Optional runtime**: CSS/JS are opt-in exports. Consumers can use their own styling. The provided CSS is modular — import all or individual pieces.

5. **No layout code in content package**: `@pagesmith/content` returns data + HTML. How you render the page is your problem. The SSG example shows one approach.
