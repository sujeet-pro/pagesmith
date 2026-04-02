---
title: About This Example
description: A Pagesmith + Handlebars integration example
---

# Pagesmith + Handlebars

This example demonstrates how to build a static site using **@pagesmith/core** with **Handlebars** templates — no framework, no bundler for HTML, just a Node.js build script.

It showcases:

- Content collections with schema validation via Zod
- The `createContentLayer` API for loading and querying content
- Handlebars templates with partials and inline blocks for layout composition
- Custom Handlebars helpers for date formatting and equality checks
- Inline CSS from @pagesmith/core's pre-built content styles
- A simple Node.js build script that generates static HTML files

Like the EJS example, this is a zero-framework integration — ideal when you prefer Handlebars' logic-less template philosophy over embedded JavaScript.
