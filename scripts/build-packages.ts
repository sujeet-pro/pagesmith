#!/usr/bin/env -S node --strip-types --no-warnings

import { spawnSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const root: string = process.cwd();
const packagesDir = join(root, "packages");
const packages: string[] = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(packagesDir, name, "package.json")));

const preferredOrder = ["core", "site", "docs"];
const orderedPackages = [
  ...preferredOrder.filter((name) => packages.includes(name)),
  ...packages.filter((name) => !preferredOrder.includes(name)).sort(),
];

// Rolldown emits `[PLUGIN_TIMINGS] Warning:` perf hints when bundling our
// libraries. They are advisory ("you spent significant time in plugins"),
// not actual problems we can act on (most of the time is inside upstream
// `tsdown:deps` and `rolldown-plugin-dts:*`). vp/tsdown does not yet expose
// `rolldownOptions.checks.pluginTimings: false` in its `pack` config, so
// we filter the lines out at the script boundary so the build output stays
// warning-free.
const SUPPRESS_LINE_PATTERN = new RegExp(
  [
    String.raw`^\s*\[PLUGIN_TIMINGS\]`,
    String.raw`^\s*See https://rolldown\.rs/options/checks#plugintimings`,
  ].join("|"),
);

function streamFilteredVpPack(packagePath: string): void {
  const result = spawnSync("vp", ["pack"], {
    cwd: packagePath,
    env: {
      ...process.env,
      PATH: `${join(root, "node_modules/.bin")}:${process.env.PATH}`,
    },
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
  });
  forwardFiltered(result.stdout, process.stdout);
  forwardFiltered(result.stderr, process.stderr);
  if (result.status !== 0) {
    throw new Error(
      `vp pack exited with code ${result.status} (signal=${result.signal ?? "none"})`,
    );
  }
}

function forwardFiltered(payload: string | undefined, sink: NodeJS.WriteStream): void {
  if (!payload) return;
  // Walk lines individually so we can drop the warning header AND the
  // breakdown lines that follow it (`  - tsdown:deps (58%)`). The
  // breakdown is bounded by a blank line, so we emit lines normally
  // until we hit a `[PLUGIN_TIMINGS]` header, then suppress through the
  // next blank line.
  let suppressing = false;
  const lines = payload.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (suppressing) {
      if (line.trim() === "") {
        suppressing = false;
        // Drop the trailing blank too so we do not leave double blank
        // lines in the output.
        continue;
      }
      continue;
    }
    if (SUPPRESS_LINE_PATTERN.test(line)) {
      suppressing = true;
      continue;
    }
    out.push(line);
  }
  sink.write(out.join("\n"));
}

for (const pkg of orderedPackages) {
  console.info(`\n> vp pack (${pkg})`);
  streamFilteredVpPack(join(root, "packages", pkg));
  annotateDynamicImports(join(packagesDir, pkg, "dist"));
}

/**
 * Re-add bundler-ignore magic comments to dynamic imports in compiled
 * output. The `pack` step (rolldown via tsdown) drops standalone JSDoc-style
 * comments from `await import(/* webpackIgnore: true *\/ expr)`, which then
 * causes downstream bundlers (webpack/Next.js) to emit
 * "Critical dependency: the request of a dependency is an expression" when
 * they bundle our published code. Re-injecting the comments at the dist
 * boundary keeps the source clean while suppressing the warning for
 * consumers without changing runtime behavior.
 */
function annotateDynamicImports(distDir: string): void {
  if (!existsSync(distDir)) return;
  // Only need to touch the bare `import(<non-literal>)` form — string
  // literals are static and bundlers handle them fine. Match must NOT be
  // preceded by `.` (so we skip `jiti.import(...)` etc.) and must NOT
  // already carry the magic comment.
  const dynamicImportPattern =
    /(?<![.\w$])import\(\s*(?!\/\*\s*(?:webpackIgnore|@vite-ignore))(?!['"`])([^)]+?)\)/g;
  const replacement = "import(/* webpackIgnore: true */ /* @vite-ignore */ $1)";

  const stack: string[] = [distDir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(?:m?js|cjs)$/.test(entry.name)) continue;
      const stat = statSync(full);
      if (stat.size === 0) continue;
      const source = readFileSync(full, "utf-8");
      if (!/\bimport\(/.test(source)) continue;
      const next = source.replace(dynamicImportPattern, replacement);
      if (next !== source) writeFileSync(full, next);
    }
  }
}
