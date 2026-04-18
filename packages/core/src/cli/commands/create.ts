import type { Command } from "cac";
import { createProject, listTemplates } from "../../create/index.js";
import {
  CliError,
  assertValue,
  intro,
  outro,
  promptSelect,
  promptText,
  resolveInteractive,
  withInteractivityFlags,
} from "../../cli-kit/index.js";
import { readCoreCliDefaults } from "../defaults.js";

type CreateOpts = {
  template?: string;
  yes?: boolean;
  nonInteractive?: boolean;
  interactive?: boolean;
};

export function registerCreateCommand(command: Command): Command {
  return withInteractivityFlags(command)
    .option("--template <name>", "Template name")
    .action(async (projectName: string | undefined, options: CreateOpts) => {
      const defaults = await readCoreCliDefaults();
      const { interactive } = resolveInteractive(options);

      let finalName = projectName;
      let finalTemplate = options.template ?? defaults.create?.template;

      if (interactive) {
        intro("Pagesmith — create project");
        if (!finalName) {
          finalName = await promptText({
            message: "Project name",
            placeholder: "my-site",
            validate: (v) => (v && v.trim() ? undefined : "Project name is required"),
          });
        }
        if (!finalTemplate) {
          const templateNames = listTemplates()
            .split("\n")
            .map((line) => line.replace(/^\s*-\s*/, "").trim())
            .filter(Boolean);
          finalTemplate = await promptSelect({
            message: "Template",
            options: templateNames.map((name) => ({ value: name, label: name })),
            initialValue: defaults.create?.template,
          });
        }
      }

      const name = assertValue(finalName, {
        label: "Project name",
        flag: "<project-name>",
      });
      const template = assertValue(finalTemplate, {
        label: "--template",
        flag: "--template",
        configKey: "cli.core.create.template",
      });

      try {
        await createProject(name, template);
      } catch (error) {
        throw new CliError(error instanceof Error ? error.message : String(error), {
          cause: error,
        });
      }

      if (interactive) outro("Project created.");
    });
}
