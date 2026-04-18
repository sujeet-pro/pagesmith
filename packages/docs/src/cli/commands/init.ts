import type { Command } from "cac";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  assertValue,
  intro,
  log,
  note,
  outro,
  promptConfirm,
  promptText,
  resolveInteractive,
  spinner,
  tasks,
  withConfigFlag,
  withInteractivityFlags,
} from "@pagesmith/core/cli-kit";
import { toTitleCase } from "../../config.js";
import { resolveInitDefaults } from "../defaults.js";
import { type InitAnswers, updateInitConfigFile } from "../init-fs.js";

type InitOpts = {
  ai?: boolean;
  config?: string;
  name?: string;
  title?: string;
  origin?: string;
  basePath?: string;
  contentDir?: string;
  search?: boolean;
  starterContent?: boolean;
  yes?: boolean;
  nonInteractive?: boolean;
  interactive?: boolean;
  llms?: boolean;
};

function scriptCommand(command: "dev" | "build" | "preview", configPath?: string): string {
  const base = `pagesmith-docs ${command}`;
  if (!configPath || configPath === "pagesmith.config.json5") return base;
  return `${base} --config ${configPath}`;
}

function ensureDocsScripts(projectDir: string, configPath?: string): string[] {
  const pkgPath = resolve(projectDir, "package.json");
  if (!existsSync(pkgPath)) return [];

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = { ...(pkg.scripts ?? {}) };
    const desired = {
      "docs:dev": scriptCommand("dev", configPath),
      "docs:build": scriptCommand("build", configPath),
      "docs:preview": scriptCommand("preview", configPath),
    };
    const created: string[] = [];
    let changed = false;

    for (const [name, value] of Object.entries(desired)) {
      if (!scripts[name]) {
        scripts[name] = value;
        created.push(`package.json#scripts.${name}`);
        changed = true;
      }
    }

    if (!changed) return created;

    pkg.scripts = scripts;
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    return created;
  } catch {
    return [];
  }
}

function writeIfMissing(filePath: string, content: string): boolean {
  if (existsSync(filePath)) return false;
  writeFileSync(filePath, content);
  return true;
}

const STARTER_FILES: Array<{ rel: string; content: (answers: InitAnswers) => string }> = [
  {
    rel: "README.md",
    content: (a) =>
      [
        "---",
        `title: ${a.title}`,
        `tagline: Welcome to ${a.title}`,
        `description: ${a.title} documentation`,
        "actions:",
        "  - text: Get Started",
        "    link: /guide/getting-started",
        "    theme: brand",
        "  - text: Reference",
        "    link: /reference/overview",
        "    theme: alt",
        "features:",
        "  - title: Convention-based docs",
        "    details: Organize docs with folders, README.md pages, and meta.json5 ordering.",
        "  - title: GitHub Pages friendly",
        "    details: Defaults to a GitHub Pages base path using the repo name.",
        "---",
        "",
        "# Welcome",
        "",
        "Start from the guide, then expand the reference as your project grows.",
        "",
      ].join("\n"),
  },
  {
    rel: "guide/meta.json5",
    content: () =>
      [
        "{",
        "  displayName: 'Guide',",
        "  orderBy: 'manual',",
        "  items: ['getting-started', 'configuration'],",
        "}",
        "",
      ].join("\n"),
  },
  {
    rel: "guide/README.md",
    content: () =>
      [
        "---",
        "title: Guide",
        "description: Start here to learn how this project is documented.",
        "---",
        "",
        "# Guide",
        "",
        "Use this section for onboarding, setup, and configuration walkthroughs.",
        "",
      ].join("\n"),
  },
  {
    rel: "guide/getting-started/README.md",
    content: () =>
      [
        "---",
        "title: Getting Started",
        "description: Learn the basics of this project and its docs site.",
        "---",
        "",
        "# Getting Started",
        "",
        "Explain how to install, run, and explore the project here.",
        "",
      ].join("\n"),
  },
  {
    rel: "guide/configuration/README.md",
    content: () =>
      [
        "---",
        "title: Configuration",
        "description: Document the key configuration and setup decisions for this project.",
        "---",
        "",
        "# Configuration",
        "",
        "Document environment variables, config files, and deployment expectations here.",
        "",
      ].join("\n"),
  },
  {
    rel: "reference/meta.json5",
    content: () =>
      [
        "{",
        "  displayName: 'Reference',",
        "  orderBy: 'manual',",
        "  items: ['overview', 'api'],",
        "}",
        "",
      ].join("\n"),
  },
  {
    rel: "reference/README.md",
    content: () =>
      [
        "---",
        "title: Reference",
        "description: API and implementation reference for this project.",
        "---",
        "",
        "# Reference",
        "",
        "Use this section for API details, commands, and integration notes.",
        "",
      ].join("\n"),
  },
  {
    rel: "reference/overview/README.md",
    content: () =>
      [
        "---",
        "title: Overview",
        "description: A high-level reference map for the project.",
        "---",
        "",
        "# Overview",
        "",
        "Summarize the major modules, packages, or subsystems here.",
        "",
      ].join("\n"),
  },
  {
    rel: "reference/api/README.md",
    content: () =>
      [
        "---",
        "title: API",
        "description: Public API reference for this project.",
        "---",
        "",
        "# API",
        "",
        "List commands, exports, endpoints, or interfaces here.",
        "",
      ].join("\n"),
  },
];

