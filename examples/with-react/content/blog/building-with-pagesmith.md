---
title: "Building This Site with Pagesmith"
description: "A walkthrough of how this example site was built using Pagesmith's content layer and Vite plugin."
date: 2026-03-20
tags: [pagesmith, tutorial]
---

# Building This Site with Pagesmith

This example site demonstrates how Pagesmith's content layer integrates with a JavaScript framework. Here's how it all fits together.

## The content layer

At the core is `@pagesmith/core` — a filesystem-first CMS that treats your content directory as the source of truth. You define collections with Zod schemas, and Pagesmith handles discovery, loading, validation, and rendering.

## The Vite plugin

The Pagesmith Vite integration exposes collections as virtual modules and plugs the site into the SSG pipeline. During development, editing a markdown file triggers HMR. At build time, the same content is rendered into static HTML.

## Static output

The build pre-renders every route to an HTML file, copies content assets, and runs Pagefind for full-text search indexing. The result is a fast, fully static site with no server runtime.
