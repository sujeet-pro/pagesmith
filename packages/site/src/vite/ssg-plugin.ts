/**
 * Vite plugin for static site generation with @pagesmith/site.
 *
 * Handles development (on-the-fly SSR via middleware), production
 * (post-build SSG + pagefind indexing), and preview (clean-URL
 * serving of pre-rendered HTML with 404 fallback).
 *
 * The SSR entry module must export:
 * - `getRoutes(config)` — returns route paths to pre-render
 * - `render(url, config)` — renders a route to an HTML string
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { pagesmithSsg } from '@pagesmith/site/vite'
 *
 * export default defineConfig({
 *   base: '/my-site',
 *   plugins: [pagesmithSsg({ entry: './src/entry-server.tsx' })],
 * })
 * ```
 */

import { existsSync, readFileSync } from "fs";
import { extname, join, resolve } from "path";
import type { Plugin, ResolvedConfig } from "vite";
import { configureSsgDevServer } from "./ssg-hmr";
import { resolveContentDirs, renderStaticSite } from "./ssg-render";
import { runPagefindIndexing } from "./ssg-pagefind";

export type SsgPluginOptions = {
  /** Path to the SSR entry module (e.g., './src/entry-server.tsx') */
  entry: string;
  /** Run pagefind after build (default: true) */
  pagefind?: boolean;
  /** Content roots used for copying companion assets. */
  contentDirs?: string[];
  /**
   * CSS entry file served in dev mode (default: './src/theme.css').
   * Vite transforms this on-the-fly during development.
   *
   * @example './styles/main.css'
   */
  cssEntry?: string;
  /**
   * Output file format for generated pages.
   *
   * When `false` (default), pages emit as `path.html` so `/path` resolves
   * directly without a 301 redirect on GitHub Pages and similar hosts.
   * When `true`, pages emit as `path/index.html` for trailing-slash URLs.
   */
  trailingSlash?: boolean;
};

export type SsgRenderConfig = {
  /** Base path without trailing slash (e.g., '/my-site') */
  base: string;
  /** Absolute path to the project root */
  root: string;
  /** Path to the built CSS asset */
  cssPath: string;
  /** Path to the built JS asset, discovered from index.html in both dev and build */
  jsPath?: string;
  /** Whether search is enabled (false in dev) */
  searchEnabled: boolean;
  /** Whether running in dev mode */
  isDev: boolean;
};

const DEFAULT_CSS_ENTRY = "./src/theme.css";

/**
 * Vite CSS options that turn on the Lightning CSS drafts used by the
 * shared `@pagesmith/site` styles (currently `@custom-media`). Returned
 * shape is compatible with `defineConfig({ ... })` — spread it from a
 * plugin `config()` hook so user-set CSS options keep precedence.
 */
function pagesmithCssLightningOptions() {
  return {
    css: {
      transformer: "lightningcss" as const,
      lightningcss: {
        drafts: { customMedia: true },
      },
    },
  };
}

export function pagesmithSsg(options: SsgPluginOptions): Plugin[] {
  const enablePagefind = options.pagefind !== false;
  const cssEntry = options.cssEntry ?? DEFAULT_CSS_ENTRY;
  let config: ResolvedConfig;
  let projectRoot: string;
  let base: string; // e.g., '/my-site'
  let outDir: string;
  let contentDirs: string[] = [];

  // ── Dev + Preview plugin: SSR middleware and preview serving ──
  const devPlugin: Plugin = {
    name: "pagesmith:ssg-dev",
    apply: "serve",

    config(_, env) {
      const cssDefaults = pagesmithCssLightningOptions();
      if ((env as { isPreview?: boolean }).isPreview) {
        // MPA mode lets Vite's built-in sirv serve static assets
        // while our configurePreviewServer handles clean-URL HTML.
        return { appType: "mpa", ...cssDefaults };
      }
      // Dev mode: disable Vite's SPA HTML serving so the SSG
      // middleware can handle all HTML requests via SSR.
      return { appType: "custom", ...cssDefaults };
    },

    configResolved(resolved) {
      config = resolved;
      projectRoot = resolved.root;
      base = resolved.base.replace(/\/+$/, "");
      outDir = resolve(projectRoot, resolved.build.outDir);
      contentDirs = resolveContentDirs(projectRoot, options.contentDirs);
    },

    configureServer(server) {
      configureSsgDevServer(server, {
        projectRoot,
        base,
        contentDirs,
        entry: options.entry,
        cssEntry,
      });
    },

    configurePreviewServer(server) {
      // Pre-middleware: serve SSG HTML for clean-URL navigation requests.
      // Vite's sirv (in MPA mode) handles static assets but may not
      // resolve /path → /path/index.html for all servers.
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "/";
        const pathname = url.split(/[?#]/u, 1)[0] ?? url;

        const pathExt = extname(pathname);
        if (pathExt) return next();

        const accept = req.headers.accept ?? "";
        if (!accept.includes("text/html")) return next();

        // Strip base prefix (Vite's base middleware may or may not have done this)
        let routePath = pathname;
        if (base && routePath.startsWith(base)) {
          routePath = routePath.slice(base.length) || "/";
        }
        if (!routePath.startsWith("/")) routePath = "/" + routePath;
        const cleanPath = routePath.replace(/\/$/u, "") || "/";

        let htmlPath: string | undefined;
        if (cleanPath === "/") {
          htmlPath = join(outDir, "index.html");
        } else {
          const stripped = cleanPath.replace(/^\//, "");
          const flatPath = join(outDir, `${stripped}.html`);
          const dirPath = join(outDir, stripped, "index.html");
          htmlPath = existsSync(flatPath) ? flatPath : existsSync(dirPath) ? dirPath : undefined;
        }

        if (htmlPath && existsSync(htmlPath)) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(readFileSync(htmlPath));
          return;
        }

        // Fallback to custom 404 page
        const notFoundPath = join(outDir, "404.html");
        if (existsSync(notFoundPath)) {
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
          res.end(readFileSync(notFoundPath));
          return;
        }

        next();
      });
    },
  };

  // ── Build plugin: SSG post-build ──
  const buildPlugin: Plugin = {
    name: "pagesmith:ssg-build",
    apply: "build",

    config() {
      // Vite 8 defaults `build.cssMinify` to `'lightningcss'` and uses
      // Lightning CSS for transforms. The shared @pagesmith/site CSS uses
      // `@custom-media` (a CSS Media Queries Level 5 draft) for breakpoint
      // tokens — wire the draft on so the example/preset builds don't
      // emit `Unknown at rule: @custom-media` warnings.
      return pagesmithCssLightningOptions();
    },

    configResolved(resolved) {
      config = resolved;
      projectRoot = resolved.root;
      base = resolved.base.replace(/\/+$/, "");
      outDir = resolve(projectRoot, resolved.build.outDir);
      contentDirs = resolveContentDirs(projectRoot, options.contentDirs);
    },

    async closeBundle() {
      // Skip SSG during the SSR build itself (detected by ssr option)
      if (config.build.ssr) return;

      const pageCount = await renderStaticSite({
        config,
        projectRoot,
        base,
        outDir,
        contentDirs,
        entry: options.entry,
        trailingSlash: options.trailingSlash ?? false,
      });

      if (enablePagefind) {
        try {
          runPagefindIndexing(outDir, {
            logPrefix: "SSG",
            logStart: true,
            logger: { info: console.info, warn: console.warn },
          });
        } catch (error) {
          throw new Error(
            `SSG: Pagefind indexing failed: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
      }

      console.info(`SSG: Done — ${pageCount} pages generated`);
    },
  };

  return [devPlugin, buildPlugin];
}
