import type { Command } from "cac";
import { CliError, withConfigFlag } from "@pagesmith/core/cli-kit";
import { findPagesmithConfig } from "@pagesmith/core/cli-kit";
import { loadSitePreset } from "../load-preset.js";
import { parseLogLevel, parsePort } from "../log-level.js";

type DevOpts = {
  port?: number | string;
  config?: string;
  open?: boolean;
  outDir?: string;
  basePath?: string;
  logLevel?: string;
};

export function registerDevCommand(command: Command, getPresetSpecifier: () => string): Command {
  return withConfigFlag(command)
    .option("-p, --port <number>", "Server port (default: preset)")
    .option("--open", "Open browser on server start")
    .option("--out-dir <path>", "Output directory (overrides config)")
    .option("--base-path <path>", "Base URL path prefix (overrides config)")
    .option("--log-level <level>", "silent|error|warn|info|verbose (default: warn)")
    .action(async (options: DevOpts) => {
      const specifier = getPresetSpecifier();
      const preset = await loadSitePreset(specifier);
      if (!preset.dev) {
        throw new CliError(`Preset "${specifier}" does not implement dev().`);
      }
      const { configPath } = findPagesmithConfig({ explicitPath: options.config });
      await preset.dev({
        configPath,
        port: options.port == null ? undefined : parsePort(options.port),
        open: options.open,
        logLevel: options.logLevel ? parseLogLevel(options.logLevel) : undefined,
        outDir: options.outDir,
        basePath: options.basePath,
      });
    });
}
