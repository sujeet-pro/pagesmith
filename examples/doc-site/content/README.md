---
layout: DocHome
title: Example Docs
tagline: Documentation powered by Pagesmith
description: A fully featured documentation site with search, series navigation, and custom layout overrides -- built entirely from configuration and markdown.
install: npm install @pagesmith/docs
actions:
  - text: Get Started
    link: /guide/getting-started
    theme: brand
  - text: View on GitHub
    link: https://github.com/sujeet-pro/pagesmith
    theme: alt
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
    title: Filesystem-First
    details: Your content directory structure becomes your site navigation. Drop markdown files in folders and Pagesmith does the rest.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    title: Schema-Validated
    details: Frontmatter is validated with Zod schemas at build time. Catch errors before they reach production.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    title: Built-In Search
    details: Pagefind integration provides instant client-side search with zero backend configuration.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/></svg>
    title: Layout Overrides
    details: Customize any layout by providing your own JSX components in a theme directory.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    title: Series Navigation
    details: Group related pages into ordered series with previous/next navigation for guided reading.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M5 12l4-4m-4 4l4 4"/></svg>
    title: Static Output
    details: Produces plain HTML files deployable to any static host -- GitHub Pages, Netlify, Vercel, or a file server.
---

## Welcome to Example Docs

This is a demonstration documentation site built with `@pagesmith/docs`. It showcases the default docs workflow: convention-based navigation, search, series grouping, and layout overrides.

## Explore

- **[Guide](/guide/getting-started)** -- Learn the basics of setting up and configuring a docs site.
- **[Reference](/reference/cli)** -- CLI commands, schemas, and configuration options.
- **[Blog](/blog)** -- Posts about building with Pagesmith.
