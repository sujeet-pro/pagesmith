import type { Command } from "cac";
import { runSkillsInstallCli, toList } from "@pagesmith/core/skills-install";

type SkillsOpts = {
  package?: string | string[];
  dir?: string;
  harness?: string | string[];
  only?: string | string[];
  check?: boolean;
  dryRun?: boolean;
  json?: boolean;
};

const USAGE =
  "Usage: pagesmith skills install [--package <pkg>] [--dir <path>] [--harness <list>] " +
  "[--only <name>] [--check] [--dry-run] [--json]";

/**
 * Umbrella `pagesmith skills install`. With no `--package` it auto-detects which
 * of `@pagesmith/core|site|docs` resolve from the consumer's `node_modules` and
 * installs versioned-pointer stubs for every skill each present package ships.
 */
export function registerSkillsCommand(command: Command): Command {
  return command
    .option(
      "--package <pkg>",
      "Pagesmith package to install skills from (repeatable; default: all resolvable)",
    )
    .option("--dir <path>", "Target repo directory (default: cwd)")
    .option(
      "--harness <list>",
      "Harnesses to mirror into: claude,cursor,codex,continue (default: auto-detect)",
    )
    .option("--only <name>", "Restrict to specific skills (repeatable or comma-separated)")
    .option("--check", "Verify only — nonzero exit on missing/stale/orphaned stubs")
    .option("--dry-run", "Show planned changes without writing")
    .option("--json", "Emit a machine-readable result")
    .action((action: string | undefined, options: SkillsOpts) => {
      if (action === undefined) {
        // `pagesmith skills` with no subcommand: print usage, exit clean.
        console.info(USAGE);
        return;
      }
      if (action !== "install") {
        console.error(`Unknown skills subcommand: "${action}". ${USAGE}`);
        process.exit(1);
      }
      const code = runSkillsInstallCli({
        cwd: options.dir,
        packages: toList(options.package),
        harnesses: toList(options.harness),
        only: toList(options.only),
        check: options.check,
        dryRun: options.dryRun,
        json: options.json,
      });
      if (code !== 0) process.exit(code);
    });
}
