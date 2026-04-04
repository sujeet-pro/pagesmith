---
title: Deployment
description: Deploy your Pagesmith site to various hosting platforms
---

# Deployment

`@pagesmith/docs` builds a fully static site -- HTML, CSS, JS, and search index. The output can be hosted on any static file server. This guide covers deployment to common platforms and the configuration options that affect how your site is served.

## Build Output

Running `pagesmith build` produces a self-contained directory (default: `gh-pages/`) with the following structure:

```text title="Build output"
gh-pages/
  index.html              # Home page
  404.html                # GitHub Pages-compatible 404
  404/index.html          # Directory-based 404 fallback
  .nojekyll               # Prevents GitHub Pages from ignoring _-prefixed dirs
  sitemap.xml             # Auto-generated sitemap (when origin is set)
  robots.txt              # Auto-generated if not in publicDir
  assets/
    style.css             # Bundled theme CSS
    main.js               # Bundled runtime JS
    fonts/                # Bundled Open Sans + JetBrains Mono (woff2)
  pagefind/               # Search index (when search is enabled)
  guide/
    getting-started/
      index.html          # /guide/getting-started/
    ...
```

Every page is written as `<slug>/index.html`, so clean URLs work without server-side rewrites. The `.nojekyll` file is always generated to prevent GitHub Pages from ignoring the `_`-prefixed `pagefind/` directory.

## basePath Configuration

The `basePath` setting controls the URL prefix for your site. This is required when deploying to a subdirectory (e.g. `https://user.github.io/my-project/`).

```json5 title="pagesmith.config.json5"
{
  basePath: '/my-project',
}
```

The base path follows a priority resolution order:

1. `--base-path` CLI flag (highest priority)
2. `BASE_URL` environment variable
3. `basePath` in `pagesmith.config.json5`
4. Default: `"/"` (root)

This resolution chain allows CI/CD pipelines to override the base path without modifying the config file.

### When to set basePath

- **GitHub Pages project site** (`user.github.io/repo-name`): set `basePath: '/repo-name'`
- **GitHub Pages user site** (`user.github.io`): leave as default `"/"`
- **Custom domain**: leave as default `"/"` unless your docs live under a subdirectory
- **Netlify / Vercel / Cloudflare**: leave as default `"/"` for most setups

The `pagesmith-docs init` command auto-detects the correct `basePath` from your `package.json` repository field when running in a GitHub Pages context.

## GitHub Pages

GitHub Pages is the default deployment target. The build output includes everything needed: `.nojekyll`, `404.html`, and a `sitemap.xml`.

### Configuration

```json5 title="pagesmith.config.json5"
{
  name: 'My Project',
  origin: 'https://username.github.io',
  basePath: '/my-project',
  outDir: './gh-pages',
}
```

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml title=".github/workflows/deploy.yml"
name: Deploy docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for lastUpdated timestamps

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci
      - run: npx pagesmith build

      - uses: actions/upload-pages-artifact@v3
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
        uses: actions/deploy-pages@v4
```

The `fetch-depth: 0` is important -- without full git history, the `lastUpdated` timestamps will be missing or incorrect.

### Manual Deployment

If you prefer to deploy from a branch instead of Actions:

```bash
npx pagesmith build
cd gh-pages
git init
git add -A
git commit -m "deploy"
git push -f git@github.com:username/repo.git main:gh-pages
```

Then configure the repository to deploy from the `gh-pages` branch in **Settings > Pages**.

## Netlify

Netlify works well with Pagesmith since the output is fully static.

### Build Settings

In your Netlify dashboard or `netlify.toml`:

```toml title="netlify.toml"
[build]
  command = "npx pagesmith build --out-dir dist"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

When deploying to `https://my-project.netlify.app/` (the root), leave `basePath` as default. The `--out-dir dist` override is optional but avoids Netlify confusion with the `gh-pages/` default.

### SPA-style 404 Handling

Pagesmith already generates a `404.html` at the build root. Netlify automatically serves this for missing routes. If you want to add redirects for legacy URLs, create a `_redirects` file in your `public/` directory:

