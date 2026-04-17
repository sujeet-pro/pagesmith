---
name: pagesmith-docs-deploy-gh-pages
description: Deploy a @pagesmith/docs site to GitHub Pages with a correct basePath, 404 fallback, and a working GitHub Actions workflow. Use when the user wants to publish their Pagesmith docs on GitHub Pages, set up a gh-pages workflow, fix broken asset URLs after deploy, or migrate a repo-hosted docs site to a custom domain.
---

# Deploy Pagesmith Docs To GitHub Pages

## Read the locally installed reference first

Before editing `pagesmith.config.json5`, the workflow, or running CLI commands, open `node_modules/@pagesmith/docs/REFERENCE.md` and `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json` in the consumer's project. They are version-matched to the installed package and authoritative for `origin`, `basePath`, `outDir`, `assets.*`, and the `pagesmith-docs` CLI surface. If they disagree with this skill or general training data, follow the local files.

Always invoke the CLI through `npx pagesmith-docs <command>` (or via `package.json` scripts and the workflow's `npm ci` + `npx pagesmith-docs build`) so it resolves to the project's `node_modules/.bin`. Do not assume a globally installed `pagesmith-docs` binary — it may be a different version than the one published to the consumer's lockfile.

## Config

Set the right origin and basePath in `pagesmith.config.json5`:

| Hosting | `origin` | `basePath` |
| --- | --- | --- |
| `https://<owner>.github.io/<repo>` (repo page) | `https://<owner>.github.io` | `/<repo>` |
| `https://<owner>.github.io` (user/org page) | `https://<owner>.github.io` | `/` |
| `https://docs.example.com` (custom domain root) | `https://docs.example.com` | `/` |
| `https://example.com/docs` (custom domain subpath) | `https://example.com` | `/docs` |

```json5
// pagesmith.config.json5
{
  origin: 'https://acme.github.io',
  basePath: '/my-docs',
  outDir: './gh-pages',
}
```

`outDir: './gh-pages'` is the convention — it is already git-ignored in the default Pagesmith init.

## Build output

```bash
npx pagesmith-docs build
```

Writes into `outDir` and automatically creates:

- `.nojekyll` — stops GitHub Pages from dropping folders that start with `_`.
- `404.html` — ensures unknown paths still render through the Pagesmith router.
- Slashless canonical URLs with matching HTML files so links work both on Pages and local preview.
- `sitemap.xml` and `robots.txt` using `origin` + `basePath`.

Do not hand-edit any of these.

## GitHub Actions workflow

Drop this at `.github/workflows/gh-pages.yml`:

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
  workflow_dispatch: {}

permissions:
  contents: read
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
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx pagesmith-docs build
      - uses: actions/upload-pages-artifact@v5
        with:
          path: gh-pages

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

Requirements on the repo:

- Settings → Pages → Source = "GitHub Actions".
- The default branch is `main` (or adjust the `branches:` field).

## Custom domain

1. Set `origin` to the custom domain and `basePath: '/'`.
2. Add a `CNAME` file containing the bare domain (`docs.example.com`) inside `public/` or directly in `outDir`:
   - If committed to the repo, keep it under `public/CNAME`.
   - If you want Pagesmith to copy it into `outDir` during build, declare it in `assets` in `pagesmith.config.json5`.

```json5
{
  assets: {
    passthrough: ['public/CNAME'],
  },
}
```

## Preview before deploying

```bash
npx pagesmith-docs preview
```

Preview serves directly from `outDir` so rebuilds apply without restarting. If links break in preview, they will break in production — fix before pushing.

## Static asset passthrough

Files the docs site should ship untouched (`llms.txt`, `robots.txt`, schema JSON, prompt files, research PDFs) go through passthrough assets:

```json5
{
  assets: {
    passthrough: [
      'llms.txt',
      'llms-full.txt',
      'public/prompts/**/*.md',
      'public/schemas/**/*.json',
    ],
  },
}
```

Path globs are relative to the config file. Output paths mirror the source tree inside `outDir`.

## Verify after deploy

1. Open `https://<origin>/<basePath>/` — home loads.
2. Click a sidebar entry — no broken CSS/JS (check the Network tab for 404s).
3. Visit a non-existent URL — `404.html` responds with the Pagesmith shell, not GitHub's default 404.
4. View source — `<link rel="canonical">` matches the expected production URL.
5. `curl https://<origin>/<basePath>/sitemap.xml` returns XML with the right hostnames.

## Gotchas

- `basePath` must start with `/` and not end with `/` (unless it is exactly `/`). Everything else breaks asset URLs.
- If you change `basePath`, invalidate the Pages cache: the easiest way is to re-trigger the deploy workflow.
- Custom domains require both `origin` update **and** a `CNAME` file in the deploy artifact.
- Do not run `pagefind` or write anything else into `outDir/` after the build — the deploy artifact ships exactly what's there.
- `gh-pages/` is intentionally in `.gitignore`. Do not commit build output.
- On first deploy, Pages may take a minute to propagate. Verify the Actions run succeeded before suspecting Pagesmith.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/setup-docs.md`
- `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`
