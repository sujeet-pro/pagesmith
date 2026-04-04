---
title: About This Example
description: A @pagesmith/docs example with layout overrides
---

# Example Docs

This example demonstrates how to build a documentation site using `@pagesmith/docs` — a zero-config docs generator built on `@pagesmith/core`.

It showcases:

- Convention-based content organization (top-level folders define navigation sections)
- Automatic sidebar generation from folder structure
- Built-in Pagefind search integration
- Custom layout overrides via `theme.layouts` in `pagesmith.config.json5`
- Edit link and last-updated timestamp support
- Collapsible sidebar sections

The doc-site example requires no build scripts or framework code — just a `pagesmith.config.json5` and a `content/` directory. Layout overrides use JSX files with `@pagesmith/core` runtime.
