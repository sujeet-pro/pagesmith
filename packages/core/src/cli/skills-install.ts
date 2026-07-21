/**
 * `pagesmith skills install` — write versioned-pointer skill stubs into a
 * consumer repo.
 *
 * Unlike the old full-copy installer, this never duplicates a skill body into
 * the repo. For every skill shipped by a resolvable `@pagesmith/*` package under
 * `node_modules/@pagesmith/<pkg>/skills/<name>/`, it writes a canonical pointer
 * stub at `.agents/skills/<name>/SKILL.md` plus thin mirrors under each
 * detected/requested harness dir (`.claude/skills`, `.cursor/skills`,
 * `.codex/skills`, `.continue/skills`). The stub bodies point back at the
 * version-pinned original in `node_modules`, so every agent reads exactly the
 * skill that matches the installed package.
 *
 * Stubs carry an HTML-comment marker so re-runs are idempotent (created /
 * updated / unchanged), version bumps are detected as drift, and orphaned stubs
 * (skills removed from a newer package, or a package that is no longer
 * installed) can be swept — but only within the managed `pagesmith-*` namespace,
 * and only stubs we actually generated.
 *
 * The mechanism is deliberately parallel to `diagramkit skills install`; the
 * only structural difference is that Pagesmith installs from several packages at
 * once, so the orphan baseline is the union of every resolvable package's skill
 * set (never just the packages selected for this run).
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { createRequire } from "module";
import { dirname, join, relative, resolve } from "path";

/* ── Public constants ── */

export type HarnessName = "claude" | "cursor" | "codex" | "continue";

/** Parent dir for each harness (mirrors live under `<dir>/skills/`). */
export const HARNESS_PARENT_DIRS: Record<HarnessName, string> = {
  claude: ".claude",
  cursor: ".cursor",
  codex: ".codex",
  continue: ".continue",
};

export const ALL_HARNESSES: readonly HarnessName[] = ["claude", "cursor", "codex", "continue"];

/** HTML-comment marker token identifying a canonical Pagesmith pointer stub. */
export const POINTER_MARKER_TOKEN = "pagesmith-skill-pointer";

/** HTML-comment marker token identifying a Pagesmith harness mirror stub. */
export const MIRROR_MARKER_TOKEN = "pagesmith-skill-mirror";

/**
 * Shared substring present in both marker tokens. Retained for reference; orphan
 * detection deliberately does **not** key on this bare substring (it would match
 * a hand-authored skill that merely mentions the token in prose) — see
 * {@link hasManagedMarker}.
 */
export const MANAGED_MARKER_SUBSTRING = "pagesmith-skill-";

/**
 * Exact HTML-comment marker a stub must carry to be considered ours. Anchored on
 * the generated `<!-- pagesmith-skill-{pointer,mirror}: …` prefix so orphan
 * detection never mistakes prose that merely contains the token for a managed
 * stub, and never sweeps a hand-authored skill.
 */
const MANAGED_MARKER_PATTERN = new RegExp(
  `<!--\\s*(?:${POINTER_MARKER_TOKEN}|${MIRROR_MARKER_TOKEN}):`,
);

/** True when `content` carries a generated Pagesmith pointer or mirror marker. */
export function hasManagedMarker(content: string): boolean {
  return MANAGED_MARKER_PATTERN.test(content);
}

/** Only skills in this namespace are ever created, swept, or reported. */
export const MANAGED_SKILL_PREFIX = "pagesmith-";

/** Packages the umbrella installer considers by default. */
export const DEFAULT_PACKAGES: readonly string[] = [
  "@pagesmith/core",
  "@pagesmith/site",
  "@pagesmith/docs",
];

/* ── Public types ── */

export type StubStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "removed" // orphan deleted (install / dry-run)
  | "missing" // --check: stub absent, would be created
  | "stale" // --check: stub drifted, would be updated
  | "orphaned"; // --check: managed stub no longer shipped

export interface SkillStubAction {
  /** Path relative to the target dir. */
  path: string;
  skill: string;
  /** Owning package (undefined for orphan sweeps). */
  pkg?: string;
  kind: "canonical" | "mirror" | "orphan";
  harness?: HarnessName;
  status: StubStatus;
}

export interface InstalledPackage {
  pkg: string;
  /** Installed version read from the resolved package.json. */
  version: string;
}

