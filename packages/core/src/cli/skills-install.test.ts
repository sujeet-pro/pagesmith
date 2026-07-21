import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import {
  detectHarnesses,
  discoverSkills,
  installPackageSkills,
  POINTER_MARKER_TOKEN,
  readFrontmatter,
  renderSkillsReport,
  resolvePackageRoot,
  runSkillsInstallCli,
  toList,
  type InstallSkillsResult,
} from "./skills-install.js";

/* ── Fixtures ── */

const tempDirs: string[] = [];

function tmp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

interface SkillSpec {
  name: string;
  description: string;
}

/** Build a fake package root with the given name, version, and skills. */
function makePackageRoot(pkg: string, version: string, skills: SkillSpec[]): string {
  const root = tmp("ps-pkg-");
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: pkg, version }));
  writeFileSync(join(root, "REFERENCE.md"), "# reference");
  for (const skill of skills) {
    const dir = join(root, "skills", skill.name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n# ${skill.name}\n\nbody\n`,
    );
  }
  return root;
}

function makeCwd(): string {
  const dir = tmp("ps-repo-");
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "consumer" }));
  return dir;
}

const CORE_SKILLS: SkillSpec[] = [
  { name: "pagesmith-core-setup", description: "Bootstrap core." },
  { name: "pagesmith-core-add-loader", description: "Add a loader." },
];
const SITE_SKILLS: SkillSpec[] = [{ name: "pagesmith-site-setup", description: "Bootstrap site." }];
const DOCS_SKILLS: SkillSpec[] = [{ name: "pagesmith-docs-setup", description: "Bootstrap docs." }];

function canonicalPath(cwd: string, name: string): string {
  return join(cwd, ".agents", "skills", name, "SKILL.md");
}

function statusFor(result: InstallSkillsResult, path: string): string | undefined {
  return result.actions.find((a) => a.path === path)?.status;
}

/** A full three-package fixture. */
function allPackageRoots(): Record<string, string> {
  return {
    "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
    "@pagesmith/site": makePackageRoot("@pagesmith/site", "0.10.0", SITE_SKILLS),
    "@pagesmith/docs": makePackageRoot("@pagesmith/docs", "0.10.0", DOCS_SKILLS),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/* ── readFrontmatter / discoverSkills / detectHarnesses ── */

describe("readFrontmatter", () => {
  it("extracts name and description", () => {
    const fm = readFrontmatter("---\nname: pagesmith-core-setup\ndescription: Hello.\n---\n# x");
    expect(fm.name).toBe("pagesmith-core-setup");
    expect(fm.description).toBe("Hello.");
  });

  it("returns empty object when no frontmatter present", () => {
    expect(readFrontmatter("# no frontmatter")).toEqual({});
  });
});

describe("discoverSkills", () => {
  it("lists shipped skills with descriptions, sorted", () => {
    const root = makePackageRoot("@pagesmith/core", "1.0.0", CORE_SKILLS);
    const skills = discoverSkills(root);
    expect(skills.map((s) => s.name)).toEqual([
      "pagesmith-core-add-loader",
      "pagesmith-core-setup",
    ]);
    expect(skills[0]!.description).toBe("Add a loader.");
  });

  it("returns [] when no skills/ folder exists", () => {
    const root = tmp("ps-empty-");
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "@pagesmith/core" }));
    expect(discoverSkills(root)).toEqual([]);
  });
});

describe("detectHarnesses", () => {
  it("detects a harness when its parent dir exists", () => {
    const cwd = makeCwd();
    mkdirSync(join(cwd, ".claude"), { recursive: true });
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    expect(detectHarnesses(cwd).sort()).toEqual(["claude", "cursor"]);
  });

  it("returns [] when no harness dirs exist", () => {
    expect(detectHarnesses(makeCwd())).toEqual([]);
  });
});

/* ── resolvePackageRoot (consumer-dir scoping) ── */

