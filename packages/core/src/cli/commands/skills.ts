import type { Command } from "cac";
import { runSkillsInstallCli, toList } from "../skills-install.js";

type SkillsOpts = {
  package?: string | string[];
  dir?: string;
  cwd?: string;
  harness?: string | string[];
  only?: string | string[];
  check?: boolean;
  dryRun?: boolean;
  json?: boolean;
};

const DEPRECATION_NOTE =
  '[deprecated] "pagesmith-core skills" is deprecated and will be removed in a future ' +
  'minor. Use "pagesmith skills install" instead. Forwarding to the pointer installer.';

/**
 * Deprecated alias for the umbrella `pagesmith skills install`. It forwards to
 * the exact same versioned-pointer installer, printing a one-line deprecation
 * note to stderr first. Retained for one minor version of back-compat.
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
    .action((options: SkillsOpts) => {
      const code = runSkillsInstallCli({
        cwd: options.dir ?? options.cwd,
        packages: toList(options.package),
        harnesses: toList(options.harness),
        only: toList(options.only),
        check: options.check,
        dryRun: options.dryRun,
        json: options.json,
        deprecationNote: DEPRECATION_NOTE,
      });
      if (code !== 0) process.exit(code);
    });
}
