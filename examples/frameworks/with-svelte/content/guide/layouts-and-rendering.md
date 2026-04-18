---
title: Layouts & Rendering
description: Svelte server rendering, the document shell, and the browser runtime split
date: 2026-03-17
tags:
  - svelte
  - rendering
series: Framework Integration
seriesOrder: 1
---

# Layouts & Rendering

This example is **static-first**: `svelte/server` turns `.svelte` files into HTML strings at build time. There is no Svelte hydration bundle — the shipped JS is Pagesmith’s small markdown helpers plus this project’s `src/runtime.ts`.

## SSG entry contract

`src/entry-server.ts` exports:

```ts
export async function getRoutes(): Promise<string[]>;
export async function render(url: string, config: SsgRenderConfig): Promise<string>;
```

`pagesmithSsg` imports that module, collects routes, and calls `render()` per URL.

## Data flow

1. **Collections** — `content.config.ts` defines `guide` and `pages`, with `guide/kitchen-sink.md` serving as the single markdown regression page.
2. **Virtual modules** — `pagesmithContent` exposes `virtual:content/guide` and `virtual:content/pages`. This example imports them once in `src/site.ts` and exports sorted lists, nav helpers, and types shared by the entry and components.
3. **Route → props** — `render()` resolves the URL to a content entry (or home/404), builds an `appProps` object, and passes it to the root Svelte component.
4. **Svelte output** — `renderSvelte(App, { props: appProps })` returns `{ body, head }`. `body` is everything inside the document body **except** the shared shell extras (see below). `head` is merged into `<head>` via `headHtml`.

## Document shell (`renderDocumentShell`)

The final HTML string is **not** only Svelte output. `renderDocumentShell` from `@pagesmith/site/ssg-utils` wraps `bodyHtml` with:

- `<html>` classes, charset/viewport, FOUC-prevention inline script for saved theme prefs
- Linked CSS (site bundle, fonts, optional Pagefind Component UI stylesheet)
- Optional Pagefind Component UI `<script type="module">`
- **`bodyHtml`** — your Svelte-rendered markup (header, main layout, sidebar dialog markup this example keeps inside Svelte)
- **Optional** trailing `<pagefind-modal>` when `searchEnabled` is true (single instance — do not duplicate in `.svelte`)
- Deferred `client.js` script reference

So: **Svelte owns the primary layout markup** that becomes `bodyHtml`, while **cross-cutting document concerns** (shell wrapper, Pagefind modal placement, deferred client script) stay in `renderDocumentShell` so framework examples stay consistent.

## Component roles

| File                | Role                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `App.svelte`        | `pageKind` router: `HomeBody`, `PageBody`, or `NotFoundBody`; mobile sidebar `<dialog>`. |
| `PageBody.svelte`   | Sidebar + article + TOC + footer; `{@html content}` for markdown.                        |
| `HomeBody.svelte`   | Landing sections and listings.                                                           |
| `SiteHeader.svelte` | Nav + optional `pagefind-modal-trigger`.                                                 |

## Client vs server split

| Surface                       | Responsibility                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `entry-server.ts` + `.svelte` | All HTML strings for each URL.                                                                                 |
| `client.js`                   | Vite browser entry: CSS import order, `@pagesmith/site/runtime/content`, then `runtime.ts`.                    |
| `src/runtime.ts`              | Vanilla progressive enhancement: TOC active state, sidebar `<dialog>`, theme controls, compact search trigger. |

## Build output path

For each route, the plugin writes HTML under the configured `outDir` (see `content/guide/vite-config.md`).