describe("resolvePackageRoot", () => {
  /** Install a fake package into `<consumer>/node_modules/<pkg>`. */
  function installInto(consumer: string, pkg: string, version: string): string {
    const root = join(consumer, "node_modules", ...pkg.split("/"));
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: pkg, version }));
    return root;
  }

  it("resolves a package from a consumer dir that has its OWN copy", () => {
    const consumer = makeCwd();
    const root = installInto(consumer, "@fixture/pkg", "1.2.3");
    const resolved = resolvePackageRoot("@fixture/pkg", consumer);
    expect(resolved).toBeDefined();
    expect(realpathSync(resolved!)).toBe(realpathSync(root));
  });

  it("returns undefined from a consumer dir that LACKS the package", () => {
    const consumer = makeCwd();
    expect(resolvePackageRoot("@fixture/pkg", consumer)).toBeUndefined();
  });

  it("scopes to the consumer cwd — never the CLI's own install location", () => {
    // `@pagesmith/core` IS resolvable from this test process (the CLI's install
    // location), but a fresh consumer dir does not have it. The buggy
    // `import.meta.resolve(spec, base)` ignored `base` and would resolve it
    // from the CLI location; the fixed `createRequire(<cwd>/…)` must not.
    const consumer = makeCwd();
    expect(resolvePackageRoot("@pagesmith/core", consumer)).toBeUndefined();
  });

  it("resolves the consumer's copy even when another consumer also has one", () => {
    const withPkg = makeCwd();
    const rootA = installInto(withPkg, "@fixture/pkg", "1.0.0");
    const withoutPkg = makeCwd();
    installInto(withoutPkg, "@fixture/other", "9.9.9");

    expect(realpathSync(resolvePackageRoot("@fixture/pkg", withPkg)!)).toBe(realpathSync(rootA));
    // The second consumer has a different package but not @fixture/pkg.
    expect(resolvePackageRoot("@fixture/pkg", withoutPkg)).toBeUndefined();
  });
});

/* ── Fresh install ── */

