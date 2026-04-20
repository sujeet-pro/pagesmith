import type { DocsMarkdownConfig } from "../schemas/docs-config";

export type FooterLink = {
  label: string;
  path: string;
};

export type FooterLinkGroup = {
  header?: string;
  links: FooterLink[];
};

export type FooterLinks = FooterLink[] | FooterLinkGroup[];

export type Maintainer = {
  name: string;
  link?: string;
};

export type CopyrightConfig = {
  projectName?: string;
  startYear?: number;
  endYear?: number | null;
};

export type ResolvedCopyright = {
  projectName: string;
  startYear: number;
  endYear?: number;
};

export type DocsLogLevel = "silent" | "error" | "warn" | "info" | "verbose";

/**
 * Port value accepted in `server.devPort` and `server.previewPort`. Either an
 * explicit port number or the literal `"auto"`, which makes the dev/preview
 * server scan upward from 4000 for the first available port at startup.
 */
export type DocsServerPort = number | "auto";

export type DocsUserConfig = {
  preset?: string;
  presets?: string[];
  name?: string;
  title?: string;
  description?: string;
  origin?: string;
  language?: string;
  contentDir?: string;
  outDir?: string;
  publicDir?: string;
  /** Base path for deployment under a subdirectory (e.g. '/docs'). Overridden by BASE_URL env var. */
  basePath?: string;
  /** Override the header logo link destination (defaults to basePath). */
  homeLink?: string;
  /** Use trailing slashes in generated links (default: false). */
  trailingSlash?: boolean;
  /** Maintainer credit shown in the default footer sign-off. Falls back to package.json author when omitted. */
  maintainer?: Maintainer;
  /** Footer links can be a flat link row or grouped columns with optional headers. */
  footerLinks?: FooterLinks;
  /** Override the footer sign-off text shown beneath theme controls. */
  footerText?: string;
  /** Footer copyright line shown before the Pagesmith attribution. */
  copyright?: CopyrightConfig;
  sidebar?: {
    /** Enable collapsible sidebar section groups (default: true) */
    collapsible?: boolean;
  };
  search?: {
    enabled?: boolean;
    /** Show images in search results (default: false) */
    showImages?: boolean;
    /** Show sub-results/sections within pages (default: true) */
    showSubResults?: boolean;
    /** Extra CLI flags passed to the pagefind binary */
    pagefindFlags?: string[];
  };
  theme?: {
    lightColor?: string;
    darkColor?: string;
    layouts?: Record<string, string>;
    /** Path to default social sharing image, relative to publicDir or an absolute URL */
    socialImage?: string;
    /** Default color scheme: 'auto' follows OS, 'light' or 'dark' forces a scheme. Default: 'auto'. */
    defaultColorScheme?: "auto" | "light" | "dark";
    /** Default theme variant. Default: 'paper'. */
    defaultTheme?: "paper" | "high-contrast";
    /** Default text size variant. Default: 'base'. */
    defaultTextSize?: "small" | "base" | "large";
  };
  analytics?: {
    googleAnalytics?: string;
  };
  /** Path to favicon file relative to project root. Defaults to 'public/favicon.svg'. Set to false to disable. */
  favicon?: string | false;
  /** SVG string or path for the header logo icon. Defaults to the first letter of the site name. Set to false to disable. */
  icon?: string | false;
  /** Show "Edit this page" link on each page. Auto-detected from git remote when omitted. Set to false to disable. */
  editLink?:
    | {
        /** GitHub/GitLab repo URL (e.g. 'https://github.com/user/repo') */
        repo: string;
        /** Branch name (default: 'main') */
        branch?: string;
        /** Label for the link (default: 'Edit this page') */
        label?: string;
      }
    | false;
  /** Show git-based "last updated" timestamp on pages (default: true) */
  lastUpdated?: boolean;
  /** Generate sitemap.xml during build (default: true when origin is set). Set false to disable. */
  sitemap?: boolean;
  markdown?: DocsMarkdownConfig;
  home?: {
    configFile?: string;
  };
  /** Optional multi-package navigation labels. Maps section slug to display label. */
  packages?: Record<string, { label: string }>;
  /**
   * Map output paths to source files/folders that should be copied to the build output.
   * Keys are output directory paths (e.g. "/" for root, "/api" for api/).
   * Values are arrays of file or folder names resolved relative to the project root.
   * Folders are copied recursively.
   */
  assets?: Record<string, string[]>;
  /** Server settings shared by `pagesmith-docs dev` and `pagesmith-docs preview`. */
  server?: {
    /** Interface to bind the dev and preview servers to. Default: `'127.0.0.1'`. */
    host?: string;
    /** Port for the dev server. Pass a number or `'auto'` to scan upward from 4000 for the first available port. Default: `3000`. */
    devPort?: DocsServerPort;
    /** Port for the preview server. Pass a number or `'auto'` to scan upward from 4000 for the first available port. Default: `4000`. */
    previewPort?: DocsServerPort;
    /** When true and the resolved port is a number, fail if it is in use instead of scanning for the next available port. Ignored when the port is `'auto'`. Default: `false`. */
    strictPort?: boolean;
    /** Log level for the dev/preview servers. Default: `'info'`. */
    logLevel?: DocsLogLevel;
  };
};

