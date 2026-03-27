#!/usr/bin/env node

/**
 * Generate the gh-pages landing page and .nojekyll marker.
 *
 * Run after all individual build commands have completed.
 */

import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const OUT = join(process.cwd(), 'gh-pages')

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, '.nojekyll'), '')
writeFileSync(
  join(OUT, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagesmith</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; font-size: 1.2rem; margin-bottom: 2rem; }
    h2 { margin-top: 2rem; margin-bottom: 1rem; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 0.75rem; }
    a { color: #0066cc; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .desc { color: #666; font-size: 0.9rem; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Pagesmith</h1>
  <p class="subtitle">File-based CMS and documentation tool for static sites.</p>

  <h2>Documentation</h2>
  <ul>
    <li><a href="docs/">Full Documentation</a> <span class="desc">Getting started, configuration, API reference</span></li>
  </ul>

  <h2>Examples</h2>
  <ul>
    <li><a href="examples/blog-site/">Blog Site</a> <span class="desc">Custom layouts with @pagesmith/core</span></li>
    <li><a href="examples/doc-site/">Doc Site</a> <span class="desc">Convention-based docs with @pagesmith/docs</span></li>
    <li><a href="examples/vanilla-ejs/">Vanilla + EJS</a> <span class="desc">Node.js build with EJS templates</span></li>
    <li><a href="examples/vanilla-hbs/">Vanilla + Handlebars</a> <span class="desc">Node.js build with Handlebars templates</span></li>
    <li><a href="examples/react/">React + Vite</a> <span class="desc">React SPA with content plugin</span></li>
    <li><a href="examples/solid/">SolidJS + Vite</a> <span class="desc">SolidJS SPA with content plugin</span></li>
    <li><a href="examples/svelte/">Svelte</a> <span class="desc">Svelte SPA with content plugin</span></li>
  </ul>

  <h2>Packages</h2>
  <ul>
    <li><code>@pagesmith/core</code> <span class="desc">Content layer, markdown pipeline, dev server</span></li>
    <li><code>@pagesmith/docs</code> <span class="desc">Convention-based documentation</span></li>
  </ul>
</body>
</html>`,
)

console.log(`Landing page written to ${OUT}`)
