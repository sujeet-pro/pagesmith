import type { Command } from "cac";
import { findPagesmithConfig, withConfigFlag } from "@pagesmith/core/cli-kit";
import { validateDocs } from "../../validate.js";

type ValidateOpts = {
  config?: string;
  contentDir?: string;
  outDir?: string;
  basePath?: string;
  trailingSlash?: boolean;
  content?: boolean;
  build?: boolean;
  checkExternal?: boolean;
  requireRasterModernFormats?: boolean;
  requireThemeVariants?: boolean;
  requireBothTrailingSlashForms?: boolean;
  internalLinksMustBeMarkdown?: boolean;
  requireCanonicalInternalLinks?: boolean;
  requireAltText?: boolean;
  allowHtmlImgTag?: boolean;
  themeVariantPairs?: boolean;
  requiredFile?: string | string[];
  requiredFiles?: boolean;
  contentConfig?: string | boolean;
  full?: boolean;
  timeoutMs?: number;
  concurrency?: number;
  showClean?: boolean;
};

function asArray(input: string | string[] | undefined): string[] | undefined {
  if (!input) return undefined;
  return Array.isArray(input) ? input : [input];
}

export function registerValidateCommand(command: Command): Command {
  return withConfigFlag(command)
    .option("--content-dir <path>", "Content directory override")
    .option("--out-dir <path>", "Build output directory override")
    .option("--base-path <path>", "Site base path override")
    .option("--trailing-slash", "Force trailing-slash routing mode")
    .option("--no-trailing-slash", "Force flat HTML files routing mode")
    .option("--content", "Run only content validation")
    .option("--build", "Run only build-output validation")
    .option("--check-external", "Fetch external URLs and report non-2xx as warnings")
    .option(
      "--require-raster-modern-formats",
      "Require webp+avif siblings for <picture> raster fallbacks",
    )
    .option("--require-theme-variants", "Require both light + dark <picture> sources (default: on)")
    .option("--no-theme-variants", "Opt out of the default theme-variant check")
    .option("--require-both-trailing-slash-forms", "Warn when pages are missing a redirect sibling")
    .option(
      "--internal-links-must-be-markdown",
      "Fail if a non-image internal link resolves to a non-markdown file",
    )
    .option(
      "--require-canonical-internal-links",
      "Require internal page links be authored as ./relative/path.md (default: on under docs preset)",
    )
    .option(
      "--no-require-canonical-internal-links",
      "Accept absolute /guide/foo and bare ./foo forms for internal page links",
    )
    .option("--no-require-alt-text", "Downgrade missing image alt text from error to warning")
    .option("--allow-html-img-tag", "Allow raw <img> tags in markdown (default: disallowed)")
    .option("--no-theme-variant-pairs", "Do not enforce adjacent -light/-dark image pairing")
    .option("--required-file <name>", "Require <name> to exist in the build output (repeatable)")
    .option("--no-required-files", "Skip the default required-output-files check")
    .option("--content-config <path>", "Explicit content.config.{ts,mjs,...} path")
    .option("--no-content-config", "Disable content.config auto-loading and per-file schema checks")
    .option("--full", "Enable every opt-in offline check")
    .option("--timeout-ms <number>", "External fetch timeout (default: 10000)")
    .option("--concurrency <number>", "External fetch concurrency (default: 8)")
    .option("--show-clean", "List files that pass content validation")
    .action(async (options: ValidateOpts) => {
      const { configPath } = findPagesmithConfig({ explicitPath: options.config });
      const fullPreset = options.full === true;

      const requireRasterModernFormats =
        options.requireRasterModernFormats === true ? true : fullPreset ? true : undefined;
      const requireBothTrailingSlashForms =
        options.requireBothTrailingSlashForms === true ? true : fullPreset ? true : undefined;
      const internalLinksMustBeMarkdown =
        options.internalLinksMustBeMarkdown === true ? true : fullPreset ? true : undefined;

      const result = await validateDocs({
        configPath,
        contentDir: options.contentDir,
        outDir: options.outDir,
        basePath: options.basePath,
        trailingSlash: options.trailingSlash,
        skipContent: options.build === true && options.content !== true,
        skipBuild: options.content === true && options.build !== true,
        checkExternal: options.checkExternal,
        requireRasterModernFormats,
        requireThemeVariants:
          options.requireThemeVariants === false
            ? false
            : options.requireThemeVariants === true
              ? true
              : undefined,
        requireBothTrailingSlashForms,
        internalLinksMustBeMarkdown,
        requireCanonicalInternalLinks:
          options.requireCanonicalInternalLinks === false
            ? false
            : options.requireCanonicalInternalLinks === true
              ? true
              : undefined,
        requireAltText: options.requireAltText === false ? false : undefined,
        forbidHtmlImgTag: options.allowHtmlImgTag === true ? false : undefined,
        requireThemeVariantPairs: options.themeVariantPairs === false ? false : undefined,
        requiredOutputFiles: options.requiredFiles === false ? [] : asArray(options.requiredFile),
        contentConfig:
          options.contentConfig === false
            ? false
            : typeof options.contentConfig === "string"
              ? options.contentConfig
              : undefined,
        timeoutMs: options.timeoutMs,
        concurrency: options.concurrency,
        showClean: options.showClean,
      });

      console.info(
        `\nSummary: ${result.errors} error(s), ${result.warnings} warning(s) — ${
          result.passed ? "PASSED" : "FAILED"
        }`,
      );
      if (!result.passed) process.exit(1);
    });
}
