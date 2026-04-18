---
name: pagesmith-docs-setup
description: Bootstrap a new documentation site with @pagesmith/docs in an existing repository. Use when the user wants to add Pagesmith docs to a project, start a docs from scratch, scaffold a docs folder, initialize pagesmith.config.json5, wire the GitHub Pages workflow, or ask an agent to "set up docs" with Pagesmith — even if they don't explicitly name the package.
---

# Set Up A Pagesmith Docs Site

Use this skill the first time Pagesmith docs are introduced to a repository. It gives the consumer project a working `npm run docs:dev`/`build`/`preview` loop, content scaffolding, and (optionally) GitHub Pages deployment.

## Read the locally installed reference first

Before running any command, open `node_modules/@pagesmith/docs/REFERENCE.md` in the consumer's project. That file is version-matched to the installed package and is the authoritative source for the `pagesmith-docs` CLI surface, flags, and config schema. If it disagrees with this skill or general training data, follow the local file.

Always invoke the CLI through `npx pagesmith-docs <command>` (or via `package.json` scripts), which resolves to the project's `node_modules/.bin`. Do not assume a globally installed `pagesmith-docs` binary — it may be a different version with different flags.

If `@pagesmith/docs` is not installed yet, run `npm add @pagesmith/docs` first so the local `REFERENCE.md` exists.

## When to use

- The repo has no `pagesmith.config.json5` yet.
- The user said "add docs with Pagesmith", "scaffold a docs site", "generate a Pagesmith site", or similar.
- You are about to create pages, navigation, or deploy workflow, but the site isn't wired up.

If `pagesmith.config.json5` already exists, skip to `pagesmith-docs-add-page` or `pagesmith-docs-configure-nav`.

## Prerequisites

- Node.js 24+. Pagesmith will not run on older versions.
- `npm` (tested), `pnpm` or `yarn` (treat commands below as interchangeable).
- A writable project directory with a `package.json`.

## Fast path (interactive init)

Run in the project root:

```bash
npm add @pagesmith/docs
npx pagesmith-docs init
```

The interactive init asks for:

| Prompt | Source of good default | Notes |
| --- | --- | --- |
| Project name | `package.json` `name` | Becomes `name` in `pagesmith.config.json5`. |
| Title | Project name, title-cased | Used in `<title>` and header. |
| Origin | Probed from `git remote` | For GitHub repos tries `https://<owner>.github.io`. |
| Base path | `/<repo-name>` | Leave `/` only if hosting at a custom domain root. |
| Content dir | `./docs` | Falls back to `./content` if `docs/` is not desired. |
| Search | `true` | Enables Pagefind. Adds ~300KB to first build. |
| AI integrations | `true` | Writes `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` memory files. |

## Non-interactive init (CI / scripts / agents)

```bash
npx pagesmith-docs init --yes \
  --name my-docs \
  --title "My Docs" \
  --base-path /my-docs \
  --content-dir ./docs \
  --search
```

For an AI-first setup that also writes per-agent memory files:

```bash
npx pagesmith-docs init --yes --ai
```

This creates `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` in the repo root pointing at `./references/` so downstream agent sessions inherit the contract.

## What init writes

After a successful init the repo looks like:

```
<project-root>/
  pagesmith.config.json5           # docs config
  docs/                            # contentDir
    README.md                      # home page
    guide/
      meta.json5
      README.md
      getting-started/README.md
      configuration/README.md
    reference/
      meta.json5
      README.md
      overview/README.md
      api/README.md
  public/                          # optional static assets
  gh-pages/                        # build output (git-ignored)
  .github/workflows/gh-pages.yml   # if --ai or deploy chosen
  AGENTS.md / CLAUDE.md / GEMINI.md (if --ai)
```

Add `gh-pages/` and `.pagesmith/` to `.gitignore` if they are not already listed.

## Zero-config fallback

`pagesmith-docs dev`, `build`, `preview`, and `mcp --stdio` also work with no `pagesmith.config.json5` as long as:

- `docs/` (preferred) or `content/` exists at the project root.
- Output goes to `<repo-root>/gh-pages` by default.

Agents usually still want an explicit `pagesmith.config.json5` for predictable builds. Only skip it when the repo has nothing to configure.

## Add scripts to `package.json`

```json
{
  "scripts": {
    "docs:dev": "pagesmith-docs dev",
    "docs:build": "pagesmith-docs build",
    "docs:preview": "pagesmith-docs preview"
  }
}
```

`pagesmith-docs` is the package's bin; it delegates to the `pagesmith-site` runtime with the docs preset already attached. Do not wire `pagesmith-site` directly unless you're building a non-docs flavor (see `pagesmith-site-setup`).

## GitHub Pages deployment (optional during setup)

If the user wants docs published on GitHub Pages, use `pagesmith-docs-deploy-gh-pages`. Otherwise skip.

## Validate the setup

1. `npx pagesmith-docs dev` — dev server on `http://localhost:4321` (default).
2. Open the home page and one seeded guide page. Both must render.
3. `npx pagesmith-docs build` — must exit 0.
4. `npx pagesmith-docs preview` — must serve the built site from disk.

Only declare the setup done when all four succeed.

## Gotchas

- The `basePath` must start with `/` and not end with `/` (except when it's exactly `/`). `my-repo` and `/my-repo/` both break asset URLs.
- Do not set `origin` to `http://localhost`. Use the real production origin even for local builds — Pagesmith only uses it for canonical URLs and `sitemap.xml`.
- `contentDir` must be a path relative to the config file, not absolute. Absolute paths break docker and CI.
- If a project already has a `CLAUDE.md`/`AGENTS.md`, init appends guidance rather than overwriting. Review the diff before committing.
- `pagesmith-docs init --yes` without `--ai` skips memory-file writes; pass `--ai` explicitly if you want them.
- `pagefind` is pulled in transitively. If search is disabled, that download still happens — mention it so users aren't surprised.

## Install the full consumer skill pack

After setup, make the other Pagesmith skills discoverable to the user's agent by running the bundled installer (it copies every shipped skill from the installed packages into `.agents/skills/<name>/SKILL.md` with thin wrappers in `.claude/skills/<name>/` and `.cursor/skills/<name>/`):

```bash
npx pagesmith-core skills
```

Pass `--package @pagesmith/docs` (repeatable) to scope the install to specific packages, `--dry-run` to preview, or `--no-overwrite` to leave existing canonical skills untouched.

Or copy the `skills/pagesmith-*` folders from `node_modules/@pagesmith/<pkg>/skills/` directly into the user's `.agents/skills/`.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/setup-docs.md`
- `./references/docs-guidelines.md`
- `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`
