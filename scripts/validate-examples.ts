#!/usr/bin/env -S node --strip-types --no-warnings

import { exec } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { basename, join, resolve } from "path";
import { promisify } from "util";
import { findDanglingReferences } from "./llms-reference-check.ts";

const execAsync = promisify(exec);

interface Example {
  name: string;
  path: string;
  buildCmd: string;
  outDir: string;
}

interface Result {
  name: string;
  passed: boolean;
  error?: string;
}

const root: string = process.cwd();

const examples: Example[] = [
  {
    name: "blog-site",
    path: "examples/blog-site",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/blog-site",
  },
  {
    name: "doc-site",
    path: "examples/doc-site",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/doc-site",
  },
  {
    name: "with-nextjs",
    path: "examples/frameworks/with-nextjs",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/nextjs",
  },
  {
    name: "with-vanilla-ejs",
    path: "examples/frameworks/with-vanilla-ejs",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/vanilla-ejs",
  },
  {
    name: "with-vanilla-hbs",
    path: "examples/frameworks/with-vanilla-hbs",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/vanilla-hbs",
  },
  {
    name: "with-react",
    path: "examples/frameworks/with-react",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/react",
  },
  {
    name: "with-solid",
    path: "examples/frameworks/with-solid",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/solid",
  },
  {
    name: "with-svelte",
    path: "examples/frameworks/with-svelte",
    buildCmd: "npm run build",
    outDir: "gh-pages/examples/svelte",
  },
];

// ── llms*.txt staleness guard ───────────────────────────────────────────
//
// Each example commits a hand-authored `llms.txt` + `llms-full.txt` (the
// "required source files" checked above). Unlike the package-root
// `llms.txt`/`llms-full.txt` under `packages/*/`, there is no deterministic
// generator for these — they are curated per-example AI-context digests
// (see `.agents/skills/prj-maintain-examples/SKILL.md`), and the only real
// "regeneration" available (an AI authoring pass, or diffing against a full
// `vite build`/`next build` of every example) is either non-deterministic or
// exactly the expensive full-build cost this check is meant to avoid paying
// on every `validate:examples` run.
//
// Instead this scopes down to a cheap, deterministic subset of the same
// staleness class: every backtick-quoted file-like path an example's
// llms*.txt references must still resolve to a real file (relative to the
// example, relative to the repo root for cross-package references, or by
// basename anywhere under the example — prose here often shorthands a path
// already established earlier in the same paragraph). A rename, move, or
// deletion that leaves a dangling reference is exactly the "docs drifted
// from code" failure mode this check exists to catch; see
// `scripts/llms-reference-check.ts` for the extraction/matching logic.
const LLMS_FILES = ["llms.txt", "llms-full.txt"] as const;

const LLMS_TREE_IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "gh-pages",
  ".next",
  "out",
  ".diagramkit",
]);

/**
 * Mentions that read as file paths but are illustrative contrasts rather
 * than real references (e.g. "not a `content.config.ts` collection example",
 * naming a convention this example deliberately does NOT use). Keyed by
 * `<example path>/<llms file>`.
 */
const ILLUSTRATIVE_LLMS_MENTIONS: Record<string, ReadonlySet<string> | undefined> = {
  "examples/doc-site/llms.txt": new Set(["content.config.ts"]),
  "examples/doc-site/llms-full.txt": new Set(["content.config.ts"]),
};

/** Every file basename under `dir`, recursively, skipping vendored/build dirs. */
function collectBasenames(dir: string): Set<string> {
  const names = new Set<string>();

  function walk(current: string): void {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (LLMS_TREE_IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
        walk(join(current, entry.name));
      } else {
        names.add(entry.name);
      }
    }
  }

  walk(dir);
  return names;
}

function checkExampleLlmsReferences(example: Example): Result {
  const exampleDir = join(root, example.path);
  const basenames = collectBasenames(exampleDir);
  const staleRefs: string[] = [];

  for (const fileName of LLMS_FILES) {
    const filePath = join(exampleDir, fileName);
    if (!existsSync(filePath)) continue; // reported separately as a missing required source file

    const content = readFileSync(filePath, "utf-8");
    const ignore = ILLUSTRATIVE_LLMS_MENTIONS[`${example.path}/${fileName}`];
    const dangling = findDanglingReferences(
      content,
      (ref) =>
        existsSync(resolve(exampleDir, ref)) ||
        existsSync(resolve(root, ref)) ||
        basenames.has(basename(ref)),
      { ignore },
    );
    for (const ref of dangling) staleRefs.push(`${fileName}: \`${ref}\``);
  }

  if (staleRefs.length === 0) {
    return { name: `${example.name} (llms references)`, passed: true };
  }
  return {
    name: `${example.name} (llms references)`,
    passed: false,
    error: `dangling reference(s), file(s) no longer exist: ${staleRefs.join(", ")}`,
  };
}

async function validateExample(example: Example): Promise<Result> {
  const dir: string = join(root, example.path);
  const outDir: string = join(root, example.outDir);
  const requiredSourceFiles = ["README.md", "llms.txt", "llms-full.txt"];

  try {
    for (const relativePath of requiredSourceFiles) {
      if (!existsSync(join(dir, relativePath))) {
        return {
          name: example.name,
          passed: false,
          error: `required source file not found: ${join(example.path, relativePath)}`,
        };
      }
    }

    await execAsync(example.buildCmd, {
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${join(root, "node_modules/.bin")}:${process.env.PATH}`,
      },
    });

    if (!existsSync(outDir)) {
      return { name: example.name, passed: false, error: `output dir not found: ${outDir}` };
    }

    const files = readdirSync(outDir, { recursive: true }) as string[];
    const hasIndex: boolean = files.some(
      (file: string) => file === "index.html" || file.endsWith("/index.html"),
    );

    if (!hasIndex) {
      return { name: example.name, passed: false, error: "no index.html found in output" };
    }

    for (const llmsFile of LLMS_FILES) {
      if (!existsSync(join(outDir, llmsFile))) {
        return {
          name: example.name,
          passed: false,
          error: `${llmsFile} not found in build output`,
        };
      }
    }

    return { name: example.name, passed: true };
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    return { name: example.name, passed: false, error: message };
  }
}

console.info(`\nValidating ${examples.length} examples in parallel...\n`);

const buildResults: Result[] = await Promise.all(examples.map(validateExample));

for (const result of buildResults) {
  const status = result.passed ? "PASS" : `FAIL (${result.error})`;
  if (result.passed) console.info(`  ${result.name} ... ${status}`);
  else console.error(`  ${result.name} ... ${status}`);
}

console.info(`\nChecking llms*.txt references in ${examples.length} examples...\n`);

const llmsResults: Result[] = examples.map(checkExampleLlmsReferences);

for (const result of llmsResults) {
  const status = result.passed ? "PASS" : `FAIL (${result.error})`;
  if (result.passed) console.info(`  ${result.name} ... ${status}`);
  else console.error(`  ${result.name} ... ${status}`);
}

const results: Result[] = [...buildResults, ...llmsResults];

console.info("\n--- Summary ---");
const passed: Result[] = results.filter((result: Result) => result.passed);
const failed: Result[] = results.filter((result: Result) => !result.passed);

console.info(`Passed: ${passed.length}/${results.length}`);

if (failed.length > 0) {
  console.error("\nFailed:");
  for (const failure of failed) {
    console.error(`  - ${failure.name}: ${failure.error}`);
  }
  process.exit(1);
}
