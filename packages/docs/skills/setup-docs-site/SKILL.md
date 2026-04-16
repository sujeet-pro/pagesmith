---
name: setup-docs-site
description: Bootstrap a documentation site with @pagesmith/docs in minutes. Use when starting a new docs site, adding docs to an existing repo, or giving an AI agent the setup prompt.
---

# Set Up A Pagesmith Docs Site

## Fast Path (Interactive)

```bash
npm add @pagesmith/docs
npx pagesmith-docs init
```

The init flow asks for project name, title, base path, content directory, search, and AI integrations — with smart defaults pulled from `git remote` and `package.json`.

## Non-Interactive

```bash
npx pagesmith-docs init --yes
```

Use `--yes` in CI, Dockerfiles, or scripts. Pair with flags for fields you want to set explicitly:

```bash
npx pagesmith-docs init --yes \
  --name my-docs \
  --title "My Docs" \
  --base-path /my-docs \
  --content-dir ./docs \
  --search
```

## AI-First Setup

```bash
npx pagesmith-docs init --yes --ai
```

This scaffolds the site and writes `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` memory files plus one skill per assistant, all pointed at the installed package's `ai-guidelines/`. Install the shipped consumer skills separately (see "Install consumer skills" below) to get task-focused SKILL.md files.

## After Init

1. Write content under your `contentDir`. Use `meta.json5` for per-section ordering and titles.
2. `npx pagesmith-docs dev` for the dev server.
3. `npx pagesmith-docs build` for a static build.
4. `npx pagesmith-docs preview` to serve `outDir` from disk.

## Install Consumer Skills

If your repo uses the `skills` CLI for agent skill management:

```bash
npx skills install @pagesmith/docs
```

This copies the `skills/` folder shipped inside `@pagesmith/docs` into `.agents/skills/` (or the equivalent location your agent config uses).

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
- `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`