export interface InstallSkillsResult {
  cwd: string;
  mode: "install" | "check" | "dry-run";
  /** Packages skills were installed from this run (resolved + selected). */
  packages: InstalledPackage[];
  /** Requested packages that could not be resolved from the consumer. */
  unresolved: string[];
  /**
   * Whether the caller named packages explicitly (`--package`). When `false`
   * the run used the default package set, so an unresolved default is expected
   * for a core-only consumer and is not surfaced as a `[skipped]` warning.
   */
  requestedExplicit: boolean;
  /** Harness mirror dirs written this run (the `.agents` base is always written). */
  harnesses: HarnessName[];
  /** Skill names targeted this run. */
  skills: string[];
  actions: SkillStubAction[];
  /**
   * `--check` disposition: `true` when nothing is missing/stale/orphaned.
   * Always `true` for install / dry-run.
   */
  ok: boolean;
}

export interface InstallSkillsOptions {
  /** Target repo directory (default: `process.cwd()`). */
  cwd?: string;
  /**
   * Restrict installation to these packages. `undefined` = every default
   * package that resolves. Orphan detection always uses the full resolvable
   * set, so `--package` never sweeps stubs it merely chose not to reinstall.
   */
  packages?: string[];
  /** Explicit harness selection. `undefined` = auto-detect. */
  harnesses?: HarnessName[];
  /** Restrict to these skill names (with or without the `pagesmith-` prefix). */
  only?: string[];
  /** Verify-only: never write, exit nonzero on missing/stale/orphaned. */
  check?: boolean;
  /** Show what would happen without writing. */
  dryRun?: boolean;
  /**
   * Test hook: map of package name → package root. When a package is present
   * here its root is used verbatim, bypassing `import.meta.resolve`.
   */
  packageRoots?: Record<string, string>;
}

/* ── Frontmatter ── */

export interface SkillFrontmatter {
  name?: string;
  description?: string;
}

/** Parse the leading YAML frontmatter block for `name` / `description`. */
export function readFrontmatter(content: string): SkillFrontmatter {
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(content);
  if (!match) return {};
  const body = match[1] ?? "";
  const get = (key: string): string | undefined => {
    const re = new RegExp(`^${key}:\\s*(.+)$`, "m");
    const m = re.exec(body);
    return m?.[1]?.trim();
  };
  return { name: get("name"), description: get("description") };
}

/* ── Package resolution ── */

/**
 * Resolve a package root (the dir containing its `package.json`) as seen from
 * the consumer `cwd`. Returns `undefined` when the package is not installed.
 *
 * Resolution is anchored on `cwd` via `createRequire(<cwd>/package.json)`.
 * `import.meta.resolve(spec, base)` must **not** be used here: on stable Node
 * (without `--experimental-import-meta-resolve`) the second `base`/parent
 * argument is silently ignored, so it resolves relative to *this* module — the
 * CLI's own install location — instead of the consumer `cwd`. That defeats the
 * whole point of `--dir`/`cwd` scoping (it would happily "find" a package the
 * consumer never installed). `createRequire` from the consumer's own
 * `package.json` walks the consumer's `node_modules` chain, matching Node's
 * runtime resolution for that directory.
 */
export function resolvePackageRoot(pkg: string, cwd: string): string | undefined {
  const requireFromCwd = createRequire(join(resolve(cwd), "package.json"));

  // Preferred: resolve the package's own `package.json` (most packages expose
  // it via `exports`, and Node always permits the `./package.json` subpath).
  try {
    const pkgPath = requireFromCwd.resolve(`${pkg}/package.json`);
    if (existsSync(pkgPath)) return dirname(pkgPath);
  } catch {
    // Package may not expose `./package.json` through its `exports` map — fall
    // through to resolving its entry point and walking up.
  }

  // Fallback: resolve the package entry, then walk up to the nearest
  // `package.json` whose name matches the requested package.
  try {
    let dir = dirname(requireFromCwd.resolve(pkg));
    for (;;) {
      const candidate = join(dir, "package.json");
      if (existsSync(candidate) && readPackageName(candidate) === pkg) return dir;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // package not installed — fall through
  }
  return undefined;
}

function readPackageName(packageJsonPath: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as { name?: string };
    return pkg.name;
  } catch {
    return undefined;
  }
}

