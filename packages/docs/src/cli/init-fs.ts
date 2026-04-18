import { existsSync, readFileSync, writeFileSync } from "fs";
import JSON5 from "json5";
import { dirname, relative, resolve } from "path";
import { isDeepStrictEqual } from "util";
import type { DocsUserConfig } from "../config.js";

export type InitAnswers = {
  name: string;
  title: string;
  origin: string;
  basePath: string;
  contentDir: string;
  copyrightStartYear: number;
  search: boolean;
  ai: boolean;
  starterContent: boolean;
};

export type DocsConfigDocument = DocsUserConfig & {
  $schema?: string;
};

export type UpdateInitConfigResult = {
  changed: boolean;
  created: boolean;
  updated: boolean;
  config: DocsConfigDocument;
};

const DEFAULT_OUT_DIR = "gh-pages";
const DOCS_CONFIG_SCHEMA_PATH = [
  "node_modules",
  "@pagesmith",
  "docs",
  "schemas",
  "pagesmith-config.schema.json",
] as const;

function hasOwn(value: unknown, key: string): boolean {
  return (
    typeof value === "object" && value !== null && Object.prototype.hasOwnProperty.call(value, key)
  );
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function omitKnownInitKeys(config: DocsConfigDocument): DocsConfigDocument {
  const {
    $schema: _schema,
    name: _name,
    title: _title,
    origin: _origin,
    basePath: _basePath,
    contentDir: _contentDir,
    outDir: _outDir,
    copyright: _copyright,
    search: _search,
    ...rest
  } = config;

  return rest;
}

function buildCopyrightConfig(
  existingConfig: DocsConfigDocument | undefined,
  answers: InitAnswers,
): NonNullable<DocsUserConfig["copyright"]> {
  const existingCopyright = existingConfig?.copyright;
  const shouldRefreshProjectName =
    existingCopyright?.projectName == null ||
    existingCopyright.projectName === existingConfig?.title ||
    existingCopyright.projectName === existingConfig?.name;

  return {
    projectName: shouldRefreshProjectName ? answers.title : existingCopyright.projectName,
    startYear: existingCopyright?.startYear ?? answers.copyrightStartYear,
    endYear: hasOwn(existingCopyright ?? {}, "endYear")
      ? (existingCopyright?.endYear ?? null)
      : null,
  };
}

function buildSearchConfig(
  existingConfig: DocsConfigDocument | undefined,
  answers: InitAnswers,
): NonNullable<DocsUserConfig["search"]> {
  return existingConfig?.search
    ? {
        ...existingConfig.search,
        enabled: answers.search,
      }
    : { enabled: answers.search };
}

export function parseInitConfigFile(configPath: string): DocsConfigDocument | undefined {
  if (!existsSync(configPath)) return undefined;

  try {
    return JSON5.parse(readFileSync(configPath, "utf-8")) as DocsConfigDocument;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to parse init config file: ${configPath}\n` +
        `  ${message}\n` +
        `  Check that the file contains valid JSON5 syntax before rerunning 'pagesmith init'.`,
    );
  }
}

export function applyExistingConfigDefaults(
  defaults: InitAnswers,
  existingConfig: DocsConfigDocument | undefined,
): InitAnswers {
  if (!existingConfig) return defaults;

  return {
    ...defaults,
    name: existingConfig.name ?? existingConfig.title ?? defaults.name,
    title: existingConfig.title ?? existingConfig.name ?? defaults.title,
    origin: existingConfig.origin ?? defaults.origin,
    basePath: existingConfig.basePath ?? defaults.basePath,
    contentDir: existingConfig.contentDir ?? defaults.contentDir,
    copyrightStartYear: existingConfig.copyright?.startYear ?? defaults.copyrightStartYear,
    search: existingConfig.search?.enabled ?? defaults.search,
  };
}

export function getDocsConfigSchemaRef(projectDir: string, configPath: string): string {
  const absoluteSchemaPath = resolve(projectDir, ...DOCS_CONFIG_SCHEMA_PATH);
  const relativeSchemaPath = normalizePath(relative(dirname(configPath), absoluteSchemaPath));
  return relativeSchemaPath.startsWith(".") ? relativeSchemaPath : `./${relativeSchemaPath}`;
}

export function buildInitConfigDocument(options: {
  projectDir: string;
  configPath: string;
  answers: InitAnswers;
  existingConfig?: DocsConfigDocument;
}): DocsConfigDocument {
  const { projectDir, configPath, answers, existingConfig } = options;
  const extraConfig = existingConfig ? omitKnownInitKeys(existingConfig) : {};

  return {
    $schema: getDocsConfigSchemaRef(projectDir, configPath),
    name: answers.name,
    title: answers.title,
    origin: answers.origin,
    basePath: answers.basePath,
    contentDir: answers.contentDir,
    outDir: existingConfig?.outDir ?? DEFAULT_OUT_DIR,
    copyright: buildCopyrightConfig(existingConfig, answers),
    search: buildSearchConfig(existingConfig, answers),
    ...extraConfig,
  };
}

export function stringifyInitConfig(config: DocsConfigDocument): string {
  return `${JSON5.stringify(config, null, 2)}\n`;
}

export function updateInitConfigFile(options: {
  projectDir: string;
  configPath: string;
  answers: InitAnswers;
}): UpdateInitConfigResult {
  const existingConfig = parseInitConfigFile(options.configPath);
  const nextConfig = buildInitConfigDocument({
    ...options,
    existingConfig,
  });

  if (existingConfig && isDeepStrictEqual(existingConfig, nextConfig)) {
    return {
      changed: false,
      created: false,
      updated: false,
      config: nextConfig,
    };
  }

  writeFileSync(options.configPath, stringifyInitConfig(nextConfig));

  return {
    changed: true,
    created: !existingConfig,
    updated: Boolean(existingConfig),
    config: nextConfig,
  };
}
