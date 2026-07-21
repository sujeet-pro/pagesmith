#!/usr/bin/env -S node --strip-types --no-warnings

/**
 * Pagesmith skills-install validation.
 *
 * Three checks, all failing the build on any error:
 *
 *   1. Frontmatter — every `packages/<pkg>/skills/<name>/SKILL.md` has a valid
 *      `name` (matching its folder) and a non-empty `description`. These are the
 *      only two fields the versioned-pointer installer copies into a stub, so a
 *      missing one silently breaks skill triggering in every consumer.
 *
 *   2. Umbrella installer end-to-end — against a throwaway fixture consumer with
 *      the workspace packages linked into `node_modules/@pagesmith/*`, run the
 *      built `pagesmith` bin: install → `--check` is green; delete a stub →
 *      `--check` exits nonzero; drop in an orphan `pagesmith-x` stub → `--check`
 *      flags it. Skipped when `dist/` bins are absent (run `build:library`).
 *
 *   2b. Consumer-dir scoping — a fixture consumer with NO `@pagesmith/*`
 *      installed must resolve nothing and exit nonzero, proving the installer
 *      scopes resolution to `--dir` rather than leaking to the CLI's own
 *      install location (the repo it was built in).
 *
 *   3. Deprecated alias — the built `pagesmith-core skills` bin forwards to the
 *      same pointer installer and prints a deprecation note to stderr.
 *
 * Usage:
 *   npm run validate:skills
 */

import { spawnSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const repoRoot = resolve(import.meta.dirname, "..");
const PACKAGES = ["core", "site", "docs"] as const;
const POINTER_MARKER_TOKEN = "pagesmith-skill-pointer";

let failures = 0;
function fail(message: string): void {
  failures += 1;
  console.error(`  ✗ ${message}`);
}
function ok(message: string): void {
  console.info(`  ✓ ${message}`);
}

function readFrontmatter(content: string): { name?: string; description?: string } {
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(content);
  if (!match) return {};
  const body = match[1] ?? "";
  const get = (key: string): string | undefined =>
    new RegExp(`^${key}:\\s*(.+)$`, "m").exec(body)?.[1]?.trim();
  return { name: get("name"), description: get("description") };
}

/* ── 1. Frontmatter ── */

function validateFrontmatter(): void {
  console.info("\n[skills-frontmatter]");
  let count = 0;
  for (const pkg of PACKAGES) {
    const skillsDir = join(repoRoot, "packages", pkg, "skills");
    if (!existsSync(skillsDir)) continue;
    for (const name of readdirSync(skillsDir).sort()) {
      const skillMd = join(skillsDir, name, "SKILL.md");
      if (!existsSync(skillMd)) continue;
      count += 1;
      const fm = readFrontmatter(readFileSync(skillMd, "utf-8"));
      const rel = `packages/${pkg}/skills/${name}/SKILL.md`;
      if (!fm.name) fail(`${rel}: missing frontmatter "name"`);
      else if (fm.name !== name) fail(`${rel}: frontmatter name "${fm.name}" != folder "${name}"`);
      if (!fm.description) fail(`${rel}: missing frontmatter "description"`);
    }
  }
  if (count === 0) fail("no packages/*/skills/*/SKILL.md files found");
  else ok(`${count} SKILL.md file(s) have valid name + description frontmatter`);
}

/* ── Fixture consumer ── */

/** Build a fixture repo with the workspace packages linked into node_modules. */
function makeFixture(): string {
  const dir = makeBareFixture();
  const scope = join(dir, "node_modules", "@pagesmith");
  mkdirSync(scope, { recursive: true });
  for (const pkg of PACKAGES) {
    symlinkSync(join(repoRoot, "packages", pkg), join(scope, pkg), "dir");
  }
  return dir;
}

/**
 * A consumer repo with **no** `@pagesmith/*` installed. Used to prove the
 * installer resolves packages from the consumer `--dir` and never leaks to the
 * CLI's own install location (the repo it was built in).
 */
function makeBareFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "pagesmith-skills-fixture-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "fixture-consumer", private: true }),
  );
  return dir;
}

function siteBin(): string {
  return join(repoRoot, "packages", "site", "dist", "cli", "bin.mjs");
}
function coreBin(): string {
  return join(repoRoot, "packages", "core", "dist", "cli", "bin.mjs");
}

/* ── 2. Umbrella installer end-to-end ── */

