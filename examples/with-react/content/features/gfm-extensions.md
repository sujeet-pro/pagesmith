---
title: "GFM Extensions"
description: "Tables, task lists, strikethrough, autolinks, and footnotes via GitHub Flavored Markdown."
date: 2026-03-14
tags: [markdown, gfm]
---

# GFM Extensions

Pagesmith includes full support for [GitHub Flavored Markdown](https://github.github.com/gfm/) through `remark-gfm`. This adds tables, task lists, strikethrough, autolinks, and footnotes on top of standard Markdown.

## Tables

Tables use pipes and hyphens. Column alignment is controlled by colons in the separator row.

### Basic table

| Feature | Status | Notes |
|---------|--------|-------|
| Syntax highlighting | Supported | Via Expressive Code |
| Math rendering | Supported | Via MathJax |
| GitHub alerts | Supported | Five alert types |
| Mermaid diagrams | Planned | Not yet available |

### Column alignment

Use `:` in the separator row to control alignment: `:---` for left, `:---:` for center, `---:` for right.

| Package | Version | Downloads |
|:--------|:-------:|----------:|
| @pagesmith/core | 2.1.0 | 45,200 |
| @pagesmith/docs | 2.1.0 | 31,800 |
| @pagesmith/cli | 2.0.3 | 12,500 |

### Table with inline formatting

Tables support inline formatting within cells.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/:id` | Get user by **ID** |
| `POST` | `/api/users` | Create a *new* user |
| `DELETE` | `/api/users/:id` | ~~Remove~~ Archive user |

## Task Lists

Task lists render as interactive checkboxes in the output. Use `- [x]` for completed items and `- [ ]` for pending ones.

### Project checklist

- [x] Set up project structure
- [x] Configure Vite and Pagesmith plugins
- [x] Define content collections with schemas
- [ ] Write content for all sections
- [ ] Add search with Pagefind
- [ ] Deploy to production

### Nested task list

Task lists can be nested to represent subtasks.

- [x] Phase 1: Foundation
  - [x] Initialize repository
  - [x] Set up CI/CD pipeline
  - [x] Configure linting and formatting
- [ ] Phase 2: Content
  - [x] Create content directory structure
  - [ ] Write getting started guide
  - [ ] Write API reference
- [ ] Phase 3: Launch
  - [ ] Performance audit
  - [ ] Accessibility review
  - [ ] Publish to npm

## Strikethrough

Wrap text in double tildes to render it with a strikethrough.

This feature is ~~experimental~~ stable as of v2.0.

We originally used ~~webpack~~ Vite for the build system.

The API endpoint is `/api/v2/users` (~~`/api/v1/users`~~ has been deprecated).

## Autolinks

Bare URLs and email addresses are automatically converted into clickable links without needing explicit Markdown link syntax.

Visit https://pagesmith.dev for the full documentation.

Report issues at https://github.com/example/pagesmith/issues.

Contact the team at team@example.com for support.

Standard Markdown links still work as expected: [Pagesmith documentation](https://pagesmith.dev).

## Footnotes

Footnotes let you add supplementary information without cluttering the main text. The footnote content is collected at the bottom of the page.

Pagesmith processes Markdown through a unified pipeline[^1] that supports over a dozen plugins. The syntax highlighting is handled by Expressive Code[^2], which provides dual-theme support and a range of annotation features.

The math rendering uses MathJax[^mathjax] for both inline and display equations, converting LaTeX syntax to accessible SVG output.

Tables, task lists, and other extensions come from GitHub Flavored Markdown[^gfm], which is the most widely adopted Markdown extension set.

[^1]: The unified ecosystem provides a pipeline for processing content with parsers, transformers, and compilers.

[^2]: Expressive Code is a framework-agnostic engine for presenting source code on the web, featuring syntax highlighting, editor-style annotations, and automatic dark mode.

[^mathjax]: MathJax is a JavaScript display engine for mathematics that works in all browsers. It supports LaTeX, MathML, and AsciiMath notation.

[^gfm]: GitHub Flavored Markdown Spec: https://github.github.com/gfm/
