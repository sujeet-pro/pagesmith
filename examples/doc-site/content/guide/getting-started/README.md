---
title: "Getting Started"
description: "Install Pagesmith and create your first documentation site"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - getting-started
  - guide
---

# Getting Started

This guide walks you through setting up a documentation site with `@pagesmith/docs`.

## Prerequisites

- Node.js 20 or later
- A package manager (npm, pnpm, or yarn)

## Installation

Install the docs package:

```bash
npm install @pagesmith/docs
```

## Project Structure

Create the following directory structure:

```text
my-docs/
  content/
    README.md          # Home page
    guide/
      README.md        # Guide section index
      getting-started/
        README.md      # This page
  pagesmith.config.json5
  package.json
```

## Configuration

Create a `pagesmith.config.json5` at the project root:

```json5
{
  name: 'My Docs',
  title: 'My Documentation',
  description: 'Documentation for my project',
  contentDir: './content',
  outDir: './dist',
}
```

## Running the Dev Server

Start the development server with hot reload:

```bash
npx pagesmith dev
```

Your site is now running at `http://localhost:3000`.

## Building for Production

Build the static site:

```bash
npx pagesmith build
```

The output is written to the configured `outDir`.

## Next Steps

- Learn about [Configuration](/guide/configuration) options
- Explore [Layouts](/guide/layouts) for customizing page structure
- Browse the [API Reference](/api/content-layer) for the content layer
