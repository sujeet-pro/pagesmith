# @pagesmith/site Setup Prompt

Use this file when you want an AI agent to bootstrap or retrofit `@pagesmith/site` in an existing repository.

Version-matched package copy:

- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`

Hosted copy:

- `https://projects.sujeet.pro/pagesmith/prompts/setup-site.md`

Source in this repo:

- `packages/site/skills/pagesmith-site-setup/references/setup-site.md`

This file is for first-time setup and retrofit work. For upgrades to an existing `@pagesmith/site` integration, use `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/migration.md`.

Companion files the agent should read:

- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/site-guidelines.md`
- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md`
- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/recipes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`

## Prompt: bootstrap or retrofit @pagesmith/site in a repo

```text
Set up `@pagesmith/site` in this repository. Read `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` first and follow it exactly.

Requirements:
1. Install `@pagesmith/site` in the relevant root package or workspace package.
2. Inspect the existing app and build system before choosing the integration shape.
3. Prefer `@pagesmith/site` as the app-facing package for content collections, markdown rendering, and `pagesmithContent`. Only drop to direct `@pagesmith/core` imports when the project intentionally wants the lower-level headless package.
4. If the repo is Vite-based and wants Pagesmith to own static rendering, wire:
   - `pagesmithContent` from `@pagesmith/site/vite`
   - `pagesmithSsg` and `sharedAssetsPlugin` from `@pagesmith/site/vite`
   - an SSR entry that exports `getRoutes()` and `render()`
5. If the repo already owns routing or build tooling (for example Next.js or another framework host), keep that ownership in place but still treat `@pagesmith/site` as the app-facing Pagesmith package for content APIs and any shared JSX runtime, CSS bundles, or browser runtime modules the project needs.
6. Only add `pagesmith-site` CLI scripts when the repo adopts a preset-defined workflow. Do not replace a plain Vite or framework command set with `pagesmith-site` unless a preset is part of the design.
7. Create the minimum useful starter content, entry server, client/runtime hook, and CSS wiring needed to prove the integration works.
8. Keep Pagesmith’s shared runtime behavior reusable: prefer `@pagesmith/site/runtime/*` over one-off local copies of TOC highlighting, code tabs, copy buttons, or theme persistence when the shipped behavior fits.
9. Update project memory files so future agents read:
   - `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`
   - `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md`
   - `node_modules/@pagesmith/site/REFERENCE.md`
   - `node_modules/@pagesmith/core/REFERENCE.md`
   - `.pagesmith/markdown-guidelines.md` when AI artifacts are installed
10. If AI artifacts are missing and the project already installs `@pagesmith/core` directly, install or refresh them with `npx pagesmith-core ai --profile default`. If the project stays on `@pagesmith/site` only, rely on the package-owned prompt/reference files directly instead of adding a second dependency just for AI artifacts. If the project already maintains custom root `llms.txt` files, use `npx pagesmith-core ai --profile default --no-llms`.
11. Before finishing, verify the site in dev/build mode, summarize whether the repo is using the Vite SSG path or the framework-hosted path, and call out any decisions that still need user input.
```

## Prompt: improve an existing @pagesmith/site integration in place

```text
Improve the existing `@pagesmith/site` integration in this repository. Read `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` first and then make the current setup more agent-friendly without changing the project’s architecture unnecessarily.

Requirements:
1. Keep site-app imports on `@pagesmith/site`. Drop to direct `@pagesmith/core` imports only when the repository intentionally wants the lower-level headless package instead of the site package.
2. Preserve the current Vite, SSR, or framework-hosted shape unless there is a clear bug caused by the current split.
3. If the project uses a preset-defined workflow, keep `pagesmith-site` aligned to that preset instead of hardcoding docs-specific assumptions.
4. If the project uses direct Vite plugins, verify `pagesmithContent`, `pagesmithSsg`, and `sharedAssetsPlugin` all come from `@pagesmith/site/vite` unless the repo intentionally keeps lower-level core imports.
5. Refresh AI pointers so future agents read `setup-site.md`, `usage.md`, `REFERENCE.md`, and `.pagesmith/markdown-guidelines.md`.
6. Refresh AI artifacts with `npx pagesmith-core ai --profile default` only when they are missing or clearly stale and the project already installs `@pagesmith/core` directly.
7. Verify the existing site still builds and previews correctly, then summarize the improvements and remaining gaps.
```