async function promptInteractive(defaults: InitAnswers, version: string): Promise<InitAnswers> {
  intro(`Pagesmith Docs v${version}`);

  const name = await promptText({
    message: "Project name",
    placeholder: defaults.name,
    defaultValue: defaults.name,
  });
  const titleFallback =
    defaults.title === toTitleCase(defaults.name) ? toTitleCase(name) : defaults.title;
  const title = await promptText({
    message: "Site title",
    placeholder: titleFallback,
    defaultValue: titleFallback,
  });
  const origin = await promptText({
    message: "Site origin",
    placeholder: defaults.origin,
    defaultValue: defaults.origin,
  });
  const basePath = await promptText({
    message: "Base path",
    placeholder: defaults.basePath,
    defaultValue: defaults.basePath,
  });
  const contentDir = await promptText({
    message: "Content directory",
    placeholder: defaults.contentDir,
    defaultValue: defaults.contentDir,
  });
  const search = await promptConfirm({
    message: "Enable search?",
    initialValue: defaults.search,
  });
  const ai = await promptConfirm({
    message: "Install AI integrations?",
    initialValue: defaults.ai,
  });
  const starterContent = await promptConfirm({
    message: "Create starter content?",
    initialValue: defaults.starterContent,
  });

  return {
    name,
    title,
    origin,
    basePath,
    contentDir,
    copyrightStartYear: defaults.copyrightStartYear,
    search,
    ai,
    starterContent,
  };
}

