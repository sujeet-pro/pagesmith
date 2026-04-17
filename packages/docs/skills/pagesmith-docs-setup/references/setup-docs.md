# @pagesmith/docs Setup Prompt

Use this file when you want an AI agent to bootstrap or retrofit `@pagesmith/docs` in an existing repository.

Version-matched package copy:

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`

Hosted copy:

- `https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md`

Source in this repo:

- `packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md`

This file is for fresh setup and retrofit work. For upgrading an existing `@pagesmith/docs` installation and adopting the latest package guidance/features, use `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`.

`@pagesmith/docs` can now run in zero-config mode when a repository already follows the default `docs/` plus `gh-pages/` conventions, but this setup prompt should still create or refine an explicit root `pagesmith.config.json5` so the project has a stable, reviewable configuration file.

Configuration files are resolved in this order: `--config <path>` → `pagesmith.config.ts` → `.mts` → `.mjs` → `.js` → `.json5` → `.json`. When the repo already authors config in TypeScript (`pagesmith.config.ts`), the agent should keep it as-is and use `defineConfig` from `@pagesmith/docs`. Init writes JSON5 only — when a TypeScript config already exists, init reads it for prompt defaults but never overwrites the file.

Companion files the agent should read:

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/changelog-notes.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-root-meta.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json`
- `.pagesmith/markdown-guidelines.md` when AI artifacts are installed

## Prompt: bootstrap or retrofit docs in a repo

```text
Set up docs for this repository using @pagesmith/docs. Read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md first and follow it exactly.

Requirements:
1. Install @pagesmith/docs in the repo's root package or workspace.
2. Identify the repo name and owner from the git remote when possible. Default docs hosting to GitHub Pages with `basePath: "/<repo-name>"`.
3. Probe `https://<owner>.github.io` before writing config. If it resolves or redirects, use the final resolved origin as `origin`. If probing fails, fall back to `https://<owner>.github.io`.
4. If a user wants docs hosted at the root instead of `/<repo-name>`, do not guess. Leave the GitHub Pages-style default in place and tell them to edit `pagesmith.config.json5` manually.
5. Inspect the repository for an existing docs-like directory before creating anything. Check candidates such as docs/, documentation/, guide/, content/, wiki/, or package-specific docs folders.
6. Summarize the strongest docs-folder candidate and confirm with me before reusing, moving, or overwriting an existing directory. If no strong candidate exists, create docs/.
7. Prefer the package init flow after installation: run `npx pagesmith-docs init` with explicit values such as `--yes` (or `--non-interactive` in CI/CD), `--content-dir`, `--base-path`, `--origin`, and `--ai`. The command auto-detects non-TTY environments (also `CI=1` and `PAGESMITH_NON_INTERACTIVE=1`) and falls back to defaults so pipelines never block on a prompt. The init command is safe to rerun: it updates `pagesmith.config.json5`, backfills missing scaffold fields, and refreshes the config `$schema` pointer to the installed package schema. If the init command is not a fit for the repo, perform the same setup manually.
8. Keep pagesmith.config.json5 at the repository root. Set `contentDir` to the chosen docs folder, set `outDir` to `gh-pages` unless the repo already has a better deployment target, and include `$schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json'`.
9. Add root package.json scripts: docs:dev, docs:build, and docs:preview.
10. Create the minimum documentation structure needed for a useful docs site:
   - <docsDir>/README.md as the home page
   - <docsDir>/guide/meta.json5
   - <docsDir>/guide/README.md
   - <docsDir>/guide/getting-started/README.md
   - <docsDir>/guide/configuration/README.md
   - <docsDir>/reference/meta.json5
   - <docsDir>/reference/README.md
   - <docsDir>/reference/overview/README.md
   - <docsDir>/reference/api/README.md
11. Use proper frontmatter and meta files. Follow the version-matched schemas in node_modules/@pagesmith/docs/schemas/ for pagesmith.config.json5, meta.json5, and docs frontmatter. When `pagesmith.config.json5` is at the repo root, its `$schema` should point at `./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`.
12. If the repository already has docs content, preserve and reorganize the useful material instead of replacing it.
13. If the repository has little or no docs, inspect README.md, package.json, source folders, public exports, CLI commands, examples, and tests, then generate starter docs from the implementation.
14. Update or create root CLAUDE.md and AGENTS.md with these pointers:
    - For @pagesmith/docs bootstrap and retrofit tasks, read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md
    - For @pagesmith/docs operating guidance, read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md
    - For the full @pagesmith/docs reference, read node_modules/@pagesmith/docs/REFERENCE.md
    - For docs markdown authoring rules, read .pagesmith/markdown-guidelines.md and node_modules/@pagesmith/docs/REFERENCE.md
    - For version-matched docs schemas, read the files under node_modules/@pagesmith/docs/schemas/
15. If AI artifacts are missing, install or refresh them so .pagesmith/markdown-guidelines.md exists. It is fine to use `npx pagesmith-docs init --ai --no-llms` after the docs-folder choice is confirmed.
16. Keep the docs practical and minimal on the first pass. Make sure the home page, guide section, and reference section all work end to end.
17. Before finishing, run the docs build or preview flow, report assumptions, and highlight any places where you need a user decision.
```

## Prompt: improve an existing @pagesmith/docs integration in place

```text
Improve the existing @pagesmith/docs integration in this repository. Read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md first and then make the current setup more agent-friendly without breaking the existing docs structure.

Requirements:
1. Reuse the existing pagesmith.config.json5 and contentDir unless there is a clear structural problem. Ask before moving docs content.
2. If origin or basePath are missing, default to GitHub Pages style values: detect `/<repo-name>` as the base path and probe `https://<owner>.github.io` to resolve the origin. If the user wants root hosting, tell them to edit the config manually instead of guessing.
3. Prefer running `npx pagesmith-docs init` with explicit values to fill missing defaults, add the root config `$schema`, and backfill starter structure when that is less invasive than hand-editing. Manual edits are also acceptable when the repo is already close to the desired shape.
4. Add any missing root package.json scripts: docs:dev, docs:build, docs:preview.
5. Add or refresh root CLAUDE.md and AGENTS.md pointers so future agents read:
   - node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md
   - node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md
   - node_modules/@pagesmith/docs/REFERENCE.md
   - .pagesmith/markdown-guidelines.md
   - node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json
   - node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json
   - node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json
   - node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json
6. Audit the current docs tree for missing meta.json5 files, missing frontmatter, missing guide/reference landing pages, or weak onboarding flow.
7. Keep or improve the existing docs folder rather than scaffolding a second docs directory.
8. Use the version-matched schema files when editing config, meta.json5, and frontmatter.
9. If AI artifacts are missing, install or refresh them so .pagesmith/markdown-guidelines.md exists.
10. Verify the docs build, then summarize the improvements and any remaining gaps.
```

