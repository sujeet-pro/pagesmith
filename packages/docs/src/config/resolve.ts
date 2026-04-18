import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import JSON5 from "json5";
import { basename, dirname, join, resolve } from "path";
import { loadPagesmithConfig } from "@pagesmith/core/cli-kit";
import type { DocsUserConfig, GitOriginInfo, ResolvedDocsConfig } from "./types";

export function defineDocsConfig<T extends DocsUserConfig>(config: T): T {
  return config;
}

/**
 * Identity helper for `pagesmith.config.ts` files. Equivalent to
 * `defineDocsConfig`; provided as the canonical name users expect from other
 * Pagesmith packages.
 */
export const defineConfig = defineDocsConfig;

/**
 * Synchronous loader. Reads `pagesmith.config.json5` (or any explicit path
 * with a JSON5/JSON extension). Throws when handed a `.ts/.mts/.js/.mjs` path
 * because TypeScript/JS configs require asynchronous loading via `jiti` /
 * dynamic `import()`. CLI commands always go through `loadDocsConfigAsync`,
 * which handles every supported extension.
 */
export function loadDocsConfig(configPath?: string): DocsUserConfig {
  const resolvedConfigPath = resolve(configPath ?? join(process.cwd(), "pagesmith.config.json5"));
  if (!existsSync(resolvedConfigPath)) {
    return {};
  }

  if (
    resolvedConfigPath.endsWith(".ts") ||
    resolvedConfigPath.endsWith(".mts") ||
    resolvedConfigPath.endsWith(".js") ||
    resolvedConfigPath.endsWith(".mjs")
  ) {
    throw new Error(
      `loadDocsConfig is synchronous and only supports JSON5/JSON configs (got: ${resolvedConfigPath}).\n` +
        "  Use `await loadDocsConfigAsync(path)` for TypeScript/JS configs.",
    );
  }

  try {
    return JSON5.parse(readFileSync(resolvedConfigPath, "utf-8")) as DocsUserConfig;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to parse config file: ${resolvedConfigPath}\n` +
        `  ${message}\n` +
        `  Check that the file contains valid JSON5 syntax.`,
    );
  }
}

/**
 * Async loader for any supported config file extension
 * (`.ts`, `.mts`, `.js`, `.mjs`, `.json5`, `.json`).
 *
 * Used by every CLI command (init/dev/build/preview/validate/mcp) so users can
 * author their docs config in TypeScript and still get the same resolved shape.
 */
export async function loadDocsConfigAsync(configPath?: string): Promise<DocsUserConfig> {
  const resolved = configPath
    ? resolve(configPath)
    : resolve(join(process.cwd(), "pagesmith.config.json5"));
  if (!existsSync(resolved)) {
    return {};
  }
  const result = await loadPagesmithConfig({ explicitPath: resolved });
  return (result.config as DocsUserConfig | undefined) ?? {};
}

/** Detect basePath and origin from git remote URL. */
export function detectGitOrigin(rootDir: string): GitOriginInfo | undefined {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      cwd: rootDir,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf-8",
    }).trim();

    let match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return {
        basePath: `/${repo}`,
        origin: `https://${owner}.github.io`,
        repoOwner: owner,
        repoName: repo,
        repoUrl: `https://github.com/${owner}/${repo}`,
        editLinkHost: "github",
      };
    }

    match = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return {
        basePath: `/${repo}`,
        origin: `https://${owner}.gitlab.io`,
        repoOwner: owner,
        repoName: repo,
        repoUrl: `https://gitlab.com/${owner}/${repo}`,
        editLinkHost: "gitlab",
      };
    }

    match = remoteUrl.match(/bitbucket\.org[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return {
        basePath: `/${repo}`,
        repoOwner: owner,
        repoName: repo,
        repoUrl: `https://bitbucket.org/${owner}/${repo}`,
        editLinkHost: "bitbucket",
      };
    }
  } catch {
    // Not a git repo or git not installed — skip silently
  }
  return undefined;
}

