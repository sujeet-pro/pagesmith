/**
 * Build-time NPM registry helpers.
 *
 * Fetches the latest published version for a package from the public NPM
 * registry and caches the result on disk under
 * `node_modules/.cache/pagesmith-docs-npm/versions.json` so repeated builds
 * (incremental rebuilds, dev server, parallel page renders) hit the registry
 * at most once per package per cache window.
 *
 * Network and registry errors degrade gracefully — callers receive `undefined`
 * and rendering proceeds without the badge / version pill instead of failing
 * the build. This keeps offline builds and CI cold-starts robust.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const REGISTRY_BASE = "https://registry.npmjs.org";
/** Cache window for resolved versions (1 hour). Keeps dev/build fast without going stale for long. */
const CACHE_TTL_MS = 60 * 60 * 1000;
/** Per-request hard ceiling so a slow registry can never block a build for long.
 *  Generous enough to absorb a cold DNS+TLS handshake on a fresh CI runner. */
const REQUEST_TIMEOUT_MS = 10_000;

type CacheEntry = {
  version: string | null;
  fetchedAt: number;
};

type CacheFile = Record<string, CacheEntry>;

let memoryCache: CacheFile | null = null;
let cacheFilePath: string | null = null;
const inFlight = new Map<string, Promise<string | undefined>>();

function ensureCacheLoaded(rootDir: string): CacheFile {
  if (memoryCache && cacheFilePath) return memoryCache;
  const cacheDir = join(rootDir, "node_modules", ".cache", "pagesmith-docs-npm");
  mkdirSync(cacheDir, { recursive: true });
  cacheFilePath = join(cacheDir, "versions.json");
  if (existsSync(cacheFilePath)) {
    try {
      const raw = readFileSync(cacheFilePath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        memoryCache = parsed as CacheFile;
        return memoryCache;
      }
    } catch {
      // Fall through to fresh cache — corrupt cache files are silently rebuilt.
    }
  }
  memoryCache = {};
  return memoryCache;
}

function persistCache(): void {
  if (!cacheFilePath || !memoryCache) return;
  try {
    writeFileSync(cacheFilePath, JSON.stringify(memoryCache, null, 2), "utf-8");
  } catch {
    // Cache writes are best-effort; a read-only filesystem must not break the build.
  }
}

async function fetchVersionFromRegistry(packageName: string): Promise<string | null> {
  const url = `${REGISTRY_BASE}/${encodeNpmName(packageName)}/latest`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(
        `[pagesmith] npm registry returned ${response.status} for ${packageName}; will fall back to local node_modules if available.`,
      );
      return null;
    }
    const json = (await response.json()) as { version?: unknown };
    return typeof json.version === "string" ? json.version : null;
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(
      `[pagesmith] npm registry fetch failed for ${packageName} (${reason}); will fall back to local node_modules if available.`,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read the installed version of a package from `node_modules/<name>/package.json`.
 *
 * Used as a fallback when the registry is unreachable (cold CI runners, offline
 * builds) so the NPM badge still renders with the correct version. Returns
 * `undefined` when the package is not installed locally.
 */
function resolveLocalPackageVersion(packageName: string, rootDir: string): string | undefined {
  try {
    const pkgPath = join(rootDir, "node_modules", packageName, "package.json");
    if (!existsSync(pkgPath)) return undefined;
    const raw = readFileSync(pkgPath, "utf-8");
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}

/** Encode a scoped npm package name for the registry URL — `@scope/name` → `@scope%2Fname`. */
function encodeNpmName(name: string): string {
  if (name.startsWith("@")) {
    const slash = name.indexOf("/");
    if (slash > 0) {
      return `${name.slice(0, slash)}%2F${encodeURIComponent(name.slice(slash + 1))}`;
    }
  }
  return encodeURIComponent(name);
}

/**
 * Resolve the latest published version for an npm package.
 *
 * Returns `undefined` when the package is unpublished, the registry is
 * unreachable, the request times out, or the response shape is unexpected —
 * callers should treat that as "no version available" and skip badge rendering.
 */
export async function getLatestNpmVersion(
  packageName: string,
  rootDir: string,
): Promise<string | undefined> {
  if (!packageName.trim()) return undefined;
  const cache = ensureCacheLoaded(rootDir);
  const entry = cache[packageName];
  const now = Date.now();
  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.version ?? undefined;
  }

  const existing = inFlight.get(packageName);
  if (existing) return existing;

  const promise = (async () => {
    const registryVersion = await fetchVersionFromRegistry(packageName);
    if (registryVersion) {
      cache[packageName] = { version: registryVersion, fetchedAt: Date.now() };
      persistCache();
      return registryVersion;
    }
    // Registry failed or returned nothing — fall back to the locally installed
    // version. This keeps the badge correct on CI runners where the first
    // outbound HTTPS call is slow enough to hit the abort, and in fully
    // offline builds.
    const localVersion = resolveLocalPackageVersion(packageName, rootDir);
    if (localVersion) {
      cache[packageName] = { version: localVersion, fetchedAt: Date.now() };
      persistCache();
      return localVersion;
    }
    cache[packageName] = { version: null, fetchedAt: Date.now() };
    persistCache();
    return undefined;
  })();
  inFlight.set(packageName, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(packageName);
  }
}

/** Reset module-level state. Exposed for test suites; not part of the public surface. */
export function __resetNpmVersionCacheForTests(): void {
  memoryCache = null;
  cacheFilePath = null;
  inFlight.clear();
}
