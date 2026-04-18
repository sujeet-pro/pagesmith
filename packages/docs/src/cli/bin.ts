#!/usr/bin/env node

import { defineCli, readPackageVersion } from "@pagesmith/core/cli-kit";
import { registerBuildCommand } from "./commands/build.js";
import { registerDevCommand } from "./commands/dev.js";
import { registerInitCommand } from "./commands/init.js";
import { registerMcpCommand } from "./commands/mcp.js";
import { registerPreviewCommand } from "./commands/preview.js";
import { registerValidateCommand } from "./commands/validate.js";

const version = readPackageVersion(import.meta.dirname);

const cliInstance = defineCli({
  name: "pagesmith-docs",
  version,
  description: "@pagesmith/docs CLI — convention-based documentation site tooling",
});
const { cli } = cliInstance;

cli.usage(
  `<command> [options]

Interactive mode is automatic when stdout/stdin are TTYs and neither --yes nor
--non-interactive is passed. Set CI=1 or PAGESMITH_NON_INTERACTIVE=1 to force
non-interactive execution. In non-interactive mode, init fails when --name,
--origin, or --base-path is missing from both flags and any
pagesmith.config.{ts,mts,js,mjs,json5,json}.

Project defaults: prompt defaults are read from whichever
pagesmith.config.{ts,mts,js,mjs,json5,json} the loader finds first (closest
match in the cwd; --config <path> overrides discovery).`,
);

registerInitCommand(cli.command("init", "Initialize a docs project (interactive)"), version);
registerDevCommand(cli.command("dev", "Start a docs dev server"));
registerBuildCommand(cli.command("build", "Build a docs site"));
registerPreviewCommand(cli.command("preview", "Preview the built docs site"));
registerValidateCommand(
  cli.command("validate", "Validate content + build output using pagesmith.config"),
);
registerMcpCommand(cli.command("mcp", "Start stdio MCP server for docs tooling"));

const exitCode = await cliInstance.run();
if (exitCode !== 0) process.exit(exitCode);