export async function probeHostedOrigin(origin: string): Promise<string> {
  try {
    const response = await fetch(origin, {
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });

    const finalUrl = response.url || origin;
    return new URL(finalUrl).origin;
  } catch {
    return origin;
  }
}

export async function resolveInitOrigin(
  rootDir: string,
  gitInfo = detectGitOrigin(rootDir),
): Promise<string | undefined> {
  if (!gitInfo?.origin) return undefined;
  if (gitInfo.editLinkHost !== "github") return gitInfo.origin;
  return probeHostedOrigin(gitInfo.origin);
}

export function detectFirstCommitYear(rootDir: string): number | undefined {
  try {
    const firstCommitDate = execSync("git log --reverse --format=%cI --max-count=1", {
      cwd: rootDir,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf-8",
    }).trim();
    if (!firstCommitDate) return undefined;

    const year = new Date(firstCommitDate).getFullYear();
    return Number.isFinite(year) ? year : undefined;
  } catch {
    return undefined;
  }
}

function readPackageJson(rootDir: string):
  | {
      name?: string;
      description?: string;
      homepage?: string;
      author?: string | { name?: string; url?: string };
    }
  | undefined {
  const pkgPath = join(rootDir, "package.json");
  if (!existsSync(pkgPath)) return undefined;
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return undefined;
  }
}

function parseMaintainer(
  author: string | { name?: string; url?: string } | undefined,
): ResolvedDocsConfig["maintainer"] {
  if (!author) return undefined;

  if (typeof author === "string") {
    const match = author.trim().match(/^([^<(]+?)\s*(?:<[^>]*>)?\s*(?:\(([^)]+)\))?$/);
    if (!match) return undefined;

    const name = match[1]?.trim();
    const link = match[2]?.trim();
    if (!name) return undefined;

    return {
      name,
      ...(link ? { link } : {}),
    };
  }

  const name = author.name?.trim();
  if (!name) return undefined;

  return {
    name,
    ...(author.url?.trim() ? { link: author.url.trim() } : {}),
  };
}

function resolveContentDir(rootDir: string, explicit?: string): string {
  if (explicit) return resolve(rootDir, explicit);
  const docsDir = resolve(rootDir, "docs");
  if (existsSync(docsDir)) return docsDir;
  return resolve(rootDir, "content");
}

function generateDefaultFavicon(letter: string): string {
  const cacheDir = join(tmpdir(), "pagesmith-favicon", letter);
  const filePath = join(cacheDir, "favicon.svg");
  if (!existsSync(filePath)) {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
      '  <rect width="32" height="32" rx="6" fill="#111"/>',
      `  <text x="16" y="24" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="20" font-weight="700">${letter}</text>`,
      "</svg>",
      "",
    ].join("\n");
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(filePath, svg);
  }
  return filePath;
}

export function resolveDocsConfig(
  configPath?: string,
  overrides?: { outDir?: string; basePath?: string },
): ResolvedDocsConfig {
  const resolvedConfigPath = resolve(configPath ?? join(process.cwd(), "pagesmith.config.json5"));
  const userConfig = loadDocsConfig(resolvedConfigPath);
  return resolveDocsConfigFromUser(resolvedConfigPath, userConfig, overrides);
}

/**
 * Async equivalent of `resolveDocsConfig` that supports every config file
 * extension (`.ts`, `.mts`, `.js`, `.mjs`, `.json5`, `.json`). CLI commands
 * always use this so authors can pick whichever config format they prefer.
 */
export async function resolveDocsConfigAsync(
  configPath?: string,
  overrides?: { outDir?: string; basePath?: string },
): Promise<ResolvedDocsConfig> {
  const resolvedConfigPath = resolve(configPath ?? join(process.cwd(), "pagesmith.config.json5"));
  const userConfig = await loadDocsConfigAsync(resolvedConfigPath);
  return resolveDocsConfigFromUser(resolvedConfigPath, userConfig, overrides);
}

