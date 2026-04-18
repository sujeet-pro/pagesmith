import type { Command } from "cac";
import { CliError } from "@pagesmith/core/cli-kit";
import { loadSitePreset } from "../load-preset.js";

/**
 * `pagesmith-site init` is a thin pass-through to the loaded preset's `init`.
 * Each preset (including `@pagesmith/docs/preset`) owns its own init flow,
 * defines its own flags, and parses its own argv. The site CLI registers the
 * command with `allowUnknownOptions` so preset-specific flags survive cac
 * parsing and reach the preset.
 */
export function registerInitCommand(
  command: Command,
  getPresetSpecifier: () => string,
  getRawArgv: () => string[],
): Command {
  return command.allowUnknownOptions().action(async () => {
    const specifier = getPresetSpecifier();
    const preset = await loadSitePreset(specifier);
    if (!preset.init) {
      throw new CliError(`Preset "${specifier}" does not implement init().`, {
        hint: "Use a preset that defines init, or use pagesmith-docs for the built-in docs workflow.",
      });
    }
    await preset.init(getRawArgv());
  });
}