describe("installPackageSkills — fresh install", () => {
  it("writes canonical pointer stubs for every shipped skill across packages", () => {
    const cwd = makeCwd();
    const packageRoots = allPackageRoots();
    const result = installPackageSkills({ cwd, packageRoots });

    expect(result.mode).toBe("install");
    expect(result.skills.sort()).toEqual([
      "pagesmith-core-add-loader",
      "pagesmith-core-setup",
      "pagesmith-docs-setup",
      "pagesmith-site-setup",
    ]);
    expect(result.packages.map((p) => p.pkg).sort()).toEqual([
      "@pagesmith/core",
      "@pagesmith/docs",
      "@pagesmith/site",
    ]);

    const setupPath = canonicalPath(cwd, "pagesmith-core-setup");
    expect(existsSync(setupPath)).toBe(true);
    const content = readFileSync(setupPath, "utf-8");
    expect(content).toContain("name: pagesmith-core-setup");
    expect(content).toContain("description: Bootstrap core.");
    expect(content).toContain(
      `${POINTER_MARKER_TOKEN}: pkg=@pagesmith/core version=0.10.0 generator=@pagesmith/core@0.10.0`,
    );
    // The pointer link resolves to the real shipped SKILL.md.
    const linkMatch = /→ \[`([^`]+)`\]/.exec(content);
    expect(linkMatch).not.toBeNull();
    const resolvedPointer = resolve(dirname(setupPath), linkMatch![1]!);
    expect(resolvedPointer).toBe(
      join(packageRoots["@pagesmith/core"]!, "skills", "pagesmith-core-setup", "SKILL.md"),
    );
    expect(statusFor(result, ".agents/skills/pagesmith-core-setup/SKILL.md")).toBe("created");
  });

  it("writes harness mirrors that point back at the canonical stub", () => {
    const cwd = makeCwd();
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      harnesses: ["claude"],
    });
    const mirror = join(cwd, ".claude", "skills", "pagesmith-core-setup", "SKILL.md");
    expect(existsSync(mirror)).toBe(true);
    const content = readFileSync(mirror, "utf-8");
    expect(content).toContain("../../../.agents/skills/pagesmith-core-setup/SKILL.md");
    expect(content).toContain("pagesmith-skill-mirror");
    expect(result.harnesses).toEqual(["claude"]);
    expect(statusFor(result, ".claude/skills/pagesmith-core-setup/SKILL.md")).toBe("created");
  });

  it("auto-detects harnesses from existing dirs", () => {
    const cwd = makeCwd();
    mkdirSync(join(cwd, ".cursor"), { recursive: true });
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    expect(result.harnesses).toEqual(["cursor"]);
    expect(existsSync(join(cwd, ".cursor", "skills", "pagesmith-core-setup", "SKILL.md"))).toBe(
      true,
    );
  });

  it("restricts installation with --package while keeping other stubs untouched", () => {
    const cwd = makeCwd();
    const packageRoots = allPackageRoots();
    installPackageSkills({ cwd, packageRoots });
    // Re-install core only — site/docs are still resolvable, so not swept.
    const result = installPackageSkills({ cwd, packageRoots, packages: ["@pagesmith/core"] });
    expect(result.packages.map((p) => p.pkg)).toEqual(["@pagesmith/core"]);
    expect(existsSync(canonicalPath(cwd, "pagesmith-site-setup"))).toBe(true);
    expect(existsSync(canonicalPath(cwd, "pagesmith-docs-setup"))).toBe(true);
    expect(result.actions.some((a) => a.status === "removed")).toBe(false);
  });
});

/* ── Idempotence ── */

describe("installPackageSkills — idempotence", () => {
  it("reports unchanged on a re-run with the same version", () => {
    const cwd = makeCwd();
    const packageRoots = allPackageRoots();
    installPackageSkills({ cwd, packageRoots, harnesses: ["claude"] });
    const second = installPackageSkills({ cwd, packageRoots, harnesses: ["claude"] });
    expect(second.actions.every((a) => a.status === "unchanged")).toBe(true);
  });

  it("updates stubs when the installed version bumps", () => {
    const cwd = makeCwd();
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    const bumped = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.11.0", CORE_SKILLS),
      },
    });
    expect(statusFor(bumped, ".agents/skills/pagesmith-core-setup/SKILL.md")).toBe("updated");
    const content = readFileSync(canonicalPath(cwd, "pagesmith-core-setup"), "utf-8");
    expect(content).toContain("version=0.11.0 generator=@pagesmith/core@0.11.0");
  });
});

/* ── Orphan sweep ── */

describe("installPackageSkills — orphan sweep", () => {
  it("removes managed stubs whose skill no longer ships", () => {
    const cwd = makeCwd();
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", [
          ...CORE_SKILLS,
          { name: "pagesmith-core-old", description: "Going away." },
        ]),
      },
    });
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-old"))).toBe(true);
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.11.0", CORE_SKILLS),
      },
    });
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-old"))).toBe(false);
    expect(statusFor(result, ".agents/skills/pagesmith-core-old/SKILL.md")).toBe("removed");
  });

  it("sweeps stubs of a package that is no longer installed", () => {
    const cwd = makeCwd();
    const full = allPackageRoots();
    installPackageSkills({ cwd, packageRoots: full });
    expect(existsSync(canonicalPath(cwd, "pagesmith-docs-setup"))).toBe(true);
    // docs no longer resolvable → its stub is an orphan.
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": full["@pagesmith/core"]!,
        "@pagesmith/site": full["@pagesmith/site"]!,
      },
    });
    expect(existsSync(canonicalPath(cwd, "pagesmith-docs-setup"))).toBe(false);
    expect(statusFor(result, ".agents/skills/pagesmith-docs-setup/SKILL.md")).toBe("removed");
  });

  it("never touches non-managed skill folders (e.g. prj-foo)", () => {
    const cwd = makeCwd();
    const prjDir = join(cwd, ".agents", "skills", "prj-foo");
    mkdirSync(prjDir, { recursive: true });
    writeFileSync(join(prjDir, "SKILL.md"), "---\nname: prj-foo\ndescription: mine\n---\n");
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    expect(existsSync(join(prjDir, "SKILL.md"))).toBe(true);
  });

  it("does not sweep a pagesmith-* folder that lacks our marker", () => {
    const cwd = makeCwd();
    const customDir = join(cwd, ".agents", "skills", "pagesmith-custom");
    mkdirSync(customDir, { recursive: true });
    writeFileSync(
      join(customDir, "SKILL.md"),
      "---\nname: pagesmith-custom\ndescription: hand\n---\n",
    );
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    expect(existsSync(join(customDir, "SKILL.md"))).toBe(true);
  });

  it("does not sweep a pagesmith-* folder that only mentions the marker token in prose", () => {
    const cwd = makeCwd();
    const customDir = join(cwd, ".agents", "skills", "pagesmith-guide");
    mkdirSync(customDir, { recursive: true });
    // Body contains the bare `pagesmith-skill-pointer` token as prose, but NOT
    // the generated `<!-- pagesmith-skill-pointer: … -->` marker comment. A
    // substring match would wrongly sweep this hand-authored skill.
    writeFileSync(
      join(customDir, "SKILL.md"),
      "---\nname: pagesmith-guide\ndescription: hand\n---\n\n" +
        "This explains how the pagesmith-skill-pointer marker works, in prose.\n",
    );
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    expect(existsSync(join(customDir, "SKILL.md"))).toBe(true);
  });

  it("does not orphan skills merely excluded by --only", () => {
    const cwd = makeCwd();
    const packageRoots = {
      "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
    };
    installPackageSkills({ cwd, packageRoots });
    const result = installPackageSkills({ cwd, packageRoots, only: ["pagesmith-core-setup"] });
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-add-loader"))).toBe(true);
    expect(result.actions.some((a) => a.status === "removed")).toBe(false);
    expect(result.skills).toEqual(["pagesmith-core-setup"]);
  });
});

/* ── --only ── */

describe("installPackageSkills — --only", () => {
  it("installs only the requested skill (name with or without prefix)", () => {
    const cwd = makeCwd();
    const packageRoots = {
      "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
    };
    installPackageSkills({ cwd, packageRoots, only: ["core-setup"] });
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-setup"))).toBe(true);
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-add-loader"))).toBe(false);
  });
});

/* ── dry-run ── */

describe("installPackageSkills — dry-run", () => {
  it("reports planned actions without writing", () => {
    const cwd = makeCwd();
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      dryRun: true,
    });
    expect(result.mode).toBe("dry-run");
    expect(statusFor(result, ".agents/skills/pagesmith-core-setup/SKILL.md")).toBe("created");
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-setup"))).toBe(false);
  });
});

/* ── --check ── */

describe("installPackageSkills — --check", () => {
  it("reports missing stubs and is not ok before install", () => {
    const cwd = makeCwd();
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      check: true,
    });
    expect(result.mode).toBe("check");
    expect(result.ok).toBe(false);
    expect(statusFor(result, ".agents/skills/pagesmith-core-setup/SKILL.md")).toBe("missing");
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-setup"))).toBe(false);
  });

  it("is ok after a matching install", () => {
    const cwd = makeCwd();
    const packageRoots = allPackageRoots();
    installPackageSkills({ cwd, packageRoots });
    const result = installPackageSkills({ cwd, packageRoots, check: true });
    expect(result.ok).toBe(true);
    expect(result.actions.every((a) => a.status === "unchanged")).toBe(true);
  });

  it("reports stale stubs after a version bump", () => {
    const cwd = makeCwd();
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.11.0", CORE_SKILLS),
      },
      check: true,
    });
    expect(result.ok).toBe(false);
    expect(statusFor(result, ".agents/skills/pagesmith-core-setup/SKILL.md")).toBe("stale");
  });

  it("reports orphaned managed stubs without deleting them", () => {
    const cwd = makeCwd();
    installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", [
          ...CORE_SKILLS,
          { name: "pagesmith-core-old", description: "Going away." },
        ]),
      },
    });
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.11.0", CORE_SKILLS),
      },
      check: true,
    });
    expect(result.ok).toBe(false);
    expect(statusFor(result, ".agents/skills/pagesmith-core-old/SKILL.md")).toBe("orphaned");
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-old"))).toBe(true);
  });
});

/* ── Result shape + errors ── */

describe("installPackageSkills — result shape + errors", () => {
  it("returns a machine-readable envelope with relative action paths", () => {
    const cwd = makeCwd();
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      harnesses: ["claude", "codex"],
    });
    expect(result).toMatchObject({ mode: "install", harnesses: ["claude", "codex"], ok: true });
    for (const action of result.actions) {
      expect(action).toHaveProperty("path");
      expect(action).toHaveProperty("skill");
      expect(action).toHaveProperty("kind");
      expect(action).toHaveProperty("status");
      expect(action.path.startsWith("/")).toBe(false);
    }
  });

  it("throws when no @pagesmith/* package resolves", () => {
    expect(() => installPackageSkills({ cwd: makeCwd(), packageRoots: {} })).toThrow(
      /No @pagesmith\/\* packages/,
    );
  });
});

/* ── renderSkillsReport — unresolved packages ── */

describe("renderSkillsReport — unresolved packages", () => {
  it("stays quiet about unresolved DEFAULT packages (core-only consumer)", () => {
    const cwd = makeCwd();
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    expect(result.requestedExplicit).toBe(false);
    expect(result.unresolved.sort()).toEqual(["@pagesmith/docs", "@pagesmith/site"]);
    expect(renderSkillsReport(result)).not.toContain("[skipped]");
  });

  it("flags an explicitly requested package that is not installed", () => {
    const cwd = makeCwd();
    const result = installPackageSkills({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      packages: ["@pagesmith/core", "@pagesmith/site"],
    });
    expect(result.requestedExplicit).toBe(true);
    expect(result.unresolved).toContain("@pagesmith/site");
    expect(renderSkillsReport(result)).toContain("[skipped] @pagesmith/site");
  });
});

/* ── runSkillsInstallCli ── */

describe("runSkillsInstallCli", () => {
  it("returns 0 on a successful install", () => {
    const cwd = makeCwd();
    vi.spyOn(console, "info").mockImplementation(() => {});
    const code = runSkillsInstallCli({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
    });
    expect(code).toBe(0);
    expect(existsSync(canonicalPath(cwd, "pagesmith-core-setup"))).toBe(true);
  });

  it("returns 1 on a failing --check and prints the deprecation note to stderr", () => {
    const cwd = makeCwd();
    vi.spyOn(console, "info").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const code = runSkillsInstallCli({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      check: true,
      deprecationNote: "[deprecated] use pagesmith skills install",
    });
    expect(code).toBe(1);
    expect(errSpy).toHaveBeenCalledWith("[deprecated] use pagesmith skills install");
  });

  it("emits a JSON envelope under --json", () => {
    const cwd = makeCwd();
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    runSkillsInstallCli({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      json: true,
    });
    const payload = JSON.parse(logSpy.mock.calls.at(-1)![0] as string);
    expect(payload).toMatchObject({ schemaVersion: 1, command: "skills-install", ok: true });
  });

  it("returns 1 on an invalid harness name", () => {
    const cwd = makeCwd();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const code = runSkillsInstallCli({
      cwd,
      packageRoots: {
        "@pagesmith/core": makePackageRoot("@pagesmith/core", "0.10.0", CORE_SKILLS),
      },
      harnesses: ["bogus"],
    });
    expect(code).toBe(1);
  });
});

/* ── toList ── */

describe("toList", () => {
  it("flattens strings, comma lists, and repeated arrays", () => {
    expect(toList(undefined)).toEqual([]);
    expect(toList("a,b")).toEqual(["a", "b"]);
    expect(toList(["a", "b,c"])).toEqual(["a", "b", "c"]);
    expect(toList(" a , , b ")).toEqual(["a", "b"]);
  });
});
