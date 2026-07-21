---
name: pagesmith-core-setup
description: Bootstrap or retrofit @pagesmith/core (the headless content layer) into an existing repository. Use when the user wants typed content collections, schema validation, markdown rendering, and custom loaders inside an existing app or framework, and does NOT want @pagesmith/site's CLI, JSX runtime, or SSG layer.
allowed-tools: Bash(npx pagesmith-core *)
---

# Bootstrap @pagesmith/core

Use this skill to add `@pagesmith/core` — the headless content layer — to an existing repository. Reach for `pagesmith-site-setup` instead if the project also wants Pagesmith's shared CSS/runtime, JSX server runtime, or SSG CLI. Reach for `pagesmith-docs-setup` if the project wants the opinionated docs preset.

## Read the locally installed reference first

Before editing config, open `node_modules/@pagesmith/core/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for `ContentLayer`, `defineCollection`, loaders, the markdown pipeline, and the `pagesmithContent` Vite plugin. If it disagrees with this skill or general training data, follow the local file.

Invoke the CLI through `npx pagesmith-core <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` rather than a global binary.

If `@pagesmith/core` is not installed yet, run `npm add @pagesmith/core` first so the local `REFERENCE.md` exists.

## Prerequisites

- Node.js 24+.
- `package.json` with `type: module`.
- A host app or Vite build; `@pagesmith/core` does not own routing, CSS, or SSG.

## Install

```bash
npm add @pagesmith/core
```

## Pick an integration shape

1. **Vite-based app with virtual collection modules** → create `content.config.ts` and wire `pagesmithContent` from `@pagesmith/core/vite`.
2. **Framework-owned app** (Next.js, SSR, custom build) → keep routing and layout in the host app and use `createContentLayer()` + `entry.render()` directly.
3. **Build-time script / data pipeline** → use `ContentLayer` inside your own CLI/build step.

## `content.config.ts` (Vite shape)

```ts
import { defineCollections, z } from "@pagesmith/core";

export default defineCollections({
  docs: {
    directory: "content/docs",
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
    }),
  },
});
```

Wire the plugin in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import pagesmithContent from "@pagesmith/core/vite";

export default defineConfig({
  plugins: [pagesmithContent()],
});
```

Import collections as virtual modules:

```ts
import { docs } from "virtual:pagesmith/collections";
```

## `ContentLayer` shape (framework / Next.js)

```ts
import { createContentLayer } from "@pagesmith/core";
import config from "./content.config.ts";

const content = await createContentLayer(config);
const entry = await content.getEntry("docs", "getting-started");
const html = await entry.render();
```

Keep routing, layouts, and CSS in the host app. Do not re-export JSX runtime or shared CSS from `@pagesmith/core` — those live in `@pagesmith/site`.

## Folder layout

- Keep markdown entries as folders (`content/<collection>/<slug>/index.md`) whenever pages reference sibling assets. Pagesmith's loaders treat `index.md` as the entry and hoist siblings as assets.
- Entries may be single `.md` files when there are no assets.

## Typed collections with Zod

`defineCollection` (or `defineCollections`) requires a Zod schema. Schemas are enforced at load time; invalid entries fail validation before they reach `render()`. Throw schema validation is the default — set `strict: false` on the top-level config only when the app wants to surface issues as warnings.

## AI artifacts in the consumer repo

Install or refresh per-project AI artifacts with the core CLI:

```bash
npx pagesmith-core ai --profile default
```

This creates `.pagesmith/markdown-guidelines.md`, AGENTS/CLAUDE/GEMINI pointers, and root `llms.txt` / `llms-full.txt` when they are missing. If the project already maintains custom root `llms*.txt`, run with `--no-llms` to skip those.

Point project memory (`CLAUDE.md` / `AGENTS.md`) at:

```
For @pagesmith/core usage and prompts, read node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md
For the full @pagesmith/core API reference, see node_modules/@pagesmith/core/REFERENCE.md
```

## Verify

- Run the host app or `npx vite dev` and confirm a collection loads.
- Dropping a malformed entry surfaces a Zod validation error with the file path.
- `entry.render()` returns non-empty HTML for markdown entries.

## Rules

- `@pagesmith/core` is headless. Do not move JSX runtime, shared CSS, or SSG concerns into it — if the project needs those, adopt `@pagesmith/site` instead of layering both.
- Content loaders are pure: one IO call inside `load(filePath)`, no caching, no mutation.
- Validation happens at content boundaries; never skip it to silence a failing schema.
- Keep folder nesting shallow (3–4 levels max under `content/`).

## When to use other skills

- `pagesmith-core-add-collection` — add a new typed collection.
- `pagesmith-core-add-loader` — add a new file format or virtual loader.
- `pagesmith-core-customize-markdown` — customize the markdown pipeline or renderer.
- `pagesmith-core-write-validator` — write a content validator plugin.

## Reference

- `./references/setup-core.md` — long-form setup + retrofit prompts.
- `./references/core-guidelines.md` — package rules and expectations.
- `./references/usage.md` — agent rules, integration shape, copy-paste prompts.
- `./references/recipes.md` — step-by-step recipes for common additions.
- `./references/AGENTS.md.template` — template for the consumer project's AGENTS.md.
- `node_modules/@pagesmith/core/REFERENCE.md` — full API reference.
