---
title: "Getting Started"
description: "Set up your first Pagesmith site in minutes"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - basics
  - setup
---

# Getting Started with Pagesmith

## Installation

```bash
npm create @pagesmith my-site
cd my-site
npm install
```

## Project Structure

A typical Pagesmith site looks like this:

```text
my-site/
  content/
    README.md          # Home page
    guide/
      README.md        # Guide listing
      getting-started/
        README.md      # This page
    site.json5         # Global config
  pagesmith.config.json5
  package.json
```

## Creating Content

Every markdown file becomes a page. Use folders to organize content into sections. Each folder can have a `README.md` that serves as the section landing page.

### Frontmatter

Add YAML frontmatter to configure each page:

```yaml
---
title: "My Page Title"
description: "A brief description"
publishedDate: 2026-03-01T00:00:00.000Z
tags:
  - example
---
```

## Building Your Site

```bash
# Development server with hot reload
pagesmith dev

# Production build
pagesmith build

# Preview the build
pagesmith preview
```
