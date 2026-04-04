# @pagesmith/core Agent Recipes

## Create a collection

1. Add a directory under `content/`.
2. Define schema with `z` from `@pagesmith/core`.
3. Register with `defineCollection`.
4. Expose via `defineCollections` or `defineConfig`.

## Add Vite integration

1. Import `pagesmithContent` and `pagesmithSsg` from `@pagesmith/core/vite`.
2. Register content plugin before SSG output steps.
3. Ensure SSR entry exports `getRoutes` and `render`.

## Update markdown behavior

1. Update config through markdown options (`remarkPlugins`, `rehypePlugins`, `shiki`).
2. Keep plugin order consistent with pipeline expectations.
3. Validate with rendered output and built-in validators.

## Update AI pointers in consuming project

Add one pointer line to root `CLAUDE.md` or `AGENTS.md`:

`Use node_modules/@pagesmith/core/docs/agents/usage.md as the canonical @pagesmith/core guide.`
