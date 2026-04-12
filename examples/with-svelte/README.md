# Pagesmith + Svelte

Best-practice **@pagesmith/core + Svelte** static site: collections and virtual modules drive content; `svelte/server` renders HTML at build time; `renderDocumentShell` wraps each page (FOUC script, assets, optional Pagefind Component UI); `client.js` + `src/runtime.ts` add small progressive enhancements without shipping a client Svelte runtime.

## Quick start

```bash
vp install
vp run dev:eg:svelte
```

## Integration flow (read the guides)

| Step | Where |
|------|--------|
| Zod-backed collections | `content.config.ts` |
| Virtual modules (`virtual:content/*`) | `pagesmithContent` in `vite.config.ts`; imports in `src/site.ts` |
| Routes + HTML per URL | `pagesmithSsg` → `src/entry-server.ts` (`getRoutes`, `render`) |
| Svelte layouts | `src/App.svelte`, `src/components/*.svelte` |
| Document shell (Pagefind modal lives here, not duplicated in Svelte) | `renderDocumentShell` in `entry-server.ts` |
| Browser split | `client.js` (CSS + `@pagesmith/core/runtime/content` + `runtime.ts`) |

Agent-oriented overview: `llms.txt` in this directory.

## Content layout

| Directory | Collection | Role |
|-----------|------------|------|
| `content/guide/` | `guide` | How this example is wired, including `guide/kitchen-sink.md` for markdown regression |
| `content/pages/` | `pages` | Standalone pages |

## Theme

Header dropdown and footer controls persist preferences under `localStorage` (`pagesmith-theme`); the shell’s inline script reapplies them before paint (see `@pagesmith/core` `renderDocumentShell`).

## Live demo

https://projects.sujeet.pro/pagesmith/examples/svelte
