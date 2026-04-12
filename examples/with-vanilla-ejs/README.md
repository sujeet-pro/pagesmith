# Pagesmith + EJS

Best-practice **`@pagesmith/core` + Vite + EJS** static site: filesystem collections, SSR entry contract, EJS boundaries, SSG, and Pagefind — without `@pagesmith/docs` or virtual content modules.

## Quick start

```bash
# From the monorepo root
vp install
vp run dev:eg:vanilla-ejs
```

Agent-oriented notes for this stack: [`llms.txt`](./llms.txt).

## Integration flow (read this before copying files)

1. **`content.config.mjs`** — Declares collections (`defineCollection` / `defineCollections`) and Zod schemas. This is the typed boundary between markdown files and code.
2. **`src/entry-server.tsx`** — Imports that config, calls **`createContentLayer`**, implements **`getRoutes`** + **`render`** expected by `pagesmithSsg` (`@pagesmith/core/vite`). All routing, sorting, and `ejs.render()` calls live here.
3. **`templates/`** — **Fragment** templates (`article`, `index`, `about`) produce HTML strings; **`layout.ejs`** wraps them with site chrome. **`data-pagefind-body`** sits on the indexed region (see `article.ejs` / `about.ejs` / home branch in `layout.ejs`), not on the entire document.
4. **`vite.config.ts`** — `sharedAssetsPlugin()` plus **`...pagesmithSsg({ entry, contentDirs })`**. `contentDirs` feeds dev watching and companion asset copying.
5. **Client vs SSR** — **`client.js`** is the Vite client bundle (theme CSS + `@pagesmith/core/runtime/content` + small Pagefind trigger tweaks). **`layout.ejs`** still ships inline scripts for sidebar, TOC, and theme — that split is intentional.
6. **Pagefind** — After production SSG, the plugin indexes HTML. **`SsgRenderConfig.searchEnabled`** is `false` in dev and `true` when the index exists; **`layout.ejs`** gates Pagefind CSS/JS/modal/trigger on that flag.

## Content layout

| Directory | Collection | Role |
|-----------|------------|------|
| `content/guide/` | `guide` | How this example works, including `guide/kitchen-sink.md` for markdown regression |
| `content/pages/` | `pages` | Standalone pages (about) |

## Theme

This example implements the Pagesmith standalone theme controls (appearance, paper/high-contrast, text size) with FOUC prevention via an inline snippet in `layout.ejs` and persistence in `localStorage`.

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/vanilla-ejs)
