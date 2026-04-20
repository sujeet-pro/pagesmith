import { exec, execFile } from "child_process";
import { existsSync, readFileSync } from "fs";
import { createServer as createNetServer } from "net";
import { extname, join, resolve, sep } from "path";
import type { ServerResponse } from "http";
import { createLogger as createCoreLogger, type Logger } from "@pagesmith/core/log";
import type { SiteModel } from "../content";
import type { DocsLogLevel, DocsServerPort, ResolvedDocsConfig } from "../config";

/**
 * Lower bound for `port: "auto"` resolution. Both the dev and preview servers
 * scan upward from this number for the first available port.
 */
export const AUTO_PORT_BASE = 4000;
const AUTO_PORT_MAX_ATTEMPTS = 100;
const STRICT_FALLBACK_MAX_ATTEMPTS = 20;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

const WS_CLIENT_SCRIPT = `<script>
(function() {
  var retries = 0;
  var ws = new WebSocket('ws://' + location.host + '/__ws');
  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    if (msg.type === 'reload') location.reload();
  };
  ws.onclose = function() {
    if (retries++ < 5) {
      setTimeout(function() { location.reload(); }, 1000 * retries);
    }
  };
})();
</script>`;

/**
 * Build a docs-aware server logger backed by `@pagesmith/core/log`.
 *
 * `DocsLogLevel` is a strict subset of the core `LogLevel` (it adds no levels),
 * so the values pass through unchanged. The `prefix` is fixed to
 * `[pagesmith:docs]` for visibility in CI logs.
 */
export function createLogger(level: DocsLogLevel = "warn"): Logger {
  return createCoreLogger({ level, prefix: "[pagesmith:docs]" });
}

export function serveFile(
  filePath: string,
  res: ServerResponse,
  injectReload = false,
  statusCode = 200,
): void {
  const ext = extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";
  const body = readFileSync(filePath);

  if (ext === ".html" && injectReload) {
    const html = body.toString().replace("</body>", `${WS_CLIENT_SCRIPT}</body>`);
    res.writeHead(statusCode, { "Content-Type": contentType });
    res.end(html);
    return;
  }

  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(body);
}

export function logStartupSummary(
  config: ResolvedDocsConfig,
  model: SiteModel,
  baseUrl: string,
  logger: Logger = createLogger("info"),
): void {
  const pageCount = model.pageByPath.size;
  const sectionCount = model.sidebarBySection.size;

  logger.info(`  ${pageCount} pages in ${sectionCount} sections`);
  logger.info("");

  for (const [, sections] of model.sidebarBySection) {
    const itemCount = sections.reduce((sum, s) => sum + s.items.length, 0);
    const title = sections[0]?.title ?? "(unknown)";
    const firstPath = sections[0]?.items[0]?.path ?? "";
    const origin = new URL(baseUrl).origin;
    const url = firstPath ? `${origin}${firstPath}` : baseUrl;
    logger.info(`  ${title} (${itemCount} pages)  ${url}`);
  }

  logger.info("");
}

export function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  if (process.platform === "win32") {
    exec(`${cmd} ${JSON.stringify(url)}`);
  } else {
    execFile(cmd, [url], () => {});
  }
}

export type StaticRequestResult =
  | { type: "redirect"; location: string }
  | { type: "file"; filePath: string; statusCode: number }
  | { type: "not-found" };

function resolvePathWithinRoot(rootDir: string, requestPath: string): string | undefined {
  const resolvedRoot = resolve(rootDir);
  const resolvedPath = resolve(resolvedRoot, `.${requestPath}`);
  return resolvedPath === resolvedRoot || resolvedPath.startsWith(`${resolvedRoot}${sep}`)
    ? resolvedPath
    : undefined;
}

/**
 * Resolve an incoming request pathname to a static file, handling basePath
 * stripping, directory index resolution, and 404 fallback. Shared between
 * dev and preview servers.
 */
