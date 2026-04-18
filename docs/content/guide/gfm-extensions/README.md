---
title: GFM Extensions
description: Tables, task lists, strikethrough, autolinks, and footnotes via GitHub Flavored Markdown.
---

# GFM Extensions

Pagesmith includes full support for [GitHub Flavored Markdown](https://github.github.com/gfm/) through `remark-gfm`. This adds tables, task lists, strikethrough, autolinks, and footnotes on top of standard Markdown.

## Tables

Tables use pipes and hyphens. Column alignment is controlled by colons in the separator row.

### Basic table

| Feature             | Status    | Notes                               |
| ------------------- | --------- | ----------------------------------- |
| Syntax highlighting | Supported | Via the built-in Pagesmith renderer |
| Math rendering      | Supported | Via MathJax                         |
| GitHub alerts       | Supported | Five alert types                    |
| Footnotes           | Supported | Added by `remark-gfm`               |

### Column alignment

Use `:` in the separator row to control alignment: `:---` for left, `:---:` for center, `---:` for right.

| Package             | GFM | Code blocks |
| :------------------ | :-: | ----------: |
| `@pagesmith/core`   | yes |    advanced |
| `@pagesmith/docs`   | yes |    advanced |
| `examples/doc-site` | yes |   demo-rich |

### Table with inline formatting

Tables support inline formatting within cells.

| Method   | Endpoint         | Description             |
| -------- | ---------------- | ----------------------- |
| `GET`    | `/api/users`     | List all users          |
| `GET`    | `/api/users/:id` | Get user by **ID**      |
| `POST`   | `/api/users`     | Create a _new_ user     |
| `DELETE` | `/api/users/:id` | ~~Remove~~ Archive user |

## Task Lists

Task lists render as checkboxes in the output. Use `- [x]` for completed items and `- [ ]` for pending ones.

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

This feature is ~~experimental~~ stable.

We originally used ~~manual copy/paste~~ generated navigation metadata for large docs sections.

The old route was ~~`/guide/old-setup`~~ and now redirects to `/guide/getting-started`.

## Autolinks

Bare URLs and email addresses are automatically converted into clickable links without needing explicit Markdown link syntax.

Visit https://github.com/sujeet-pro/pagesmith for the source.

Browse releases at https://www.npmjs.com/package/@pagesmith/docs.

Contact the team at team@example.com for support.

Standard Markdown links still work as expected: [Pagesmith Getting Started](../getting-started/README.md).

## Footnotes

Footnotes let you add supplementary information without cluttering the main text. The footnote content is collected at the bottom of the page.

Pagesmith processes Markdown through a unified pipeline[^1] that supports a rich set of built-in plugins. Syntax highlighting is handled by the built-in Pagesmith renderer on top of Shiki[^2], which adds titles, tabs, diff marks, copy, and collapse controls.

Math rendering uses MathJax[^mathjax] for both inline and display equations, converting LaTeX syntax to accessible SVG output.

Tables, task lists, and other extensions come from GitHub Flavored Markdown[^gfm], which is the most widely adopted Markdown extension set.

[^1]: The unified ecosystem provides a pipeline for parsing, transforming, and compiling content.

[^2]: The built-in Pagesmith renderer uses Shiki for syntax highlighting and adds Pagesmith-specific code block chrome such as titles, tabs, copy, collapse, and diff markers.

[^mathjax]: MathJax is a browser-based math rendering engine that supports LaTeX notation in both inline and block form.

[^gfm]: GitHub Flavored Markdown spec: https://github.github.com/gfm/