```text title="public/_redirects"
/old-path    /new-path    301
/docs/*      /guide/:splat 301
```

Files in `publicDir` (default: `public/`) are copied as-is to the build output.

## Vercel

### Project Configuration

Create `vercel.json` in your project root:

```json title="vercel.json"
{
  "buildCommand": "npx pagesmith build --out-dir dist",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": true
}
```

The `cleanUrls` and `trailingSlash` settings match the Pagesmith URL convention where each page lives at `<slug>/index.html`.

### Framework Preset

In the Vercel dashboard, set the framework preset to **Other** and configure:

- **Build Command**: `npx pagesmith build --out-dir dist`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

Since Pagesmith sites are fully static, no serverless functions or edge middleware are needed.

## Cloudflare Pages

### Dashboard Setup

In the Cloudflare Pages dashboard:

- **Build command**: `npx pagesmith build --out-dir dist`
- **Build output directory**: `dist`
- **Node.js version**: Set `NODE_VERSION` environment variable to `22`

### wrangler.toml

Alternatively, configure via `wrangler.toml`:

```toml title="wrangler.toml"
name = "my-docs"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

Cloudflare Pages automatically handles 404 routing when a `404.html` file exists at the build root.

## Custom Domain Setup

### origin Configuration

Set the `origin` field to your production URL. This affects canonical links, OpenGraph tags, and sitemap URLs:

```json5 title="pagesmith.config.json5"
{
  origin: 'https://docs.my-project.com',
  basePath: '/',
}
```

The `origin` should be the scheme + host without a trailing slash.

### CNAME for GitHub Pages

If using a custom domain with GitHub Pages, add a `CNAME` file to your `public/` directory:

```text title="public/CNAME"
docs.my-project.com
```

This file is copied to the build output automatically and tells GitHub Pages to serve on the custom domain.

### DNS Configuration

Point your domain to the hosting platform:

| Platform | Record Type | Value |
|---|---|---|
| GitHub Pages | `CNAME` | `username.github.io` |
| Netlify | `CNAME` | `your-site.netlify.app` |
| Vercel | `CNAME` | `cname.vercel-dns.com` |
| Cloudflare Pages | `CNAME` | `your-site.pages.dev` |

For apex domains (no subdomain), use `A` records or `ALIAS` records as documented by each platform.

## Environment Variables

These environment variables affect the build:

| Variable | Effect |
|---|---|
| `BASE_URL` | Overrides `basePath` in config (used by CI/CD) |
| `NODE_ENV` | Set to `production` for optimized builds (usually automatic) |

Example in a CI pipeline:

```bash
BASE_URL=/my-project npx pagesmith build
```

## Post-Deployment Checklist

After deploying, verify:

1. **Home page loads** with correct styles and fonts
2. **Navigation** links work and point to correct paths (check basePath)
3. **Search** opens with `Ctrl+K` / `Cmd+K` and returns results
4. **404 page** renders for unknown routes
5. **sitemap.xml** is accessible at `<origin><basePath>/sitemap.xml`
6. **External links** open in new tabs
7. **Code blocks** render with syntax highlighting in both light and dark mode
8. **Edit links** (if enabled) point to the correct repository and branch

## Troubleshooting Deployments

### Pages load without styles

The most common cause is a missing or incorrect `basePath`. If your site is at `https://user.github.io/repo/` but `basePath` is not set, all asset paths will resolve to the wrong location. Set `basePath: '/repo'` in your config.

### Search returns no results

Pagefind requires the `pagefind/` directory to be present in the build output. If search is enabled but the Pagefind binary fails during build, you will see a warning in the build log. Ensure `pagefind` is installed as a dependency (it is included with `@pagesmith/docs`).

### 404 page not styled on GitHub Pages

GitHub Pages serves `404.html` from the repository root. The build generates both `404/index.html` and `404.html` at the output root to cover both GitHub Pages and directory-based hosting.

### lastUpdated shows wrong dates

Git timestamps require full history. In CI, use `fetch-depth: 0` in your checkout step. Shallow clones will either show no date or the clone date.
