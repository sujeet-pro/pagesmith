#!/usr/bin/env -S node --strip-types --no-warnings

// Render and validate Pagesmith diagrams.
//
// Modes:
//   render-and-validate (default)  npm run render:diagrams
//   validate-only                  npm run validate:diagrams
//
// This is a thin wrapper around diagramkit's own CLI. Directory walking,
// vendored/build-output exclusion (node_modules, .git, gh-pages, dist,
// .next, .temp, out, .cache), directory-segment scoping, and fatal-issue
// promotion all live in diagramkit itself now — see `--scope-dir` /
// `--fail-on` in `node_modules/diagramkit/REFERENCE.md`. This script only
// wires the two Pagesmith npm scripts to the right flags and forwards any
// extra CLI args (e.g. `npm run render:diagrams -- --force`).
//
// Fatal validate codes (on top of any `severity: error` issue, which is
// always fatal):
//
//   - LOW_CONTRAST_TEXT (WCAG 2.2 AA: text < 4.5:1 normal, < 3:1 large)
//   - CONTAINS_FOREIGN_OBJECT, CONTAINS_SCRIPT, EXTERNAL_RESOURCE
//     (silently degrade in the <img>-based embeds the docs site uses)
//
// All other warnings are surfaced but do not fail the run.
//
// `--scope-dir diagrams` restricts both render and validate to sources /
// SVGs that live under a directory literally named `diagrams` (segment
// match) — i.e. the project-owned `diagrams/` folders documented in
// AGENTS.md, not hand-authored SVGs elsewhere in the tree.

import { spawn } from "child_process";
import { fileURLToPath } from "url";

const rootDir = process.cwd();
const validateOnly = process.argv.includes("--validate-only");
const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--validate-only");

const SCOPE_DIR = "diagrams";
// LOW_CONTRAST_SHAPE / LOW_CONTRAST_STROKE: a box, line, or arrow effectively
// invisible against the canvas — a readability regression like LOW_CONTRAST_TEXT.
// The docs site embeds SVGs via <img>/<figure>/<picture>, so a diagram that is
// unreadable in light or dark must fail the build, not ship.
const FATAL_VALIDATE_CODES = [
  "LOW_CONTRAST_TEXT",
  "LOW_CONTRAST_SHAPE",
  "LOW_CONTRAST_STROKE",
  "CONTAINS_FOREIGN_OBJECT",
  "CONTAINS_SCRIPT",
  "EXTERNAL_RESOURCE",
].join(",");

const diagramkitBin = fileURLToPath(
  new URL("../node_modules/diagramkit/dist/cli/bin.mjs", import.meta.url),
);

function runDiagramkit(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [diagramkitBin, ...args], {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

async function run(): Promise<void> {
  if (!validateOnly) {
    const renderCode = await runDiagramkit([
      "render",
      ".",
      "--scope-dir",
      SCOPE_DIR,
      ...forwardedArgs,
    ]);
    if (renderCode !== 0) {
      throw new Error(`diagramkit render exited with code ${renderCode}`);
    }
  }

  const validateCode = await runDiagramkit([
    "validate",
    ".",
    "--recursive",
    "--scope-dir",
    SCOPE_DIR,
    "--fail-on",
    FATAL_VALIDATE_CODES,
  ]);

  if (validateCode !== 0) {
    console.error(
      "\nDiagram validation FAILED. Fix tactics:\n" +
        "  - LOW_CONTRAST_TEXT       → swap fills to the WCAG 2.2 AA palette documented in `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`, then re-render.\n" +
        "  - CONTAINS_FOREIGN_OBJECT → for Mermaid sources, add `%%{init: {'htmlLabels': false}}%%` at the top and re-render.\n" +
        "  - CONTAINS_SCRIPT         → strip inline `<script>` from the engine output (drawio: remove `<a xlink:href>` wrappers and JS hooks).\n" +
        "  - EXTERNAL_RESOURCE       → inline external fonts/icons or replace with embedded equivalents.\n" +
        "\nSee `.agents/skills/prj-diagramkit-review/SKILL.md` for the full audit + repair workflow.",
    );
    process.exit(1);
  }
}

await run();
