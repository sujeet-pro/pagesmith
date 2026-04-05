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
2. Register content plugin before SSG output steps.
3. Ensure SSR entry exports `getRoutes` and `render`.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Vite Plugins)

## Write markdown content

1. Create markdown files with frontmatter (`title`, `description`, etc.).
2. Use fenced code blocks with language identifiers.
3. Use Expressive Code meta for titles, line numbers, and line highlighting.
4. Use mermaid code blocks for diagrams (` ```mermaid `).
5. Use GitHub Alerts for callouts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`).
6. Validate with built-in content validators.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Markdown Pipeline, Expressive Code, Validators)

## Update markdown behavior

1. Update config through markdown options (`remarkPlugins`, `rehypePlugins`, `shiki`).
2. Keep plugin order consistent with pipeline expectations.
3. Validate with rendered output and built-in validators.

**Read:** `node_modules/@pagesmith/core/REFERENCE.md` (Markdown Pipeline, Custom Plugins)

## Update AI pointers in consuming project

Add pointer lines to root `CLAUDE.md` or `AGENTS.md`:

```
For @pagesmith/core usage and prompts, read node_modules/@pagesmith/core/docs/agents/usage.md
For the full @pagesmith/core API reference, see node_modules/@pagesmith/core/REFERENCE.md
```

Or copy `node_modules/@pagesmith/core/docs/agents/AGENTS.md.template` as a starting point.