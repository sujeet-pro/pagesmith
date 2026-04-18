import type { Command } from "cac";
import { installAiArtifacts } from "../../ai/index.js";
import {
  intro,
  log,
  note,
  outro,
  promptConfirm,
  promptMultiselect,
  promptSelect,
  resolveInteractive,
  withInteractivityFlags,
} from "../../cli-kit/index.js";
import { readCoreCliDefaults } from "../defaults.js";

type Assistant = "claude" | "codex" | "gemini";
type Scope = "project" | "user";
type Profile = "default" | "docs";

type AiOpts = {
  assistant?: string | string[];
  scope?: string;
  profile?: string;
  cwd?: string;
  homeDir?: string;
  skillName?: string;
  llms?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  nonInteractive?: boolean;
  interactive?: boolean;
};

function asAssistant(value: string): Assistant {
  if (value === "claude" || value === "codex" || value === "gemini") return value;
  throw new Error(`--assistant must be one of: claude, codex, gemini (got "${value}")`);
}

function asScope(value: string | undefined): Scope | undefined {
  if (value === undefined) return undefined;
  if (value === "project" || value === "user") return value;
  throw new Error(`--scope must be one of: project, user (got "${value}")`);
}

function asProfile(value: string | undefined): Profile | undefined {
  if (value === undefined) return undefined;
  if (value === "default" || value === "docs") return value;
  throw new Error(`--profile must be one of: default, docs (got "${value}")`);
}

function normalizeAssistants(input: AiOpts["assistant"]): Assistant[] | undefined {
  if (!input) return undefined;
  const list = Array.isArray(input) ? input : [input];
  if (list.length === 0) return undefined;
  return list.map(asAssistant);
}

export function registerAiCommand(command: Command): Command {
  return withInteractivityFlags(command)
    .option("--assistant <name>", "claude|codex|gemini (repeatable; default: all)")
    .option("--scope <scope>", "project|user (default: project)")
    .option("--profile <profile>", "default|docs (default: default)")
    .option("--cwd <path>", "Project directory for project-scope installs")
    .option("--home-dir <path>", "Home directory override for user-scope installs")
    .option("--skill-name <name>", "Custom skill/command name")
    .option("--no-llms", "Skip llms.txt / llms-full.txt generation")
    .option("--dry-run", "Show planned writes without changing files")
    .action(async (options: AiOpts) => {
      const defaults = (await readCoreCliDefaults()).ai ?? {};
      const { interactive } = resolveInteractive(options);

      let assistants = normalizeAssistants(options.assistant) ?? defaults.assistants;
      let scope: Scope | undefined = asScope(options.scope) ?? defaults.scope;
      let profile: Profile | undefined = asProfile(options.profile) ?? defaults.profile;
      const skillName = options.skillName ?? defaults.skillName;
      let includeLlms = options.llms ?? defaults.includeLlms;

      if (interactive) {
        intro("Pagesmith — install AI artifacts");
        if (!assistants || assistants.length === 0) {
          assistants = await promptMultiselect<Assistant>({
            message: "Which assistants?",
            options: [
              { value: "claude", label: "Claude" },
              { value: "codex", label: "Codex" },
              { value: "gemini", label: "Gemini" },
            ],
            initialValues: ["claude", "codex", "gemini"],
            required: true,
          });
        }
        if (!scope) {
          scope = await promptSelect<Scope>({
            message: "Scope",
            options: [
              { value: "project", label: "Project", hint: "write into the current repo" },
              { value: "user", label: "User", hint: "write into the user home directory" },
            ],
            initialValue: "project",
          });
        }
        if (!profile) {
          profile = await promptSelect<Profile>({
            message: "Profile",
            options: [
              { value: "default", label: "Default" },
              { value: "docs", label: "Docs", hint: "optimized for @pagesmith/docs projects" },
            ],
            initialValue: "default",
          });
        }
        if (includeLlms === undefined && scope === "project") {
          includeLlms = await promptConfirm({
            message: "Generate llms.txt / llms-full.txt?",
            initialValue: true,
          });
        }
      } else if (!assistants || assistants.length === 0) {
        log.warn(
          "No --assistant flag in non-interactive mode; defaulting to all (claude, codex, gemini).",
        );
      }

      const results = installAiArtifacts({
        assistants,
        scope,
        profile,
        cwd: options.cwd,
        homeDir: options.homeDir,
        skillName,
        includeLlms,
        dryRun: options.dryRun,
      });

      const summary = results
        .map((result) => `${result.status}: ${result.label} -> ${result.path}`)
        .join("\n");
      if (interactive) {
        note(summary || "(no artifacts)", options.dryRun ? "Dry run summary" : "Installed");
        outro(options.dryRun ? "Dry run complete." : "AI artifacts installed.");
      } else {
        for (const result of results) {
          console.info(`${result.status}: ${result.label} -> ${result.path}`);
        }
      }
    });
}
