# @pagesmith/core Agent Recipes

Short procedural recipes for common content layer workflows. For the full reference, see `node_modules/@pagesmith/core/REFERENCE.md`.

## Create a collection

1. Add a directory under `content/`.
2. Define schema with `z` from `@pagesmith/core`.
3. Register with `defineCollection`.
4. Expose via `defineCollections` or `defineConfig`.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Content Layer API, Collections)

## Add Vite integration

1. Import `pagesmithContent` and `pagesmithSsg` from `@pagesmith/core/vite`.
2. Register the content plugin before SSG output steps and spread `...pagesmithSsg(...)` into the Vite `plugins` array.
3. Ensure SSR entry exports `getRoutes` and `render`.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Vite Plugins)

## Retrofit @pagesmith/core into an existing app

1. Read `node_modules/@pagesmith/core/ai-guidelines/usage.md` and `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`.
2. Reuse the repo's existing framework, routing, and SSR structure instead of scaffolding a separate docs site.
3. Add or adapt `content.config.ts`, then wire Vite with `pagesmithContent` and `...pagesmithSsg(...)`.
4. Update project memory pointers in `CLAUDE.md` / `AGENTS.md`.
5. Verify that virtual module consumers expect serialized payloads (`html`, `headings`, `frontmatter` for markdown collections).

**Read:** `node_modules/@pagesmith/core/ai-guidelines/usage.md`, `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`, `node_modules/@pagesmith/core/REFERENCE.md`

## Write markdown content

1. Create markdown files with frontmatter (`title`, `description`, etc.).
2. Use fenced code blocks with language identifiers.
3. Use built-in code renderer meta for titles, line numbers, and line highlighting.
4. Use mermaid code blocks for diagrams (` ```mermaid `).
5. Use GitHub Alerts for callouts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`).
6. Validate with built-in content validators.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Markdown Pipeline, Code Block Meta Syntax, Validators)

## Update markdown behavior

1. Update config through markdown options (`remarkPlugins`, `rehypePlugins`, `shiki`).
2. Keep plugin order consistent with pipeline expectations.
3. Validate with rendered output and built-in validators.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Markdown Pipeline, Custom Plugins)

## Update AI pointers in consuming project

Add pointer lines to root `CLAUDE.md` or `AGENTS.md`:

```
For @pagesmith/core usage and prompts, read node_modules/@pagesmith/core/ai-guidelines/usage.md
For @pagesmith/core upgrades, read node_modules/@pagesmith/core/ai-guidelines/migration.md
For the full @pagesmith/core API reference, see node_modules/@pagesmith/core/REFERENCE.md
```

Or copy `node_modules/@pagesmith/core/ai-guidelines/AGENTS.md.template` as a starting point.

## Upgrade an existing @pagesmith/core integration

1. Read `node_modules/@pagesmith/core/ai-guidelines/migration.md` and `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md`.
2. Upgrade `@pagesmith/core` with the repository's existing package manager.
3. Recheck Vite wiring: `pagesmithContent(...)` plus `...pagesmithSsg(...)`.
4. Verify that virtual module consumers still match the serialized payload shape.
5. Run the repo's normal validation/build flow and fix any schema or markdown-validator drift.

**Read:** `node_modules/@pagesmith/core/ai-guidelines/migration.md`, `node_modules/@pagesmith/core/ai-guidelines/changelog-notes.md`, `node_modules/@pagesmith/core/REFERENCE.md`