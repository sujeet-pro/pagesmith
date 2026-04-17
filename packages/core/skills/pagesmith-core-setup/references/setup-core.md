# @pagesmith/core Setup Prompt

Use this file when you want an AI agent to bootstrap or retrofit `@pagesmith/core` in an existing repository.

Version-matched package copy:

- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`

Hosted copy:

- `https://projects.sujeet.pro/pagesmith/prompts/setup-core.md`

Source in this repo:

- `packages/core/skills/pagesmith-core-setup/references/setup-core.md`

This file is for first-time setup and retrofit work. For upgrades to an existing `@pagesmith/core` integration, use `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/migration.md`.

Companion files the agent should read:

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`
- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`
- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/recipes.md`
- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/migration.md`
- `node_modules/@pagesmith/site/REFERENCE.md` when the project also needs shared CSS/runtime, JSX, or SSG

## Prompt: bootstrap or retrofit @pagesmith/core in a repo

```text
Set up `@pagesmith/core` in this repository. Read `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` first and follow it exactly.

Requirements:
1. Install `@pagesmith/core` in the relevant root package or workspace package.
2. Inspect the existing app, framework, and build flow before choosing an integration shape.
3. Keep `@pagesmith/core` focused on the content layer: collections, schemas, validation, markdown rendering, loaders, and `pagesmithContent` for Vite.
4. If the repo already owns routing or build tooling (for example Next.js, custom SSR, or an existing framework app), keep routing/layout in the host app and integrate Pagesmith with `createContentLayer()` plus `entry.render()`.
5. If the repo is Vite-based and wants virtual collection modules, create or refresh `content.config.ts` (or `.js` / `.mjs`) and wire `pagesmithContent` from `@pagesmith/core/vite`.
6. Use folder-based markdown entries when pages reference sibling assets.
7. Define typed collections with Zod schemas and create the minimum useful starter content needed to prove the integration works.
8. Do not move JSX runtime, shared CSS/runtime behavior, or SSG concerns into `@pagesmith/core`. If the project needs those, use `@pagesmith/site` as the app-facing Pagesmith package instead of layering both packages into the same integration.
9. Add or refresh project scripts only when the host app actually needs them. Do not force a Pagesmith-owned site CLI into a framework app that already has its own dev/build commands.
10. Update project memory files so future agents read:
    - `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`
    - `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`
    - `node_modules/@pagesmith/core/REFERENCE.md`
    - `.pagesmith/markdown-guidelines.md` when AI artifacts are installed
11. If AI artifacts are missing, install or refresh them with `npx pagesmith-core ai --profile default`. If the project already maintains custom root `llms.txt` files, use `npx pagesmith-core ai --profile default --no-llms`.
12. Before finishing, verify the integration in the host app or Vite build, summarize the chosen integration shape, and call out any place where the user needs to make a product or framework decision.
```

## Prompt: improve an existing @pagesmith/core integration in place

```text
Improve the existing `@pagesmith/core` integration in this repository. Read `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` first and then make the current setup more agent-friendly without changing the project’s architecture unnecessarily.

Requirements:
1. Keep the current framework/router/build ownership unless there is a clear bug caused by the existing split.
2. Reuse the existing content directories and collection model unless there is an obvious schema or organization problem.
3. If the repo is Vite-based, verify `pagesmithContent` still comes from `@pagesmith/core/vite`.
4. If the repo uses `@pagesmith/site` too, keep CSS/runtime/SSG imports on `@pagesmith/site` instead of drifting them back into core.
5. Add or refresh AI pointers so future agents read `setup-core.md`, `usage.md`, `REFERENCE.md`, and `.pagesmith/markdown-guidelines.md`.
6. Refresh AI artifacts with `npx pagesmith-core ai --profile default` only when the project is missing them or they are clearly stale.
7. Verify the current content integration still renders correctly, then summarize the improvements and remaining gaps.
```
