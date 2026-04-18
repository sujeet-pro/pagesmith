import type { Command } from "cac";
import {
  intro,
  note,
  outro,
  promptMultiselect,
  resolveInteractive,
  withInteractivityFlags,
} from "../../cli-kit/index.js";
import { readCoreCliDefaults } from "../defaults.js";
import { installPackageSkills } from "../skills-install.js";

type SkillsOpts = {
  package?: string | string[];
  cwd?: string;
  dryRun?: boolean;
  overwrite?: boolean;
  yes?: boolean;
  nonInteractive?: boolean;
  interactive?: boolean;
};

function normalize(input: SkillsOpts["package"]): string[] | undefined {
  if (!input) return undefined;
  return Array.isArray(input) ? input : [input];
}

export function registerSkillsCommand(command: Command): Command {
  return withInteractivityFlags(command)
    .option(
      "--package <pkg>",
      "Pagesmith package to pull skills from (repeatable; default: core, site, docs)",
    )
    .option("--cwd <path>", "Project directory (default: cwd)")
    .option("--dry-run", "Show planned writes without changing files")
    .option("--no-overwrite", "Keep existing canonical skills unchanged")
    .action(async (options: SkillsOpts) => {
      const defaults = (await readCoreCliDefaults()).skills ?? {};
      const { interactive } = resolveInteractive(options);
      let packages = normalize(options.package) ?? defaults.packages;

      if (interactive && (!packages || packages.length === 0)) {
        intro("Pagesmith — install package skills");
        packages = await promptMultiselect<string>({
          message: "Which packages?",
          options: [
            { value: "@pagesmith/core", label: "@pagesmith/core" },
            { value: "@pagesmith/site", label: "@pagesmith/site" },
            { value: "@pagesmith/docs", label: "@pagesmith/docs" },
          ],
          initialValues: ["@pagesmith/core", "@pagesmith/site", "@pagesmith/docs"],
          required: true,
        });
      }

      const results = installPackageSkills({
        packages,
        cwd: options.cwd,
        dryRun: options.dryRun,
        overwriteCanonical: options.overwrite,
      });

      const summary = results
        .map((result) => `${result.status}: ${result.label} -> ${result.path}`)
        .join("\n");

      if (interactive) {
        note(summary || "(no skills)", options.dryRun ? "Dry run summary" : "Installed");
        outro(options.dryRun ? "Dry run complete." : "Skills installed.");
      } else {
        for (const result of results) {
          console.info(`${result.status}: ${result.label} -> ${result.path}`);
        }
      }
    });
}