export function resolveStaticRequest(
  pathname: string,
  basePath: string,
  outDir: string,
): StaticRequestResult {
  if (basePath && (pathname === "/" || pathname === "")) {
    return { type: "redirect", location: basePath };
  }
  if (basePath && pathname === `${basePath}/`) {
    return { type: "redirect", location: basePath };
  }

  if (basePath && pathname !== basePath && pathname !== `${basePath}/`) {
    if (!pathname.startsWith(`${basePath}/`)) {
      return { type: "not-found" };
    }
  }

  let stripped = pathname;
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    stripped = pathname.slice(basePath.length) || "/";
  }

  if (stripped.length > 1 && stripped.endsWith("/")) {
    const trimmed = stripped.replace(/\/+$/, "");
    return {
      type: "redirect",
      location: basePath ? `${basePath}${trimmed}` : trimmed,
    };
  }

  const resolvedPath = resolvePathWithinRoot(outDir, stripped);
  if (!resolvedPath) {
    return { type: "not-found" };
  }

  let filePath = resolvedPath;

  // GitHub Pages-compatible resolution: for paths without a file extension,
  // try path.html first (trailingSlash: false), then path/index.html (trailingSlash: true).
  if (!existsSync(filePath) || !extname(filePath)) {
    const flatHtml = `${resolvedPath}.html`;
    const dirIndex = join(resolvedPath, "index.html");
    if (existsSync(flatHtml)) filePath = flatHtml;
    else if (existsSync(dirIndex)) filePath = dirIndex;
  }

  if (!existsSync(filePath)) {
    const notFoundDir = join(outDir, "404", "index.html");
    const notFoundFile = join(outDir, "404.html");
    if (existsSync(notFoundDir)) return { type: "file", filePath: notFoundDir, statusCode: 404 };
    if (existsSync(notFoundFile)) return { type: "file", filePath: notFoundFile, statusCode: 404 };
    return { type: "not-found" };
  }

  return { type: "file", filePath, statusCode: 200 };
}

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createNetServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

export async function findAvailablePort(
  startPort: number,
  strictPort: boolean,
  label: string,
  logger: ReturnType<typeof createLogger> = createLogger("warn"),
): Promise<number> {
  if (await isPortAvailable(startPort)) return startPort;
  if (strictPort) {
    throw new Error(
      `Port ${startPort} is already in use (${label}). Disable strictPort to auto-find an available port.`,
    );
  }
  for (
    let port = startPort + 1;
    port < startPort + STRICT_FALLBACK_MAX_ATTEMPTS && port <= 65535;
    port++
  ) {
    if (await isPortAvailable(port)) {
      logger.info(`  Port ${startPort} in use, using ${port} (${label})`);
      return port;
    }
  }
  throw new Error(
    `No available port found in range ${startPort}–${startPort + STRICT_FALLBACK_MAX_ATTEMPTS - 1} for ${label}`,
  );
}

/**
 * Scan upward from `startPort` and return the first port whose bind succeeds.
 * Used when `port: "auto"` is in effect — `strictPort` does not apply.
 */
export async function findFirstAvailablePort(
  startPort: number,
  label: string,
  logger: ReturnType<typeof createLogger> = createLogger("warn"),
): Promise<number> {
  for (let port = startPort; port < startPort + AUTO_PORT_MAX_ATTEMPTS && port <= 65535; port++) {
    if (await isPortAvailable(port)) {
      logger.info(`  Auto-selected port ${port} for ${label}`);
      return port;
    }
  }
  throw new Error(
    `No available port found in range ${startPort}–${startPort + AUTO_PORT_MAX_ATTEMPTS - 1} for ${label}`,
  );
}

/**
 * Resolve a `DocsServerPort` (number or `"auto"`) to a concrete bindable port.
 * `"auto"` always scans upward from {@link AUTO_PORT_BASE}; numeric ports honor
 * `strictPort` (throw vs scan upward).
 */
export async function resolveServerPort(
  port: DocsServerPort,
  strictPort: boolean,
  label: string,
  logger: ReturnType<typeof createLogger> = createLogger("warn"),
): Promise<number> {
  if (port === "auto") {
    return findFirstAvailablePort(AUTO_PORT_BASE, label, logger);
  }
  return findAvailablePort(port, strictPort, label, logger);
}
