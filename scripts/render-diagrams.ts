#!/usr/bin/env -S node --strip-types --no-warnings

// Render and validate Pagesmith diagrams.
//
// Modes:
//   render-and-validate (default)  npm run render:diagrams
//   validate-only                  npm run validate:diagrams
//
// Validation runs `diagramkit validate` against every project-owned diagram
// SVG (every *-light.svg / *-dark.svg inside a diagrams/ folder under
// docs/content/**, examples/**, or packages/*/**). It treats the following
// diagramkit issue codes as fatal so the docs build fails on:
//
//   - any error severity (NO_VISUAL_ELEMENTS, MISSING_SVG_CLOSE,
//     EMPTY_FILE, CONTAINS_SCRIPT, ...)
//   - LOW_CONTRAST_TEXT (WCAG 2.2 AA: text < 4.5:1 normal, < 3:1 large)
//   - CONTAINS_FOREIGN_OBJECT, CONTAINS_SCRIPT, EXTERNAL_RESOURCE
//     (silently degrade in the <img>-based embeds the docs site uses)
//
// All other warnings are surfaced but do not fail the run.
//
// The build-output copies under gh-pages/ and the vendored SVGs inside
// node_modules/ are intentionally skipped — they are either content-hashed
// duplicates of the source diagrams (already validated upstream) or
// third-party assets we do not own.

import { spawn } from "child_process";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { join, relative, sep } from "path";

const rootDir = process.cwd();
const validateOnly = process.argv.includes("--validate-only");
const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--validate-only");

const diagramsSegment = `${sep}diagrams${sep}`;
const diagramSvgPattern = /(?:-light|-dark)\.svg$/;
const skippedDirs = new Set([
  ".git",
  ".next",
  ".diagramkit",
  ".temp",
  "dist",
  "gh-pages",
  "node_modules",
  "out",
]);
const fatalIssueCodes = new Set([
  "LOW_CONTRAST_TEXT",
  "CONTAINS_FOREIGN_OBJECT",
  "CONTAINS_SCRIPT",
  "EXTERNAL_RESOURCE",
]);

const diagramkitBin = fileURLToPath(
  new URL("../node_modules/diagramkit/dist/cli/bin.mjs", import.meta.url),
);

interface DiagramkitIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  suggestion?: string;
}

interface DiagramkitFileResult {
  file: string;
  valid: boolean;
  issues: DiagramkitIssue[];
}

interface DiagramkitValidateResponse {
  files: number;
  valid: number;
  invalid: number;
  results: DiagramkitFileResult[];
}

function collectDiagramSvgFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && skippedDirs.has(entry.name)) {
      continue;
    }

    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectDiagramSvgFiles(entryPath));
      continue;
    }

    if (diagramSvgPattern.test(entry.name) && entryPath.includes(diagramsSegment)) {
      files.push(entryPath);
    }
  }

  return files;
}

function runDiagramkit(
  args: string[],
  capture: boolean,
): Promise<{ code: number; stdout: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    const child = spawn(process.execPath, [diagramkitBin, ...args], {
      cwd: rootDir,
      env: process.env,
      stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
    });

    if (capture && child.stdout) {
      child.stdout.setEncoding("utf-8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
    }

    child.once("error", reject);
    child.once("exit", (code) => {
      resolve({ code: code ?? 1, stdout });
    });
  });
}

function formatIssue(filePath: string, issue: DiagramkitIssue): string {
  const fileLabel = relative(rootDir, filePath) || filePath;
  const lines = [`  - ${fileLabel}`, `      [${issue.severity}] ${issue.code}: ${issue.message}`];
  if (issue.suggestion) {
    lines.push(`      → ${issue.suggestion}`);
  }
  return lines.join("\n");
}

async function validateDiagramSvgs(): Promise<void> {
  const projectDiagramFiles = new Set(collectDiagramSvgFiles(rootDir));

  if (projectDiagramFiles.size === 0) {
    console.info("No project diagram SVGs found to validate.");
    return;
  }

  // diagramkit validate only accepts a single file/dir argument, so run it
  // recursively from the repo root and filter the JSON output down to the
  // project-owned diagram set we care about.
  const { code, stdout } = await runDiagramkit(["validate", ".", "--recursive", "--json"], true);

  let payload: DiagramkitValidateResponse;
  try {
    payload = JSON.parse(stdout) as DiagramkitValidateResponse;
  } catch (error) {
    console.error("Failed to parse diagramkit validate output as JSON:");
    console.error(stdout);
    throw error;
  }

  const projectResults = payload.results.filter((result) => projectDiagramFiles.has(result.file));
  const fatalEntries: { file: string; issue: DiagramkitIssue }[] = [];
  const informationalEntries: { file: string; issue: DiagramkitIssue }[] = [];

  for (const result of projectResults) {
    for (const issue of result.issues) {
      const isFatal = issue.severity === "error" || fatalIssueCodes.has(issue.code);
      if (isFatal) {
        fatalEntries.push({ file: result.file, issue });
      } else {
        informationalEntries.push({ file: result.file, issue });
      }
    }
  }

  if (informationalEntries.length > 0) {
    console.warn(
      `\nDiagram validation produced ${informationalEntries.length} non-fatal warning(s):`,
    );
    for (const entry of informationalEntries) {
      console.warn(formatIssue(entry.file, entry.issue));
    }
  }

  if (fatalEntries.length === 0) {
    console.info(
      `\nValidated ${projectResults.length} project diagram SVG(s): structure OK, embed-safe, WCAG 2.2 AA contrast OK.`,
    );

    if (code !== 0) {
      // The diagramkit CLI flagged something elsewhere in the tree (e.g. a
      // gh-pages copy or a vendored asset). Surface the exit code but do
      // not fail the build — the project diagram set is clean.
      console.warn(
        `(diagramkit validate returned exit code ${code} for non-project files; treated as non-fatal.)`,
      );
    }
    return;
  }

  console.error(`\nDiagram validation FAILED with ${fatalEntries.length} fatal issue(s):`);
  for (const entry of fatalEntries) {
    console.error(formatIssue(entry.file, entry.issue));
  }

  console.error("\nFix tactics:");
  console.error(
    "  - LOW_CONTRAST_TEXT       → swap fills to the WCAG 2.2 AA palette documented in `node_modules/diagramkit/skills/diagramkit-<engine>/SKILL.md`, then re-render.",
  );
  console.error(
    "  - CONTAINS_FOREIGN_OBJECT → for Mermaid sources, add `%%{init: {'htmlLabels': false}}%%` at the top and re-render.",
  );
  console.error(
    "  - CONTAINS_SCRIPT         → strip inline `<script>` from the engine output (drawio: remove `<a xlink:href>` wrappers and JS hooks).",
  );
  console.error(
    "  - EXTERNAL_RESOURCE       → inline external fonts/icons or replace with embedded equivalents.",
  );
  console.error(
    "\nSee `.agents/skills/prj-diagramkit-review/SKILL.md` for the full audit + repair workflow.",
  );

  process.exit(1);
}

async function run(): Promise<void> {
  if (!validateOnly) {
    const { code } = await runDiagramkit(["render", ".", ...forwardedArgs], false);
    if (code !== 0) {
      throw new Error(`diagramkit render exited with code ${code}`);
    }
  }

  await validateDiagramSvgs();
}

await run();
