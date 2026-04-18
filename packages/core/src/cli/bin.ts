#!/usr/bin/env node

import { defineCli, readPackageVersion } from "../cli-kit/index.js";
import { registerAiCommand } from "./commands/ai.js";
import { registerCreateCommand } from "./commands/create.js";
import { registerSkillsCommand } from "./commands/skills.js";
import { registerTemplatesCommand } from "./commands/templates.js";
import { registerValidateCommand } from "./commands/validate.js";

const version = readPackageVersion(import.meta.dirname);

const cliInstance = defineCli({
  name: "pagesmith-core",
  version,
  description:
    "@pagesmith/core CLI — templates, project scaffolding, AI artifacts, and content validation",
});
const { cli } = cliInstance;

cli.usage(`<command> [options]

Interactive mode is automatic when stdout is a TTY and --yes / --non-interactive
is not passed. Set CI=1 or PAGESMITH_NON_INTERACTIVE=1 to force non-interactive
mode.

Project defaults: values in pagesmith-core.config.{ts,json5} (or the cli.core
block of pagesmith.config.{ts,json5,...}) are used as prompt defaults.`);

registerTemplatesCommand(cli.command("templates", "List available starter templates"));
registerCreateCommand(cli.command("create [project-name]", "Create a starter project"));
registerAiCommand(cli.command("ai", "Install Pagesmith AI memory/skill artifacts"));
registerSkillsCommand(cli.command("skills", "Install consumer skills from Pagesmith packages"));
registerValidateCommand(
  cli.command("validate [content-dir]", "Validate markdown content (frontmatter, links, images)"),
);

const exitCode = await cliInstance.run();
if (exitCode !== 0) process.exit(exitCode);