export function registerInitCommand(command: Command, version: string): Command {
  return withConfigFlag(withInteractivityFlags(command))
    .option("--ai", "Install AI integrations (skills, guidelines)")
    .option("--no-llms", "Skip llms.txt / llms-full.txt generation during AI install")
    .option("--name <value>", "Project name used in docs metadata")
    .option("--title <value>", "Site title used in docs metadata")
    .option("--origin <url>", "Canonical site origin (default: detected GitHub Pages host)")
    .option("--base-path <path>", "Base URL path (default: /<repo-name>)")
    .option("--content-dir <path>", "Docs content directory (default: docs)")
    .option("--search", "Enable built-in search")
    .option("--no-search", "Disable built-in search")
    .option("--starter-content", "Create starter guide/reference pages")
    .option("--no-starter-content", "Skip starter content")
    .action(async (options: InitOpts) => {
      const projectDir = resolve(".");
      const { interactive, reason } = resolveInteractive(options);

      // Spinner around git/network probing keeps the CLI responsive even
      // when the optional GitHub Pages origin probe is slow.
      const detectSpinner = spinner();
      detectSpinner.start("Inspecting project (git, package.json, existing config)…");
      let resolved;
      try {
        resolved = await resolveInitDefaults({
          projectDir,
          configPath: options.config,
        });
      } catch (err) {
        detectSpinner.error("Failed to inspect project");
        throw err;
      }
      detectSpinner.stop("Project inspected");

      const merged: InitAnswers = { ...resolved.defaults };
      if (options.name) merged.name = options.name;
      if (options.title) merged.title = options.title;
      if (options.origin) merged.origin = options.origin;
      if (options.basePath) merged.basePath = options.basePath;
      if (options.contentDir) merged.contentDir = options.contentDir;
      if (typeof options.search === "boolean") merged.search = options.search;
      if (typeof options.starterContent === "boolean")
        merged.starterContent = options.starterContent;
      if (options.ai) merged.ai = true;

      let answers: InitAnswers;
      if (interactive) {
        answers = await promptInteractive(merged, version);
      } else {
        log.info(`Running non-interactively (${reason}); using detected defaults.`);
        // Strict mode: fail loudly if required values aren't satisfiable.
        merged.name = assertValue(merged.name, {
          label: "Project name",
          flag: "--name",
          configKey: "name",
        });
        merged.origin = assertValue(merged.origin, {
          label: "Site origin",
          flag: "--origin",
          configKey: "origin",
        });
        merged.basePath = assertValue(merged.basePath, {
          label: "Base path",
          flag: "--base-path",
          configKey: "basePath",
        });
        answers = merged;
      }

      if (resolved.configIsCode) {
        log.warn(
          `Detected ${resolved.configPath} (TypeScript/JS config). Init writes back to JSON5 only.`,
        );
        log.warn("Update your TS/JS config manually to match the answers above.");
      }

      const created: string[] = [];
      const updated: string[] = [];

      const fsTasks: Parameters<typeof tasks>[0] = [];

      // 1. Config file: write JSON5 form (TS/JS configs are user-owned and
      //    will not be re-emitted by init; the warning above already covers it).
      const writableConfigPath =
        resolved.configIsCode || resolved.configPath.endsWith(".json5")
          ? resolved.configPath
          : resolved.configPath;
      // Skip the actual config write when source is a TS/JS file the user owns.
      if (!resolved.configIsCode) {
        fsTasks.push({
          title: "Write pagesmith config",
          task: async () => {
            const result = updateInitConfigFile({
              projectDir,
              configPath: writableConfigPath,
              answers,
            });
            if (result.created) {
              created.push(writableConfigPath);
              return "Created config";
            }
            if (result.updated) {
              updated.push(writableConfigPath);
              return "Updated config";
            }
            return "Config already up to date";
          },
        });
      }

      // 2. package.json scripts
      fsTasks.push({
        title: "Ensure docs:* scripts in package.json",
        task: async () => {
          const entries = ensureDocsScripts(projectDir, writableConfigPath);
          created.push(...entries);
          return entries.length === 0 ? "No script changes needed" : `Added ${entries.length}`;
        },
      });

      // 3. Content directories + starter files
      fsTasks.push({
        title: "Scaffold content directory",
        task: async () => {
          const contentRoot = resolve(answers.contentDir);
          const dirs = [
            contentRoot,
            resolve(contentRoot, "guide"),
            resolve(contentRoot, "reference"),
            resolve(contentRoot, "guide", "getting-started"),
            resolve(contentRoot, "guide", "configuration"),
            resolve(contentRoot, "reference", "overview"),
            resolve(contentRoot, "reference", "api"),
          ];
          for (const dir of dirs) {
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          }
          if (!answers.starterContent) return "Skipped starter files";

          for (const file of STARTER_FILES) {
            const filePath = resolve(contentRoot, file.rel);
            if (writeIfMissing(filePath, file.content(answers))) {
              created.push(`${answers.contentDir}/${file.rel}`);
            }
          }
          return "Starter files written";
        },
      });

      // 4. AI integrations (optional)
      if (answers.ai) {
        fsTasks.push({
          title: "Install AI integrations",
          task: async () => {
            const { installAiArtifacts } = await import("@pagesmith/core/ai");
            const results = installAiArtifacts({
              assistants: "all",
              scope: "project",
              profile: "docs",
              includeLlms: options.llms !== false,
            });
            for (const result of results) {
              created.push(result.path);
            }
            return `${results.length} artifact(s) installed`;
          },
        });
      }

      await tasks(fsTasks);

      const summaryLines: string[] = [];
      if (created.length > 0) {
        summaryLines.push("Created:");
        summaryLines.push(...created.map((file) => `  ${file}`));
      }
      if (updated.length > 0) {
        if (summaryLines.length > 0) summaryLines.push("");
        summaryLines.push("Updated:");
        summaryLines.push(...updated.map((file) => `  ${file}`));
      }
      if (summaryLines.length > 0) {
        note(summaryLines.join("\n"), "Init summary");
      }

      const nextSteps: string[] = [];
      nextSteps.push(
        resolved.hasPackageJson
          ? "npm run docs:dev"
          : `npx ${scriptCommand("dev", writableConfigPath)}`,
      );
      nextSteps.push(
        "If you want to host docs at the root of a GitHub Pages site, edit basePath/origin in your pagesmith config manually.",
      );
      if (!answers.ai) {
        nextSteps.push("npx pagesmith-docs init --ai  # Optional: install AI integrations");
      }
      note(nextSteps.join("\n"), "Next steps");

      if (interactive) outro("Done.");
    });
}
