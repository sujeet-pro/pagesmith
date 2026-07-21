import { existsSync, readFileSync } from "fs";
import { z } from "@pagesmith/core";
import { loadPagesmithConfig } from "@pagesmith/core/cli-kit";
import JSON5 from "json5";
import { resolve } from "path";

export const SiteFooterLinkSchema = z
  .object({
    label: z.string(),
    path: z.string(),
  })
  .catchall(z.unknown());

export const SiteFooterLinkGroupSchema = z
  .object({
    header: z.string().optional(),
    links: z.array(SiteFooterLinkSchema).default([]),
  })
  .catchall(z.unknown());

export const SiteMaintainerSchema = z
  .object({
    name: z.string(),
    link: z.string().optional(),
  })
  .catchall(z.unknown());

export const SiteCopyrightSchema = z
  .object({
    projectName: z.string(),
    startYear: z.number(),
    endYear: z.number().nullable().optional(),
  })
  .catchall(z.unknown());

export const SiteSearchConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    showImages: z.boolean().optional(),
    showSubResults: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const SiteThemeConfigSchema = z
  .object({
    lightColor: z.string().optional(),
    darkColor: z.string().optional(),
    defaultColorScheme: z.enum(["auto", "light", "dark"]).optional(),
    defaultTheme: z.string().optional(),
    defaultTextSize: z.string().optional(),
    layouts: z.record(z.string(), z.string()).optional(),
    socialImage: z.string().optional(),
  })
  .catchall(z.unknown());

