---
title: Configuration
description: Configuring your docs site
date: 2026-03-16
tags: [config]
series: Customization
seriesOrder: 2
---

## pagesmith.config.json5

All site configuration lives in a single JSON5 file:

```json5 title="pagesmith.config.json5"
{
  name: 'My Docs',
  title: 'My Documentation',
  description: 'Documentation for my project',
  origin: 'https://user.github.io',
  basePath: '/my-project',
  sidebar: { collapsible: true },
  search: { enabled: true },
  editLink: {
    repo: 'https://github.com/user/my-project',
    branch: 'main',
  },
  lastUpdated: true,
}
```

## Smart Defaults

When you run `pagesmith init`, the CLI detects your git remote and pre-populates `basePath` and `origin` for GitHub Pages deployment. For a repo at `github.com/user/my-project`, it sets:

- `basePath: '/my-project'`
- `origin: 'https://user.github.io'`

## Key Options

| Option | Default | Description |
|--------|---------|-------------|
| `basePath` | Auto-detected | URL prefix for subdirectory hosting |
| `origin` | Auto-detected | Production URL for canonical links and sitemap |
| `search.enabled` | `true` | Enable Pagefind full-text search |
| `sidebar.collapsible` | `true` | Allow sidebar sections to collapse |
| `lastUpdated` | `false` | Show git-based timestamps on pages |
| `editLink` | — | "Edit this page" link configuration |