function readPackageVersion(packageRoot: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf-8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/* ── Skill discovery ── */

export interface DiscoveredSkill {
  name: string;
  description: string;
  sourcePath: string;
}

/** List every `skills/<name>/SKILL.md` shipped in a package root. */
export function discoverSkills(packageRoot: string): DiscoveredSkill[] {
  const skillsDir = join(packageRoot, "skills");
  if (!existsSync(skillsDir) || !statSync(skillsDir).isDirectory()) return [];
  const out: DiscoveredSkill[] = [];
  for (const name of readdirSync(skillsDir).sort()) {
    const skillMd = join(skillsDir, name, "SKILL.md");
    if (!existsSync(skillMd)) continue;
    const content = readFileSync(skillMd, "utf-8");
    const { name: fmName, description } = readFrontmatter(content);
    out.push({ name: fmName ?? name, description: description ?? "", sourcePath: skillMd });
  }
  return out;
}

/* ── Harness detection ── */

/** A harness is auto-detected when its parent dir already exists in the repo. */
export function detectHarnesses(cwd: string): HarnessName[] {
  return ALL_HARNESSES.filter((h) => existsSync(join(cwd, HARNESS_PARENT_DIRS[h])));
}

/* ── Stub templates ── */

export function buildPointerMarker(pkg: string, version: string): string {
  return `<!-- ${POINTER_MARKER_TOKEN}: pkg=${pkg} version=${version} generator=${pkg}@${version} -->`;
}

export function buildMirrorMarker(name: string): string {
  return `<!-- ${MIRROR_MARKER_TOKEN}: canonical=.agents/skills/${name}/SKILL.md -->`;
}

/** POSIX relative path from `stubDir` to a target under the resolved package root. */
function posixRelative(stubDir: string, target: string): string {
  return relative(resolve(stubDir), target)
    .split(/[\\/]+/)
    .join("/");
}

/**
 * Compute the POSIX relative link from a canonical stub's directory to the
 * `SKILL.md` shipped by the resolved package root. Using the *resolved* package
 * root (not a fixed `../../../node_modules/@pagesmith/<pkg>` string) keeps the
 * pointer correct in hoisted monorepos, where the package lives at the repo-root
 * `node_modules` while the stub may sit several levels deep.
 */
export function pointerToPackageSkill(stubDir: string, packageRoot: string, name: string): string {
  return posixRelative(stubDir, join(resolve(packageRoot), "skills", name, "SKILL.md"));
}

/**
 * Canonical stub written to `.agents/skills/<name>/SKILL.md`. Points at the
 * version-pinned original in the resolved package via relative links.
 */
export function renderCanonicalStub(input: {
  name: string;
  description: string;
  pkg: string;
  version: string;
  pointerPath: string;
  referencesPath: string;
  packageReferencePath: string;
}): string {
  const { name, description, pkg, version, pointerPath, referencesPath, packageReferencePath } =
    input;
  return `---
name: ${name}
description: ${description}
---

${buildPointerMarker(pkg, version)}

# ${name}

Canonical, version-matched skill body ships inside the installed \`${pkg}\` package. Read and follow it exactly — do not duplicate it here:

→ [\`${pointerPath}\`](${pointerPath})

Sibling references (if present): [\`${referencesPath}\`](${referencesPath})
Package reference: [\`${packageReferencePath}\`](${packageReferencePath})

The body auto-upgrades whenever \`${pkg}\` is reinstalled. Always anchor on the local install (\`npx pagesmith ...\`), never a global one.
`;
}

/**
 * Mirror stub written to `<harness>/skills/<name>/SKILL.md`. Points back at the
 * canonical `.agents/skills/...` file. The `../../../` prefix resolves to the
 * repo root from three levels deep (`.claude/skills/<name>/`).
 */
export function renderMirrorStub(name: string, description: string): string {
  return `---
name: ${name}
description: ${description}
---

${buildMirrorMarker(name)}

# ${name}

Follow [\`.agents/skills/${name}/SKILL.md\`](../../../.agents/skills/${name}/SKILL.md). Do not duplicate its content here.
`;
}

/* ── Idempotent writes ── */

type PlannedWrite = "created" | "updated" | "unchanged";

function planWrite(path: string, content: string): PlannedWrite {
  if (existsSync(path)) {
    return readFileSync(path, "utf-8") === content ? "unchanged" : "updated";
  }
  return "created";
}

function commitWrite(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** Map a planned write to its `--check` status. */
function checkStatus(planned: PlannedWrite): StubStatus {
  if (planned === "created") return "missing";
  if (planned === "updated") return "stale";
  return "unchanged";
}

/* ── Orphan detection ── */

/**
 * A managed skill dir under `<skillsRoot>/` that we generated (marker present)
 * but which is not in `shippedNames` is an orphan. User-authored folders —
 * anything outside the `pagesmith-*` namespace, or a `pagesmith-*` folder without
 * our marker (e.g. a hand-authored skill) — are never touched.
 */
function findOrphans(skillsRoot: string, shippedNames: Set<string>): string[] {
  if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) return [];
  const orphans: string[] = [];
  for (const name of readdirSync(skillsRoot).sort()) {
    if (!name.startsWith(MANAGED_SKILL_PREFIX)) continue;
    if (shippedNames.has(name)) continue;
    const skillMd = join(skillsRoot, name, "SKILL.md");
    if (!existsSync(skillMd)) continue;
    if (!hasManagedMarker(readFileSync(skillMd, "utf-8"))) continue;
    orphans.push(name);
  }
  return orphans;
}

/* ── Filters ── */

/**
 * Filter discovered skills to those requested via `--only`. Names match with or
 * without the `pagesmith-` prefix (`--only core-setup` == `--only
 * pagesmith-core-setup`).
 */
function filterByOnly(skills: DiscoveredSkill[], only: string[] | undefined): DiscoveredSkill[] {
  if (!only || only.length === 0) return skills;
  const wanted = new Set<string>();
  for (const raw of only) {
    const token = raw.trim();
    if (!token) continue;
    wanted.add(token);
    wanted.add(token.startsWith(MANAGED_SKILL_PREFIX) ? token : `${MANAGED_SKILL_PREFIX}${token}`);
  }
  return skills.filter((s) => wanted.has(s.name));
}

/* ── Resolution helpers ── */

interface ResolvedPackage {
  pkg: string;
  root: string;
  version: string;
  skills: DiscoveredSkill[];
}

function resolvePackages(
  candidates: string[],
  cwd: string,
  packageRoots: Record<string, string> | undefined,
): ResolvedPackage[] {
  const resolved: ResolvedPackage[] = [];
  for (const pkg of candidates) {
    const root = packageRoots?.[pkg] ?? resolvePackageRoot(pkg, cwd);
    if (!root) continue;
    const skills = discoverSkills(root);
    if (skills.length === 0) continue;
    resolved.push({ pkg, root, version: readPackageVersion(root), skills });
  }
  return resolved;
}

/* ── Install ── */

export function installPackageSkills(options: InstallSkillsOptions = {}): InstallSkillsResult {
  const cwd = resolve(options.cwd ?? process.cwd());
  const check = options.check ?? false;
  const dryRun = options.dryRun ?? false;
  const write = !check && !dryRun;
  const mode: InstallSkillsResult["mode"] = check ? "check" : dryRun ? "dry-run" : "install";

  // Orphan baseline: every resolvable package (default set ∪ test overrides),
  // independent of the `--package` filter. This is what stops a `--package
  // @pagesmith/core` run from sweeping perfectly valid site/docs stubs.
  const unionCandidates = [
    ...new Set([...DEFAULT_PACKAGES, ...Object.keys(options.packageRoots ?? {})]),
  ];
  const resolvedUnion = resolvePackages(unionCandidates, cwd, options.packageRoots);
  const shippedNames = new Set<string>();
  for (const rp of resolvedUnion) for (const s of rp.skills) shippedNames.add(s.name);

  // Packages to actually (re)install from this run.
  const requestedExplicit = (options.packages?.length ?? 0) > 0;
  const requested = options.packages ?? unionCandidates;
  const requestedSet = new Set(requested);
  const targetPackages = resolvedUnion.filter((rp) => requestedSet.has(rp.pkg));
  const unresolved = requested.filter((pkg) => !resolvedUnion.some((rp) => rp.pkg === pkg));

  if (resolvedUnion.length === 0) {
    throw new Error(
      `No @pagesmith/* packages with a skills/ folder resolved from ${cwd}. ` +
        `Install @pagesmith/core, @pagesmith/site, or @pagesmith/docs first.`,
    );
  }

  const harnesses = options.harnesses ?? detectHarnesses(cwd);
  const agentsSkillsRoot = join(cwd, ".agents", "skills");
  const actions: SkillStubAction[] = [];
  const targetedSkillNames = new Set<string>();

  for (const rp of targetPackages) {
    const skills = filterByOnly(rp.skills, options.only);
    for (const skill of skills) {
      targetedSkillNames.add(skill.name);

      // Canonical pointer.
      const canonicalPath = join(agentsSkillsRoot, skill.name, "SKILL.md");
      const stubDir = dirname(canonicalPath);
      const canonicalContent = renderCanonicalStub({
        name: skill.name,
        description: skill.description,
        pkg: rp.pkg,
        version: rp.version,
        pointerPath: pointerToPackageSkill(stubDir, rp.root, skill.name),
        referencesPath: posixRelative(
          stubDir,
          join(resolve(rp.root), "skills", skill.name, "references"),
        ),
        packageReferencePath: posixRelative(stubDir, join(resolve(rp.root), "REFERENCE.md")),
      });
      const canonicalPlan = planWrite(canonicalPath, canonicalContent);
      if (write && canonicalPlan !== "unchanged") commitWrite(canonicalPath, canonicalContent);
      actions.push({
        path: relPath(cwd, canonicalPath),
        skill: skill.name,
        pkg: rp.pkg,
        kind: "canonical",
        status: check ? checkStatus(canonicalPlan) : canonicalPlan,
      });

      // Harness mirrors.
      for (const harness of harnesses) {
        const mirrorPath = join(
          cwd,
          HARNESS_PARENT_DIRS[harness],
          "skills",
          skill.name,
          "SKILL.md",
        );
        const mirrorContent = renderMirrorStub(skill.name, skill.description);
        const mirrorPlan = planWrite(mirrorPath, mirrorContent);
        if (write && mirrorPlan !== "unchanged") commitWrite(mirrorPath, mirrorContent);
        actions.push({
          path: relPath(cwd, mirrorPath),
          skill: skill.name,
          pkg: rp.pkg,
          kind: "mirror",
          harness,
          status: check ? checkStatus(mirrorPlan) : mirrorPlan,
        });
      }
    }
  }

  // Orphan sweep — canonical base plus every managed harness dir this run.
  const orphanRoots: Array<{ root: string; harness?: HarnessName }> = [{ root: agentsSkillsRoot }];
  for (const harness of harnesses) {
    orphanRoots.push({ root: join(cwd, HARNESS_PARENT_DIRS[harness], "skills"), harness });
  }
  for (const { root: skillsRoot, harness } of orphanRoots) {
    for (const orphanName of findOrphans(skillsRoot, shippedNames)) {
      const orphanDir = join(skillsRoot, orphanName);
      if (write) rmSync(orphanDir, { recursive: true, force: true });
      actions.push({
        path: relPath(cwd, join(orphanDir, "SKILL.md")),
        skill: orphanName,
        kind: "orphan",
        harness,
        status: check ? "orphaned" : "removed",
      });
    }
  }

  const ok = check
    ? !actions.some(
        (a) => a.status === "missing" || a.status === "stale" || a.status === "orphaned",
      )
    : true;

  return {
    cwd,
    mode,
    packages: targetPackages.map((rp) => ({ pkg: rp.pkg, version: rp.version })),
    unresolved,
    requestedExplicit,
    harnesses,
    skills: [...targetedSkillNames].sort(),
    actions,
    ok,
  };
}

/* ── Reporting ── */

/** Human-readable summary for CLI output (non-JSON mode). */
export function renderSkillsReport(result: InstallSkillsResult): string {
  const lines: string[] = [];
  const pkgSummary = result.packages.map((p) => `${p.pkg}@${p.version}`).join(", ") || "(none)";
  lines.push(
    `pagesmith skills ${result.mode} — ${result.skills.length} skill(s) from ${pkgSummary}; ` +
      `harnesses: ${["agents", ...result.harnesses].join(", ")}`,
  );
  // Only flag unresolved packages the caller asked for by name. When the run
  // used the default set, an uninstalled site/docs package is expected for a
  // legitimate core-only consumer, so stay quiet rather than emit `[skipped]`.
  if (result.requestedExplicit) {
    for (const pkg of result.unresolved) {
      lines.push(`  [skipped] ${pkg} (not installed)`);
    }
  }
  for (const action of result.actions) {
    const where = action.kind === "orphan" ? "orphan" : (action.harness ?? "agents");
    lines.push(`  [${action.status}] ${action.path} (${where})`);
  }
  if (result.mode === "check") {
    lines.push(result.ok ? "Stubs are up to date." : "Stubs are out of date (see above).");
  }
  return lines.join("\n");
}

/* ── CLI runner (shared by the `pagesmith` umbrella and the `pagesmith-core` alias) ── */

/** Flatten a cac option that may be a string, comma list, or repeated array. */
export function toList(input: string | string[] | undefined): string[] {
  if (input === undefined) return [];
  const raw = Array.isArray(input) ? input : [input];
  const out: string[] = [];
  for (const value of raw) {
    for (const part of String(value).split(",")) {
      const token = part.trim();
      if (token) out.push(token);
    }
  }
  return out;
}

function validateHarnessNames(raw: string[]): HarnessName[] {
  const out: HarnessName[] = [];
  for (const value of raw) {
    if (!ALL_HARNESSES.includes(value as HarnessName)) {
      throw new Error(`Invalid harness "${value}". Must be one of: ${ALL_HARNESSES.join(", ")}.`);
    }
    out.push(value as HarnessName);
  }
  return out;
}

export interface SkillsCliOptions {
  cwd?: string;
  packages?: string[];
  /** Raw harness tokens (validated here); empty = auto-detect. */
  harnesses?: string[];
  only?: string[];
  check?: boolean;
  dryRun?: boolean;
  json?: boolean;
  /** One-line note printed to stderr before running (deprecated-alias path). */
  deprecationNote?: string;
  /** Test hook forwarded to {@link installPackageSkills}. */
  packageRoots?: Record<string, string>;
}

/**
 * Parse normalized CLI inputs, run {@link installPackageSkills}, print a human
 * or JSON report, and return the process exit code (never throws, never exits).
 */
export function runSkillsInstallCli(options: SkillsCliOptions): number {
  if (options.deprecationNote) console.error(options.deprecationNote);
  const json = options.json ?? false;
  const cwd = resolve(options.cwd ?? process.cwd());

  const fail = (message: string): number => {
    if (json) {
      console.info(
        JSON.stringify({ schemaVersion: 1, command: "skills-install", ok: false, error: message }),
      );
    } else {
      console.error(message);
    }
    return 1;
  };

  let harnesses: HarnessName[] | undefined;
  try {
    const raw = options.harnesses ?? [];
    harnesses = raw.length > 0 ? validateHarnessNames(raw) : undefined;
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }

  if (options.only && options.only.length > 0) {
    const unknown = unknownOnlyNames(cwd, options.only, options.packageRoots);
    if (unknown.length > 0) {
      console.warn(`Warning: --only matched no shipped skill: ${unknown.join(", ")}`);
    }
  }

  let result: InstallSkillsResult;
  try {
    result = installPackageSkills({
      cwd,
      packages: options.packages && options.packages.length > 0 ? options.packages : undefined,
      harnesses,
      only: options.only && options.only.length > 0 ? options.only : undefined,
      check: options.check,
      dryRun: options.dryRun,
      packageRoots: options.packageRoots,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }

  if (json) {
    console.info(JSON.stringify({ schemaVersion: 1, command: "skills-install", ...result }));
  } else {
    console.info(renderSkillsReport(result));
  }
  return result.ok ? 0 : 1;
}

/* ── Helpers ── */

function relPath(cwd: string, absPath: string): string {
  const rel = absPath.startsWith(cwd) ? absPath.slice(cwd.length).replace(/^[\\/]+/, "") : absPath;
  return rel.split(/[\\/]+/).join("/");
}

/** Resolve requested `--only` names that match nothing shipped (for warnings). */
export function unknownOnlyNames(
  cwd: string,
  only: string[] | undefined,
  packageRoots?: Record<string, string>,
): string[] {
  if (!only || only.length === 0) return [];
  const unionCandidates = [...new Set([...DEFAULT_PACKAGES, ...Object.keys(packageRoots ?? {})])];
  const resolved = resolvePackages(unionCandidates, resolve(cwd), packageRoots);
  const shipped: DiscoveredSkill[] = [];
  for (const rp of resolved) shipped.push(...rp.skills);
  const matched = new Set(filterByOnly(shipped, only).map((s) => s.name));
  const unknown: string[] = [];
  for (const raw of only) {
    const token = raw.trim();
    if (!token) continue;
    const withPrefix = token.startsWith(MANAGED_SKILL_PREFIX)
      ? token
      : `${MANAGED_SKILL_PREFIX}${token}`;
    if (!matched.has(withPrefix) && !matched.has(token)) unknown.push(token);
  }
  return unknown;
}