export type ResolvedDocsConfig = {
  rootDir: string;
  contentDir: string;
  outDir: string;
  publicDir: string;
  basePath: string;
  homeLink?: string;
  trailingSlash: boolean;
  maintainer?: Maintainer;
  name: string;
  title: string;
  description: string;
  origin: string;
  language: string;
  footerLinks: FooterLinks;
  footerText?: string;
  copyright?: ResolvedCopyright;
  sidebar: {
    collapsible: boolean;
  };
  search: {
    enabled: boolean;
    showImages: boolean;
    showSubResults: boolean;
    pagefindFlags: string[];
  };
  theme?: {
    lightColor?: string;
    darkColor?: string;
    layouts?: Record<string, string>;
    defaultColorScheme?: string;
    defaultTheme?: string;
    defaultTextSize?: string;
  };
  analytics?: {
    googleAnalytics?: string;
  };
  /** Resolved path to default social sharing image, or undefined if not set. */
  socialImage?: string;
  /** Resolved absolute path to favicon file, or false if disabled. */
  favicon: string | false;
  /** SVG string for the header logo icon, or false if disabled. */
  icon: string | false;
  /** Resolved absolute path to apple-touch-icon, or false if not found. */
  appleTouchIcon: string | false;
  /** Resolved absolute path to ICO fallback (when primary favicon is SVG), or false. */
  faviconFallback: string | false;
  editLink?: {
    repo: string;
    branch: string;
    label: string;
    /** Pre-computed edit URL pattern (includes host-specific path structure). */
    editPattern: string;
  };
  lastUpdated: boolean;
  sitemap: boolean;
  markdown?: DocsMarkdownConfig;
  homeConfigFile?: string;
  packages?: Record<string, { label: string }>;
  /** Resolved asset mappings: output path -> array of resolved absolute source paths. */
  assets: Map<string, string[]>;
  /**
   * Resolved server settings. `devPort` / `previewPort` may still be the
   * literal `'auto'` until the server actually binds (auto resolution happens
   * in `startDev` / `preview`).
   */
  server: {
    host: string;
    devPort: DocsServerPort;
    previewPort: DocsServerPort;
    strictPort: boolean;
    logLevel: DocsLogLevel;
  };
  /** @internal Raw user config — used by validateConfig to distinguish explicit values from fallbacks. */
  _userConfig?: DocsUserConfig;
};

export type DocsBuildOptions = {
  configPath?: string;
  /** Override output directory from CLI (takes precedence over config). */
  outDir?: string;
  /** Override base path from CLI (takes precedence over config and BASE_URL env). */
  basePath?: string;
};

export type DocsDevOptions = DocsBuildOptions & {
  /** Override the resolved port. Use `'auto'` to scan upward from 4000 for the first available port. */
  port?: DocsServerPort;
  open?: boolean;
  /** Logging level for the dev/preview server. Defaults to the value resolved from `server.logLevel` (which itself defaults to `'info'`). */
  logLevel?: DocsLogLevel;
};

export type ConfigValidationIssue = {
  field: string;
  message: string;
  severity: "error" | "warn";
};

export type GitOriginInfo = {
  basePath?: string;
  origin?: string;
  repoOwner?: string;
  repoName?: string;
  repoUrl?: string;
  editLinkHost?: "github" | "gitlab" | "bitbucket";
};