function validateUmbrellaFixture(): void {
  console.info("\n[skills-umbrella-e2e]");
  if (!existsSync(siteBin())) {
    ok("site dist/cli/bin.mjs not present — skipping end-to-end (run build:library)");
    return;
  }
  const dir = makeFixture();
  const run = (extra: string[]) =>
    spawnSync(
      process.execPath,
      [siteBin(), "skills", "install", "--dir", dir, "--harness", "claude", ...extra],
      {
        encoding: "utf-8",
      },
    );
  try {
    const install = run([]);
    if (install.status !== 0) {
      fail(`umbrella install exited ${install.status}. ${(install.stderr ?? "").trim()}`);
      return;
    }
    const agentsSkills = join(dir, ".agents", "skills");
    const stubDirs = existsSync(agentsSkills)
      ? readdirSync(agentsSkills).filter((n) => n.startsWith("pagesmith-"))
      : [];
    if (stubDirs.length === 0) {
      fail("umbrella install wrote no .agents/skills/pagesmith-* stubs");
      return;
    }
    ok(`umbrella install wrote ${stubDirs.length} pagesmith-* canonical stub(s)`);

    const check = run(["--check"]);
    if (check.status !== 0) {
      fail(`--check should be green right after install but exited ${check.status}`);
      return;
    }
    ok("--check is green immediately after install");

    // Delete one stub → --check must go nonzero (missing).
    const victim = join(agentsSkills, stubDirs[0]!, "SKILL.md");
    rmSync(victim, { force: true });
    if (run(["--check"]).status === 0) {
      fail(`--check should exit nonzero after deleting ${stubDirs[0]}/SKILL.md`);
      return;
    }
    ok("--check flags a deleted stub as missing");

    // Reinstall to restore, then drop in an orphan managed stub → flagged.
    run([]);
    const orphanDir = join(agentsSkills, "pagesmith-x");
    mkdirSync(orphanDir, { recursive: true });
    writeFileSync(
      join(orphanDir, "SKILL.md"),
      `---\nname: pagesmith-x\ndescription: orphan\n---\n\n<!-- ${POINTER_MARKER_TOKEN}: pkg=@pagesmith/core version=0.0.0 generator=@pagesmith/core@0.0.0 -->\n`,
    );
    const orphanCheck = run(["--check", "--json"]);
    if (orphanCheck.status === 0) {
      fail("--check should exit nonzero when an orphan pagesmith-x stub is present");
      return;
    }
    const payload = parseLastJson(orphanCheck.stdout);
    const flagged = payload?.actions?.some(
      (a: { skill?: string; status?: string }) =>
        a.skill === "pagesmith-x" && a.status === "orphaned",
    );
    if (!flagged)
      fail("orphan pagesmith-x was not reported with status 'orphaned' in --json output");
    else ok("orphan pagesmith-x is flagged as 'orphaned'");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ── 2b. Consumer-dir scoping (resolver must not leak to the CLI install) ── */

function validateConsumerScoping(): void {
  console.info("\n[skills-consumer-scoping]");
  if (!existsSync(siteBin())) {
    ok("site dist/cli/bin.mjs not present — skipping scoping check (run build:library)");
    return;
  }
  // A consumer with no @pagesmith/* installed. The CLI itself runs from a repo
  // that CAN resolve @pagesmith/*, so a cwd-unscoped resolver would wrongly
  // "find" them and write stubs; a correctly scoped resolver must resolve
  // nothing and exit nonzero. This is what makes the umbrella-e2e fixture
  // genuinely test consumer-dir resolution rather than repo resolution.
  const dir = makeBareFixture();
  try {
    const result = spawnSync(
      process.execPath,
      [siteBin(), "skills", "install", "--dir", dir, "--harness", "claude", "--json"],
      { encoding: "utf-8" },
    );
    if (result.status === 0) {
      fail(
        "install against a consumer with no @pagesmith/* resolved packages — " +
          "the resolver leaked to the CLI's own install location instead of scoping to --dir",
      );
      return;
    }
    if (existsSync(join(dir, ".agents", "skills"))) {
      fail("install wrote stubs for a consumer that has no @pagesmith/* installed");
      return;
    }
    ok("a consumer dir without @pagesmith/* resolves nothing (cwd-scoped, no leak to CLI install)");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ── 3. Deprecated alias forwarding ── */

function validateDeprecatedAlias(): void {
  console.info("\n[skills-deprecated-alias]");
  if (!existsSync(coreBin())) {
    ok("core dist/cli/bin.mjs not present — skipping alias check (run build:library)");
    return;
  }
  const dir = makeFixture();
  try {
    const result = spawnSync(
      process.execPath,
      [coreBin(), "skills", "--dir", dir, "--harness", "claude", "--json"],
      { encoding: "utf-8" },
    );
    if (result.status !== 0) {
      fail(`deprecated alias exited ${result.status}. ${(result.stderr ?? "").trim()}`);
      return;
    }
    if (!/deprecated/i.test(result.stderr ?? "")) {
      fail('deprecated alias did not print a "deprecated" note to stderr');
      return;
    }
    const payload = parseLastJson(result.stdout);
    if (!payload?.ok) {
      fail("deprecated alias did not report ok in its --json output");
      return;
    }
    if (!existsSync(join(dir, ".agents", "skills"))) {
      fail("deprecated alias wrote no .agents/skills stubs");
      return;
    }
    ok("pagesmith-core skills forwards to the pointer installer with a deprecation note");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function parseLastJson(
  stdout: string | undefined,
): { ok?: boolean; actions?: unknown[] } | undefined {
  if (!stdout) return undefined;
  const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]!) as { ok?: boolean; actions?: unknown[] };
    } catch {
      // not JSON — keep scanning upward
    }
  }
  return undefined;
}

/* ── Run ── */

validateFrontmatter();
validateUmbrellaFixture();
validateConsumerScoping();
validateDeprecatedAlias();

console.info(`\nSummary: ${failures} error(s) — ${failures === 0 ? "PASSED" : "FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
