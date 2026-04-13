---
title: Configuration
description: Configuring your docs site
publishedDate: 2026-03-16
tags: [config]
series: Customization
seriesOrder: 2
---

## pagesmith.config.json5

All site configuration lives in a single JSON5 file:

```json5 title="pagesmith.config.json5"
{
  $schema: '../../node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
  name: 'My Docs',
  title: 'My Documentation',
  description: 'Documentation for my project',
  origin: 'https://user.github.io',
  basePath: '/my-project',
  maintainer: {
    name: 'Sujeet Jaiswal',
    link: 'https://sujeet.pro',
  },
  copyright: {
    projectName: 'My Documentation',
    startYear: 2024,
    endYear: null,
  },
  footerLinks: [
    {
      header: 'Docs',
      links: [
        { label: 'Guide', path: '/guide' },
        { label: 'Reference', path: '/reference' },
      ],
    },
    {
      header: 'Project',
      links: [{ label: 'GitHub', path: 'https://github.com/user/my-project' }],
    },
  ],
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

When you run `pagesmith-docs init`, the CLI detects your git remote and pre-populates `basePath` and `origin` for GitHub Pages deployment. For a repo at `github.com/user/my-project`, it sets:

- `basePath: '/my-project'`
- `origin: 'https://user.github.io'`

It is also safe to rerun `pagesmith-docs init` later. The CLI updates `pagesmith.config.json5` to add missing scaffold fields and refresh the `$schema` path instead of skipping the config file once it exists.

## Key Options

| Option | Default | Description |
|--------|---------|-------------|
| `basePath` | Auto-detected | URL prefix for subdirectory hosting |
| `origin` | Auto-detected | Production URL for canonical links and sitemap |
| `maintainer` | `package.json author` | Maintainer credit used by the default footer sign-off |
| `copyright` | first git commit year + dynamic end year | Footer legal line config |
| `footerLinks` | top-level nav links | Footer links as a flat row or grouped columns |
| `search.enabled` | `true` | Enable Pagefind full-text search |
| `sidebar.collapsible` | `true` | Allow sidebar sections to collapse |
| `lastUpdated` | `true` | Show git-based timestamps on pages |
| `editLink` | Auto-detected | "Edit this page" link configuration (`false` disables it) |
| `theme.layouts` | package defaults | Optional `{ home, page, notFound }` JSX overrides (this example sets `home` + `page`) |

CLI commands such as `pagesmith-docs build`, `pagesmith-docs preview`, and `pagesmith-docs mcp --stdio` read the same config file you point at with `--config` (see [Installation](./installation)).
