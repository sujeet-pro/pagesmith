#!/usr/bin/env -S node --strip-types --no-warnings

/**
 * Pagesmith repo validation orchestrator.
 *
 * Runs both content validation (markdown source) and build-output validation
 * (gh-pages) against the in-repo docs site using the workspace
 * `@pagesmith/docs` package. Layers on a few repo-specific checks that
 * matter for this monorepo:
 *
 *   - The published-package guidance files referenced in
 *     `pagesmith.config.json5#assets./prompts/` must each exist on disk so
 *     `/prompts/<name>.md` URLs really resolve at runtime.
 *
 * Usage:
 *   npm run validate:pagesmith              full check
 *   npm run validate:pagesmith -- --content content only
 *   npm run validate:pagesmith -- --build   build output only
 *   npm run validate:pagesmith -- --full    enable opt-in strict checks
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join, relative, resolve } from "path";
import { validateDocs } from "@pagesmith/docs";

const repoRoot = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

const slice = args.find((arg) => arg === "--content" || arg === "--build");
const skipContent = slice === "--build";
const skipBuild = slice === "--content";
const fullPreset = args.includes("--full");

const result = await validateDocs({
  configPath: resolve(repoRoot, "pagesmith.config.json5"),
  skipContent,
  skipBuild,
  internalLinksMustBeMarkdown: fullPreset,
  requireBothTrailingSlashForms: fullPreset,
  requireRasterModernFormats: fullPreset,
  // The repo docs site relies on `<picture>` themed diagrams, so leave
  // theme-variant + alt-text + html-img + variant-pair checks at their
  // strict defaults.
});

let totalErrors = result.errors;
let totalWarnings = result.warnings;

// ── repo-specific cross-reference: assets passthrough must exist ───────
if (!skipContent) {
  console.info(`\n[repo-cross-references]`);
  const projectErrors: string[] = [];
  for (const [prefix, sources] of result.config.assets.entries()) {
    for (const source of sources) {
      if (!existsSync(source)) {
        projectErrors.push(
          `pagesmith.config.json5 assets[${JSON.stringify(prefix)}] references missing source: ${source}`,
        );
      }
    }
  }
  if (projectErrors.length === 0) {
    console.info(`  every passthrough asset source exists on disk.`);
  } else {
    for (const message of projectErrors) console.error(`  \u2717 ${message}`);
  }
  totalErrors += projectErrors.length;
}

// ── repo-specific cross-reference: every bundled asset URL must be linked
//    from at least one content page, so users can actually discover them. ─
if (!skipContent) {
  console.info(`\n[bundled-asset-references]`);
  const basePath = result.config.basePath.replace(/\/$/, "");
  const contentDir = result.config.contentDir;
  // Aggregate every markdown source's text so we can run a single pass.
  const sources: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (entry.endsWith(".md") || entry.endsWith(".mdx"))
        sources.push(readFileSync(full, "utf8"));
    }
  }
  walk(contentDir);
  const haystack = sources.join("\n");

  const missing: string[] = [];
  for (const [prefix, paths] of result.config.assets.entries()) {
    const cleanPrefix = prefix === "/" ? "" : prefix.replace(/\/$/, "");
    const publicUrls: string[] = [];
    for (const path of paths) {
      try {
        const stat = statSync(path);
        if (stat.isDirectory()) {
          // Advertise the directory as a whole via its basename URL.
          publicUrls.push(`${cleanPrefix || ""}/${basename(path)}`);
        } else {
          publicUrls.push(`${cleanPrefix || ""}/${basename(path)}`);
        }
      } catch {
        // Missing-source errors reported by the previous block already.
      }
    }
    for (const url of publicUrls) {
      // Accept either the bare `/prefix/file` form or the `basePath/prefix/file`
      // form (what authors actually write in references to the hosted site).
      const bare = url;
      const withBase = `${basePath}${url}`;
      if (!haystack.includes(bare) && !haystack.includes(withBase)) {
        missing.push(
          `assets[${JSON.stringify(prefix)}]: ${url} is shipped but never referenced from ${relative(repoRoot, contentDir)}/**`,
        );
      }
    }
  }
  if (missing.length === 0) {
    console.info(`  every bundled asset URL is referenced from at least one docs page.`);
  } else {
    for (const message of missing) console.error(`  \u2717 ${message}`);
  }
  totalErrors += missing.length;
}

console.info(
  `\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s) — ${
    totalErrors === 0 ? "PASSED" : "FAILED"
  }`,
);
process.exit(totalErrors === 0 ? 0 : 1);
