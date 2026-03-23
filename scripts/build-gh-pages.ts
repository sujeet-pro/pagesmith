#!/usr/bin/env node

/**
 * Build all examples + docs into gh-pages/ for deployment.
 *
 * Steps:
 * 1. Clean gh-pages/
 * 2. Build packages (core, content)
 * 3. Build docs -> gh-pages/docs/
 * 4. Build each example -> gh-pages/examples/<name>/
 * 5. Generate gh-pages/index.html (landing page)
 * 6. Write .nojekyll file
 */

import { execSync } from 'child_process'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const OUT = join(ROOT, 'gh-pages')

// Step 1: Clean
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

function run(cmd: string, env: Record<string, string> = {}, cwd = ROOT): void {
  console.log(`\n> ${cmd}`)
  execSync(cmd, {
    stdio: 'inherit',
    cwd,
    env: {
      ...process.env,
      ...env,
      // Ensure workspace .bin is on PATH for tsup, etc.
      PATH: `${join(ROOT, 'node_modules/.bin')}:${process.env.PATH}`,
    },
  })
}

// Step 2: Build packages
run('vp pack', {}, join(ROOT, 'packages/core'))
run('vp pack', {}, join(ROOT, 'packages/content'))

// Step 3: Build docs
run('vp exec vitepress build docs', { BASE_URL: '/pagesmith/docs/' })
cpSync(join(ROOT, 'docs/.vitepress/dist'), join(OUT, 'docs'), { recursive: true })

// Step 4: Build each example
const examples = [
  { name: 'vanilla-ejs', dir: 'with-vanilla-ejs' },
  { name: 'vanilla-hbs', dir: 'with-vanilla-hbs' },
  { name: 'react', dir: 'with-react' },
  { name: 'solid', dir: 'with-solid' },
  { name: 'svelte', dir: 'with-svelte' },
  { name: 'ssg', dir: 'with-ssg' },
]

for (const ex of examples) {
  try {
    run(
      'vp run build',
      { BASE_URL: `/pagesmith/examples/${ex.name}/` },
      join(ROOT, `examples/${ex.dir}`),
    )
    cpSync(join(ROOT, `examples/${ex.dir}/dist`), join(OUT, `examples/${ex.name}`), {
      recursive: true,
    })
  } catch (err: unknown) {
    console.error(`Warning: Failed to build ${ex.name}: ${(err as Error).message}`)
  }
}

// Step 5: Generate landing page
writeFileSync(join(OUT, 'index.html'), generateLandingPage())

// Step 6: .nojekyll for GitHub Pages
writeFileSync(join(OUT, '.nojekyll'), '')

console.log(`\nGitHub Pages output ready at ${OUT}`)

function generateLandingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagesmith — Content CMS Library</title>
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
    a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover { text-decoration: underline; }
    .description { color: #666; font-size: 0.9rem; }
    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>@pagesmith/content</h1>
  <p class="subtitle">A framework-agnostic content CMS library for markdown and structured data.</p>

  <h2>Documentation</h2>
  <ul>
    <li><a href="/pagesmith/docs/">Full Documentation</a> <span class="description">— Getting started, configuration, API reference</span></li>
  </ul>

  <h2>Example Applications</h2>
  <ul>
    <li><a href="/pagesmith/examples/vanilla-ejs/">Vanilla + EJS</a> <span class="description">— Node.js build script with EJS templates</span></li>
    <li><a href="/pagesmith/examples/vanilla-hbs/">Vanilla + Handlebars</a> <span class="description">— Node.js build script with Handlebars templates</span></li>
    <li><a href="/pagesmith/examples/react/">React + Vite</a> <span class="description">— React SPA with content Vite plugin</span></li>
    <li><a href="/pagesmith/examples/solid/">SolidJS + Vite</a> <span class="description">— SolidJS SPA with content Vite plugin</span></li>
    <li><a href="/pagesmith/examples/svelte/">Svelte + Vite</a> <span class="description">— Svelte SPA with content Vite plugin</span></li>
    <li><a href="/pagesmith/examples/ssg/">Minimal SSG</a> <span class="description">— Pure string templates, no framework, no theme system</span></li>
  </ul>

  <h2>Install</h2>
  <p><code>npm install @pagesmith/content</code></p>
</body>
</html>`
}
