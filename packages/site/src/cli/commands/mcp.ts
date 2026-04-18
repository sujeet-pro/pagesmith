import type { Command } from "cac";
import { CliError } from "@pagesmith/core/cli-kit";
import { loadSitePreset } from "../load-preset.js";

/**
 * `pagesmith-site mcp` delegates fully to the loaded preset's `mcp` (e.g.
 * the docs preset's MCP server). The site CLI does not own MCP behavior; it
 * only allows the command so users running `pagesmith` see consistent help.
 */
export function registerMcpCommand(
  command: Command,
  getPresetSpecifier: () => string,
  getRawArgv: () => string[],
): Command {
  return command.allowUnknownOptions().action(async () => {
    const specifier = getPresetSpecifier();
    const preset = await loadSitePreset(specifier);
    if (!preset.mcp) {
      throw new CliError(`Preset "${specifier}" does not implement mcp().`, {
        hint: "Use a preset that defines mcp, or use pagesmith-docs for the built-in docs workflow.",
      });
    }
    await preset.mcp(getRawArgv());
  });
}
