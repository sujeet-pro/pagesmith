import type { Command } from "cac";
import { resolve } from "path";
import { formatContentValidationReport, validateContent } from "@pagesmith/core";
import { CliError, findPagesmithConfig, withConfigFlag } from "@pagesmith/core/cli-kit";
import { runBuildValidation } from "../../build-validator.js";
import type { SiteValidateOptions } from "../../preset.js";
import { loadSitePreset } from "../load-preset.js";

type ValidateOpts = {
  config?: string;
  contentDir?: string;
  outDir?: string;
  basePath?: string;
  content?: boolean;
  build?: boolean;
  checkExternal?: boolean;
  requireRasterModernFormats?: boolean;
  requireThemeVariants?: boolean;
  requireCanonicalInternalLinks?: boolean;
  trailingSlash?: boolean;
  timeoutMs?: number;
  concurrency?: number;
  showClean?: boolean;
};

export function registerValidateCommand(
  command: Command,
  getPresetSpecifier: () => string,
): Command {
  return withConfigFlag(command)
    .option("--content-dir <path>", "Content directory override")
    .option("--out-dir <path>", "Build output directory override")
    .option("--base-path <path>", "Site base path override")
    .option("--content", "Only run content validation")
    .option("--build", "Only run build-output validation")
    .option("--check-external", "Fetch external URLs and report non-2xx")
    .option(
      "--require-raster-modern-formats",
      "Enforce webp+avif siblings for <picture> raster fallbacks",
    )
    .option("--require-theme-variants", "Enforce light+dark <picture> sources")
    .option(
      "--require-canonical-internal-links",
      "Require internal page links be authored as ./relative/path.md",
    )
    .option(
      "--no-require-canonical-internal-links",
      "Accept absolute /guide/foo and bare ./foo forms",
    )
    .option("--trailing-slash", "Override trailing-slash routing mode")
    .option("--no-trailing-slash", "Override to flat HTML files")
    .option("--timeout-ms <number>", "External fetch timeout (default: 10000)")
    .option("--concurrency <number>", "External fetch concurrency (default: 8)")
    .option("--show-clean", "Also list files that pass content validation")
    .action(async (options: ValidateOpts) => {
      const specifier = getPresetSpecifier();
      const preset = await loadSitePreset(specifier);
      const { configPath } = findPagesmithConfig({ explicitPath: options.config });

      const siteOptions: SiteValidateOptions = {
        configPath,
        contentDir: options.contentDir,
        outDir: options.outDir,
        basePath: options.basePath,
        skipContent: options.build === true && options.content !== true,
        skipBuild: options.content === true && options.build !== true,
        checkExternal: options.checkExternal,
        requireRasterModernFormats: options.requireRasterModernFormats,
        requireThemeVariants: options.requireThemeVariants,
        requireCanonicalInternalLinks:
          options.requireCanonicalInternalLinks === false
            ? false
            : options.requireCanonicalInternalLinks === true
              ? true
              : undefined,
        trailingSlash: options.trailingSlash,
        timeoutMs: options.timeoutMs,
        concurrency: options.concurrency,
        showClean: options.showClean,
      };

      if (preset.validate) {
        const exitCode = await preset.validate(siteOptions);
        process.exit(exitCode);
      }

      // Generic fallback when the preset doesn't ship its own validator.
      if (!siteOptions.skipContent && !siteOptions.contentDir) {
        throw new CliError(
          `Preset "${specifier}" does not implement validate() — pass --content-dir to run generic content validation.`,
        );
      }
      if (!siteOptions.skipBuild && !siteOptions.outDir) {
        throw new CliError(
          `Preset "${specifier}" does not implement validate() — pass --out-dir to run generic build validation.`,
        );
      }

      let errors = 0;
      if (!siteOptions.skipContent && siteOptions.contentDir) {
        const contentDir = resolve(siteOptions.contentDir);
        const summary = await validateContent({
          contentDir,
          linkValidator: {
            rootDir: contentDir,
            basePath: siteOptions.basePath,
            requireCanonicalInternalLinks: siteOptions.requireCanonicalInternalLinks,
            checkExternalReachability: siteOptions.checkExternal,
            fetchTimeoutMs: siteOptions.timeoutMs,
            fetchConcurrency: siteOptions.concurrency,
          },
        });
        console.info(formatContentValidationReport(summary, { showClean: siteOptions.showClean }));
        errors += summary.errors;
      }

      if (!siteOptions.skipBuild && siteOptions.outDir) {
        const code = runBuildValidation({
          outDir: resolve(siteOptions.outDir),
          basePath: siteOptions.basePath,
          trailingSlash: siteOptions.trailingSlash,
          requireRasterModernFormats: siteOptions.requireRasterModernFormats,
          requireThemeVariants: siteOptions.requireThemeVariants,
        });
        errors += code;
      }

      process.exit(errors > 0 ? 1 : 0);
    });
}