function resolveDocsConfigFromUser(
  resolvedConfigPath: string,
  userConfig: DocsUserConfig,
  overrides?: { outDir?: string; basePath?: string },
): ResolvedDocsConfig {
  const rootDir = dirname(resolvedConfigPath);
  const packageName = basename(rootDir);
  const pkg = readPackageJson(rootDir);
  const pkgDisplayName = pkg?.name?.replace(/^@[^/]+\//, "");
  const gitInfo = detectGitOrigin(rootDir);
  const rawEnvBasePath = process.env.BASE_URL?.trim();
  const envBasePath = rawEnvBasePath && rawEnvBasePath !== "/" ? rawEnvBasePath : undefined;

  const rawBase =
    overrides?.basePath ?? envBasePath ?? userConfig.basePath ?? gitInfo?.basePath ?? "/";
  let basePath = rawBase.replace(/\/+$/, "");
  if (basePath && !basePath.startsWith("/")) {
    basePath = "/" + basePath;
  }
  const contentDir = resolveContentDir(rootDir, userConfig.contentDir);
  const publicDir = resolve(rootDir, userConfig.publicDir ?? "public");
  const siteName = userConfig.name ?? userConfig.title ?? pkgDisplayName ?? packageName;
  const maintainer = userConfig.maintainer ?? parseMaintainer(pkg?.author);
  const buildYear = new Date().getFullYear();

  let copyright: ResolvedDocsConfig["copyright"];
  if (userConfig.copyright) {
    const startYear = userConfig.copyright.startYear ?? detectFirstCommitYear(rootDir) ?? buildYear;
    const configuredEndYear = userConfig.copyright.endYear ?? undefined;
    const normalizedEndYear =
      configuredEndYear !== undefined ? Math.max(configuredEndYear, startYear) : undefined;

    copyright = {
      projectName: userConfig.copyright.projectName?.trim() || siteName,
      startYear,
      ...(normalizedEndYear !== undefined ? { endYear: normalizedEndYear } : {}),
    };
  }

  let resolvedFavicon: string | false;
  let resolvedFaviconFallback: string | false = false;
  if (userConfig.favicon === false) {
    resolvedFavicon = false;
  } else if (typeof userConfig.favicon === "string") {
    resolvedFavicon = resolve(rootDir, userConfig.favicon);
  } else {
    const svgPath = join(publicDir, "favicon.svg");
    const icoPath = join(publicDir, "favicon.ico");
    if (existsSync(svgPath)) {
      resolvedFavicon = svgPath;
      if (existsSync(icoPath)) {
        resolvedFaviconFallback = icoPath;
      }
    } else if (existsSync(icoPath)) {
      resolvedFavicon = icoPath;
    } else {
      const letter = (siteName.charAt(0) || "P").toUpperCase();
      resolvedFavicon = generateDefaultFavicon(letter);
    }
  }

  let resolvedIcon: string | false;
  if (userConfig.icon === false) {
    resolvedIcon = false;
  } else if (typeof userConfig.icon === "string") {
    if (userConfig.icon.trimStart().startsWith("<")) {
      resolvedIcon = userConfig.icon;
    } else {
      const iconPath = resolve(rootDir, userConfig.icon);
      resolvedIcon = existsSync(iconPath) ? readFileSync(iconPath, "utf-8") : false;
    }
  } else {
    const letter = (siteName.charAt(0) || "P").toUpperCase();
    resolvedIcon = [
      '<svg class="doc-default-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">',
      '  <rect class="doc-default-icon-bg" width="32" height="32" rx="6"/>',
      `  <text class="doc-default-icon-letter" x="16" y="24" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="700">${letter}</text>`,
      "</svg>",
    ].join("");
  }

  const appleTouchIconPath = join(publicDir, "apple-touch-icon.png");
  const resolvedAppleTouchIcon = existsSync(appleTouchIconPath) ? appleTouchIconPath : false;

  const assets = new Map<string, string[]>();
  if (userConfig.assets) {
    for (const [outputPath, sources] of Object.entries(userConfig.assets)) {
      const resolvedSources = sources.map((source) => resolve(rootDir, source));
      assets.set(outputPath, resolvedSources);
    }
  }

  let socialImage: string | undefined;
  if (userConfig.theme?.socialImage) {
    socialImage = userConfig.theme.socialImage;
  } else {
    for (const ext of ["png", "jpg", "jpeg"]) {
      if (existsSync(join(publicDir, `og-image.${ext}`))) {
        socialImage = `og-image.${ext}`;
        break;
      }
    }
  }

  let editLink: ResolvedDocsConfig["editLink"];
  const rawEditLink =
    userConfig.editLink === false
      ? undefined
      : (userConfig.editLink ??
        (gitInfo?.repoUrl
          ? { repo: gitInfo.repoUrl, branch: undefined, label: undefined }
          : undefined));
  if (rawEditLink) {
    const repo = rawEditLink.repo.replace(/\/+$/, "");
    const branch = rawEditLink.branch ?? "main";
    const label = rawEditLink.label ?? "Edit this page";
    let editPattern: string;
    if (repo.includes("gitlab.com") || repo.includes("gitlab.")) {
      editPattern = `${repo}/-/edit/${branch}`;
    } else if (repo.includes("bitbucket.org") || repo.includes("bitbucket.")) {
      editPattern = `${repo}/src/${branch}`;
    } else {
      editPattern = `${repo}/edit/${branch}`;
    }
    editLink = { repo, branch, label, editPattern };
  }

  return {
    rootDir,
    contentDir,
    outDir: overrides?.outDir ?? resolve(rootDir, userConfig.outDir ?? "gh-pages"),
    publicDir,
    basePath,
    homeLink: userConfig.homeLink,
    trailingSlash: userConfig.trailingSlash ?? false,
    maintainer,
    name: siteName,
    title: userConfig.title ?? siteName,
    description:
      userConfig.description ?? pkg?.description ?? "Documentation site powered by @pagesmith/docs",
    origin: userConfig.origin ?? gitInfo?.origin ?? pkg?.homepage ?? "https://example.com",
    language: userConfig.language ?? "en",
    footerLinks: userConfig.footerLinks ?? [],
    footerText: userConfig.footerText,
    copyright,
    search: {
      enabled: userConfig.search?.enabled ?? true,
      showImages: userConfig.search?.showImages ?? false,
      showSubResults: userConfig.search?.showSubResults ?? true,
      pagefindFlags: userConfig.search?.pagefindFlags ?? [],
    },
    sidebar: {
      collapsible: userConfig.sidebar?.collapsible ?? true,
    },
    favicon: resolvedFavicon,
    icon: resolvedIcon,
    faviconFallback: resolvedFaviconFallback,
    appleTouchIcon: resolvedAppleTouchIcon,
    editLink,
    lastUpdated: userConfig.lastUpdated ?? true,
    sitemap: userConfig.sitemap ?? true,
    socialImage,
    theme: userConfig.theme,
    analytics: userConfig.analytics,
    markdown: userConfig.markdown,
    homeConfigFile: userConfig.home?.configFile
      ? resolve(rootDir, userConfig.home.configFile)
      : resolve(rootDir, contentDir, "home.json5"),
    packages: userConfig.packages,
    server: {
      host: userConfig.server?.host ?? "127.0.0.1",
      devPort: userConfig.server?.devPort ?? 3000,
      previewPort: userConfig.server?.previewPort ?? 4000,
      strictPort: userConfig.server?.strictPort ?? false,
    },
    assets,
    _userConfig: userConfig,
  };
}
