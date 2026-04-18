#!/usr/bin/env node
/**
 * Static accessibility scan of every generated HTML page in `gh-pages/`.
 *
 * Why static + runtime?
 *   - The Playwright `a11y.e2e.ts` suite runs axe-core inside a real Chromium
 *     instance and gives us the canonical WCAG 2.2 AA gate (color contrast,
 *     focus order, computed style, viewport-aware checks). It is thorough but
 *     it samples a handful of representative pages.
 *   - This script runs axe-core inside `jsdom` against EVERY generated HTML
 *     file in `gh-pages/`. It cannot evaluate computed styles or layout, so
 *     it skips color-contrast and other layout-dependent rules — but it
 *     catches structural regressions on every page (missing `lang`,
 *     unlabeled controls, missing `alt`, duplicate IDs, invalid ARIA
 *     attribute names/values, etc.) that the layered runtime test would
 *     miss for the un-sampled pages.
 *
 * Exit code:
 *   - `0` when every page is clean.
 *   - `1` when any violation is found. Each violation is printed with the
 *     rule id, impact, helpUrl, and a snippet of the offending HTML so CI
 *     logs are actionable.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import axe from "axe-core";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const ghPagesDir = join(repoRoot, "gh-pages");

if (!existsSync(ghPagesDir)) {
  console.error(
    `gh-pages/ not found at ${ghPagesDir}.\n` +
      `Run \`npm run build:docs && npm run build:examples\` first, or \`npm run validate\`.`,
  );
  process.exit(1);
}

const SKIP_DIRS = new Set(["pagefind", "_next", "node_modules", ".next", "out"]);

function* walkHtmlFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtmlFiles(full);
    else if (entry.isFile() && entry.name.endsWith(".html") && statSync(full).size > 0) yield full;
  }
}

// Rules that depend on layout/computed-style/visual rendering. jsdom can't
// evaluate them reliably, so we skip them here — the Playwright e2e suite
// covers them in a real Chromium instance.
const SKIP_RULES_IN_JSDOM = new Set([
  "color-contrast",
  "color-contrast-enhanced",
  "target-size",
  "scrollable-region-focusable",
  "focus-order-semantics",
  "meta-viewport",
  "meta-viewport-large",
]);

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface Violation {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  nodes: Array<{ html: string; target: string[] }>;
}

interface PageResult {
  file: string;
  violations: Violation[];
  error?: string;
}

// Suppress noisy "Not implemented: HTMLCanvasElement..." warnings that
// jsdom emits for every page that contains an SVG axe-core happens to probe.
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", () => {});

async function scan(file: string): Promise<PageResult> {
  const html = readFileSync(file, "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", virtualConsole });
  try {
    // axe-core 4.x captures `window`/`document` at module load time, so we
    // can't rewire them per-file via `globalThis`. Passing the document's
    // `documentElement` lets axe deduce the document context per call,
    // which works correctly across many jsdom instances.
    const result = await axe.run(dom.window.document.documentElement, {
      runOnly: { type: "tag", values: WCAG_TAGS },
      resultTypes: ["violations"],
    });
    const violations = result.violations
      .filter((v) => !SKIP_RULES_IN_JSDOM.has(v.id))
      .map((v) => ({
        id: v.id,
        impact: v.impact ?? null,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({ html: n.html, target: n.target as string[] })),
      }));
    return { file, violations };
  } catch (error) {
    return {
      file,
      violations: [],
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    dom.window.close();
  }
}

const files: string[] = [...walkHtmlFiles(ghPagesDir)];
console.info(`Scanning ${files.length} HTML page(s) for static a11y issues...`);

const results: PageResult[] = [];
for (const file of files) {
  results.push(await scan(file));
}

let errors = 0;
for (const r of results) {
  if (r.error) {
    errors += 1;
    console.error(`  ✗ ${relative(repoRoot, r.file)} — failed to scan: ${r.error}`);
    continue;
  }
  if (r.violations.length === 0) continue;
  errors += r.violations.length;
  console.error(`\n  ✗ ${relative(repoRoot, r.file)}`);
  for (const v of r.violations) {
    const impact = v.impact ?? "unknown";
    console.error(`    • ${v.id} [${impact}] — ${v.help}`);
    console.error(`      ${v.helpUrl}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.error(`      → ${n.target.join(" ")}\n        ${n.html.slice(0, 240)}`);
    }
    if (v.nodes.length > 3) console.error(`      … +${v.nodes.length - 3} more`);
  }
}

if (errors === 0) {
  console.info(
    `\nStatic a11y scan: ${files.length} page(s), 0 violation(s) — PASSED ` +
      `(WCAG 2.2 AA, jsdom; layout/contrast checks deferred to e2e a11y suite)`,
  );
  process.exit(0);
}

console.error(`\nStatic a11y scan: ${errors} violation(s) across ${files.length} page(s) — FAILED`);
process.exit(1);
