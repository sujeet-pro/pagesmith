---
title: About This Example
description: A Pagesmith + EJS integration example
---

# Pagesmith + EJS

This example demonstrates how to build a static site using **@pagesmith/core** with **EJS** (Embedded JavaScript) templates — no framework, no bundler for HTML, just a Node.js build script.

It showcases:

- Content collections with schema validation via Zod
- The `createContentLayer` API for loading and querying content
- EJS templates with layout wrapping for consistent page structure
- Inline CSS from @pagesmith/core's pre-built content styles
- A simple Node.js build script that generates static HTML files

This is the simplest integration pattern — ideal when you want full control over the build process without a framework or client-side JavaScript.
