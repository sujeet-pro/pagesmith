---
name: deploy-gh-pages
description: Deploy a Pagesmith docs site to GitHub Pages. Use when publishing docs from a GitHub repository with Pages enabled.
---

# Deploy To GitHub Pages

## Config

Set `basePath` and `origin` in `pagesmith.config.json5`:

```json5
{
  origin: 'https://<user>.github.io',
  basePath: '/<repo>',
  outDir: './gh-pages',
}
```

If you serve at a custom domain, set `origin` to the domain and `basePath: '/'`.

## Build

```bash
npx pagesmith-docs build
```

This writes to `outDir` (recommended: `./gh-pages`). Pagesmith already creates:

- `.nojekyll` so `_*` folders aren't filtered by Jekyll
- root `404.html` so missing pages go through the Pagesmith router
- slashless canonical URLs with matching HTML files, so links work both on Pages and in a local preview

## Deploy With Actions

Minimal workflow:

```yaml
name: Deploy Docs
on:
  push: { branches: [main] }
  workflow_dispatch: {}
permissions:
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npx pagesmith-docs build
      - uses: actions/upload-pages-artifact@v3
        with: { path: gh-pages }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Preview Before Deploying

```bash
npx pagesmith-docs preview
```

Pagesmith serves directly from `outDir` so rebuilds apply without restarting the server.

## Rules

- Always set `basePath` for repo-hosted Pages; leave it blank only for custom domains.
- Keep `outDir` inside the repo (gitignored) so the deploy artifact upload has a stable path.
- Assets passed through via `pagesmith.config.json5` `assets` (e.g. `llms.txt`, schemas, prompts) ship untouched — use this for files agents should fetch directly.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md`
