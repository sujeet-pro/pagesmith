/**
 * Install consumer-facing skills shipped by Pagesmith packages into the
 * project's `.agents/skills/` (canonical) with thin wrappers for
 * `.claude/skills/` and `.cursor/skills/`.
 *
 * Canonical location is `.agents/skills/<name>/SKILL.md`; wrapper files
 * forward Claude and Cursor to the canonical copy.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export type InstallSkillsOptions = {
  /** Packages to install skills from. Defaults to @pagesmith/core, @pagesmith/site, @pagesmith/docs. */
  packages?: string[];
  /** Project directory (default: process.cwd()). */
  cwd?: string;
  /** If true, only report actions without writing files. */
  dryRun?: boolean;
  /** If true, overwrite existing canonical skills. Default: true. Wrappers always refresh. */
  overwriteCanonical?: boolean;
};

export type InstallSkillsResult = {
  path: string;
  status: "created" | "updated" | "unchanged" | "skipped";
  label: string;
};

const DEFAULT_PACKAGES = ["@pagesmith/core", "@pagesmith/site", "@pagesmith/docs"];

function readFrontmatter(content: string): { name?: string; description?: string } {
  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  if (!match) return {};
  const body = match[1]!;
  const get = (key: string): string | undefined => {
    const re = new RegExp(`^${key}:\\s*(.+)$`, "m");
    const m = re.exec(body);
    return m?.[1]?.trim();
  };
  return { name: get("name"), description: get("description") };
}

function renderWrapper(
  name: string,
  description: string | undefined,
  canonicalPath: string,
): string {
  const fm = ["---", `name: ${name}`];
  if (description) fm.push(`description: ${description}`);
  fm.push("---", "");
  fm.push(
    `Canonical skill lives at \`${canonicalPath}\`. Read that file and follow it exactly.`,
    "",
  );
  return fm.join("\n");
}

function findPackageSkillsDir(pkg: string, cwd: string): string | undefined {
  try {
    const require = createResolver(cwd);
    const pkgJsonPath = require(`${pkg}/package.json`);
    const pkgDir = dirname(pkgJsonPath);
    const skillsDir = join(pkgDir, "skills");
    if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
      return skillsDir;
    }
  } catch {
    // package not installed — fall through
  }
  return undefined;
}

function createResolver(cwd: string): (specifier: string) => string {
  const moduleRoot = join(cwd, "package.json");
  const rootUrl = new URL(`file://${moduleRoot}`);
  return (specifier: string): string => {
    const url = import.meta.resolve(specifier, rootUrl.toString());
    return fileURLToPath(url);
  };
}

function listSkillFolders(skillsDir: string): string[] {
  return readdirSync(skillsDir).filter((name) => {
    const full = join(skillsDir, name);
    return statSync(full).isDirectory() && existsSync(join(full, "SKILL.md"));
  });
}

function ensureDir(path: string, dryRun: boolean): void {
  if (dryRun) return;
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function writeFile(
  path: string,
  content: string,
  dryRun: boolean,
): "created" | "updated" | "unchanged" {
  if (existsSync(path)) {
    const existing = readFileSync(path, "utf-8");
    if (existing === content) return "unchanged";
    if (!dryRun) writeFileSync(path, content);
    return "updated";
  }
  if (!dryRun) writeFileSync(path, content);
  return "created";
}

export function installPackageSkills(options: InstallSkillsOptions = {}): InstallSkillsResult[] {
  const cwd = resolve(options.cwd ?? process.cwd());
  const packages = options.packages ?? DEFAULT_PACKAGES;
  const dryRun = options.dryRun ?? false;
  const overwriteCanonical = options.overwriteCanonical ?? true;
  const results: InstallSkillsResult[] = [];

  for (const pkg of packages) {
    const skillsDir = findPackageSkillsDir(pkg, cwd);
    if (!skillsDir) {
      results.push({
        path: pkg,
        status: "skipped",
        label: `${pkg} (not installed or no skills/ folder)`,
      });
      continue;
    }

    for (const skillName of listSkillFolders(skillsDir)) {
      const sourceSkillPath = join(skillsDir, skillName, "SKILL.md");
      const sourceContent = readFileSync(sourceSkillPath, "utf-8");

      // 1. Canonical copy under .agents/skills/
      const canonicalDir = join(cwd, ".agents", "skills", skillName);
      const canonicalPath = join(canonicalDir, "SKILL.md");
      ensureDir(canonicalDir, dryRun);
      if (overwriteCanonical || !existsSync(canonicalPath)) {
        const status = writeFile(canonicalPath, sourceContent, dryRun);
        results.push({ path: canonicalPath, status, label: `${pkg} -> ${skillName}` });
      } else {
        results.push({
          path: canonicalPath,
          status: "unchanged",
          label: `${pkg} -> ${skillName}`,
        });
      }

      // 2. Thin wrappers for Claude and Cursor
      const { name: fmName, description } = readFrontmatter(sourceContent);
      const wrapperName = fmName ?? skillName;
      const relCanonical = `.agents/skills/${skillName}/SKILL.md`;
      const wrapperBody = renderWrapper(wrapperName, description, relCanonical);

      for (const agentDir of [".claude/skills", ".cursor/skills"]) {
        const wrapperDir = join(cwd, agentDir, skillName);
        const wrapperPath = join(wrapperDir, "SKILL.md");
        ensureDir(wrapperDir, dryRun);
        const status = writeFile(wrapperPath, wrapperBody, dryRun);
        results.push({ path: wrapperPath, status, label: `${basename(agentDir)}:${skillName}` });
      }
    }
  }

  return results;
}
