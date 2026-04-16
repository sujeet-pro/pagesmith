---
title: Installation
description: Setting up Pagesmith as a headless content layer inside a Next.js App Router project
date: 2026-03-20
tags:
  - setup
---

# Installation

This guide walks through setting up a Next.js App Router project that uses **Pagesmith** as a headless content layer. Next.js owns routing, layout, metadata, and static export; Pagesmith owns markdown processing, schema validation, and the content pipeline.

## Dependencies

The project requires two groups of packages:

**Pagesmith package** -- `@pagesmith/site` provides the app-facing content layer API (`createContentLayer`, `defineCollection`, `defineConfig`) plus the shared CSS and runtime for presenting markdown:

```json title="package.json (excerpt)"
{
  "dependencies": {
    "@pagesmith/site": "*",
    "next": "^16.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

## Why both packages?

This example keeps Next.js in charge of routing, layout, metadata, and export while using `@pagesmith/site` as the single app-facing Pagesmith package. The example does not use Pagesmith's Vite plugins, JSX runtime, or SSG helpers.

## No Vite Required

Unlike the framework Vite examples (React, Solid, Svelte), this project uses Next.js's own build system. There is no `vite.config.ts`, no `pagesmithContent` virtual modules, and no `pagesmithSsg` plugin. Content is loaded at build time via `createContentLayer()` from `@pagesmith/site` directly.