export const SiteSeoConfigSchema = z
  .object({
    locale: z.string().optional(),
    twitterHandle: z.string().optional(),
    defaultOgType: z.string().optional(),
    /** Emit schema.org JSON-LD (Article/BlogPosting + WebSite). Default: true. Set false to disable. */
    jsonLd: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const SiteAnalyticsConfigSchema = z
  .object({
    googleAnalytics: z.string().optional(),
  })
  .catchall(z.unknown());

export const SiteServerConfigSchema = z
  .object({
    host: z.string().optional(),
    devPort: z.number().int().positive().optional(),
    previewPort: z.number().int().positive().optional(),
    strictPort: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const SiteSidebarConfigSchema = z
  .object({
    collapsible: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const SiteUserConfigSchema = z
  .object({
    preset: z.string().optional(),
    presets: z.array(z.string()).optional(),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    origin: z
      .string()
      .url()
      .transform((v) => v.replace(/\/+$/, ""))
      .optional(),
    language: z.string().optional(),
    contentDir: z.string().optional(),
    outDir: z.string().optional(),
    publicDir: z.string().optional(),
    basePath: z.string().optional(),
    homeLink: z.string().optional(),
    trailingSlash: z.boolean().default(false),
    maintainer: SiteMaintainerSchema.optional(),
    footerLinks: z
      .union([z.array(SiteFooterLinkSchema), z.array(SiteFooterLinkGroupSchema)])
      .optional(),
    footerText: z.string().optional(),
    copyright: SiteCopyrightSchema.optional(),
    sidebar: SiteSidebarConfigSchema.optional(),
    search: SiteSearchConfigSchema.optional(),
    theme: SiteThemeConfigSchema.optional(),
    seo: SiteSeoConfigSchema.optional(),
    analytics: SiteAnalyticsConfigSchema.optional(),
    socialImage: z.string().optional(),
    favicon: z.union([z.string(), z.literal(false)]).optional(),
    faviconFallback: z.union([z.string(), z.literal(false)]).optional(),
    appleTouchIcon: z.union([z.string(), z.literal(false)]).optional(),
    server: SiteServerConfigSchema.optional(),
  })
  .catchall(z.unknown());

export type SiteFooterLink = z.infer<typeof SiteFooterLinkSchema>;
export type SiteFooterLinkGroup = z.infer<typeof SiteFooterLinkGroupSchema>;
export type SiteMaintainer = z.infer<typeof SiteMaintainerSchema>;
export type SiteCopyright = z.infer<typeof SiteCopyrightSchema>;
export type SiteSearchConfig = z.infer<typeof SiteSearchConfigSchema>;
export type SiteThemeConfig = z.infer<typeof SiteThemeConfigSchema>;
export type SiteSeoConfig = z.infer<typeof SiteSeoConfigSchema>;
export type SiteAnalyticsConfig = z.infer<typeof SiteAnalyticsConfigSchema>;
export type SiteServerConfig = z.infer<typeof SiteServerConfigSchema>;
export type SiteSidebarConfig = z.infer<typeof SiteSidebarConfigSchema>;
export type SiteUserConfig = z.infer<typeof SiteUserConfigSchema>;
export type RawSiteConfig = Record<string, unknown>;

export function defineSiteConfig<T extends SiteUserConfig>(config: T): T {
  return config;
}

/**
 * Identity helper for `pagesmith.config.ts` files. Equivalent to
 * `defineSiteConfig`; provided as the canonical name users expect from other
 * Pagesmith packages.
 */
export const defineConfig = defineSiteConfig;

export function parseSiteConfig(config: unknown): SiteUserConfig {
  return SiteUserConfigSchema.parse(config);
}

export function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath || basePath === "/") return "";
  return `/${basePath.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Strips trailing slashes from an origin URL.
 *
 * `https://example.com/` → `https://example.com`
 */
export function normalizeOrigin(origin: string | undefined): string {
  if (!origin) return "";
  return origin.replace(/\/+$/, "");
}

/**
 * Prepend the base path to a route path with correct slash handling.
 *
 * Handles all edge cases:
 * - `base=/x/` + `path=/a/b` → `/x/a/b` (dedup slashes)
 * - `base=/x` + `path=a/b` → `/x/a/b` (ensure joining slash)
 * - `base=/x` + `path=/a/b` → `/x/a/b` (normal case)
 * - External URLs, mailto:, tel: are returned as-is
 */
export function withBasePath(basePath: string | undefined, path: string): string {
  if (!path) {
    const normalizedBase = normalizeBasePath(basePath);
    return normalizedBase || "/";
  }

  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("mailto:") || path.startsWith("tel:")) {
    return path;
  }

  const normalizedBase = normalizeBasePath(basePath);

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!normalizedBase) return normalizedPath;
  if (normalizedPath === "/") return normalizedBase || "/";
  if (normalizedPath.startsWith(`${normalizedBase}/`)) return normalizedPath;
  return `${normalizedBase}${normalizedPath}`;
}

export function stripBasePath(url: string, basePath: string | undefined): string {
  const [rawPath] = url.split(/[?#]/u, 1);
  const normalizedBase = normalizeBasePath(basePath);

  if (!normalizedBase) {
    return rawPath === "" ? "/" : rawPath || "/";
  }

  if (rawPath === normalizedBase) return "/";
  if (rawPath.startsWith(`${normalizedBase}/`)) {
    return rawPath.slice(normalizedBase.length) || "/";
  }

  return rawPath || "/";
}

/** @deprecated Use `formatPath` from `@pagesmith/site` instead. */
export function withTrailingSlash(path: string): string {
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export function normalizePresetSpecifier(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.endsWith("/preset")) return value;
  if (value.startsWith("@pagesmith/")) return `${value}/preset`;
  return value;
}

/**
 * Synchronous loader. Reads the JSON5/JSON form of `pagesmith.config.*`. Use
 * `loadSiteConfigAsync` for `.ts/.mts/.js/.mjs` configs (the CLI always uses
 * the async variant).
 */
export function loadSiteConfig(configPath = "pagesmith.config.json5"): RawSiteConfig | undefined {
  const resolved = resolve(configPath);
  if (!existsSync(resolved)) return undefined;
  if (
    resolved.endsWith(".ts") ||
    resolved.endsWith(".mts") ||
    resolved.endsWith(".js") ||
    resolved.endsWith(".mjs")
  ) {
    return undefined;
  }
  return JSON5.parse(readFileSync(resolved, "utf-8")) as RawSiteConfig;
}

/**
 * Async loader for any supported config format
 * (`.ts`, `.mts`, `.js`, `.mjs`, `.json5`, `.json`).
 */
export async function loadSiteConfigAsync(
  configPath = "pagesmith.config.json5",
): Promise<RawSiteConfig | undefined> {
  const result = await loadPagesmithConfig({ explicitPath: configPath });
  return result.config as RawSiteConfig | undefined;
}

export function resolveSitePresetSpecifier(
  configPath = "pagesmith.config.json5",
  fallback = process.env.PAGESMITH_PRESET ?? "@pagesmith/site/preset",
): string {
  const config = loadSiteConfig(configPath);
  const direct = normalizePresetSpecifier(
    typeof config?.preset === "string" ? config.preset : undefined,
  );
  if (direct) return direct;

  const firstPreset =
    Array.isArray(config?.presets) && typeof config.presets[0] === "string"
      ? config.presets[0]
      : undefined;
  return normalizePresetSpecifier(firstPreset) ?? fallback;
}
