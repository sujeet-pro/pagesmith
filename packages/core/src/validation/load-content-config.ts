/**
 * Auto-discover and load a project's `content.config.ts` (or `.mts/.mjs/.js`)
 * so the content validator can apply each collection's Zod schema to the
 * markdown files it owns.
 *
 * Why this exists:
 *  - `content.config.*` is the canonical place where Pagesmith users declare
 *    their typed collections (`defineCollections({ ... })`).
 *  - Each collection carries `directory + include + schema`. By replaying
 *    those globs we know exactly which schema to apply to each markdown file.
 *  - Node 24 strips TypeScript types from dynamic imports automatically, so a
 *    pure `.mjs` CLI binary can load a `.ts` config without an extra build
 *    step or runtime loader.
 */

import { existsSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import { pathToFileURL } from "url";
import fg from "fast-glob";
import type { ZodType } from "zod";

const DEFAULT_CONFIG_BASENAMES = [
  "content.config.ts",
  "content.config.mts",
  "content.config.mjs",
  "content.config.js",
];

export type DiscoveredContentConfig = {
  /** Absolute path of the resolved config module. */
  filePath: string;
  /** Project root the config lives under (used to resolve `directory` paths). */
  projectRoot: string;
};

/**
 * Walk the candidate directories looking for the first `content.config.*`
 * file. Returns `null` when none is found (auto-load is opt-out).
 */
export function discoverContentConfig(
  searchDirs: readonly string[],
  basenames: readonly string[] = DEFAULT_CONFIG_BASENAMES,
): DiscoveredContentConfig | null {
  for (const dir of searchDirs) {
    const projectRoot = resolve(dir);
    for (const name of basenames) {
      const candidate = resolve(projectRoot, name);
      if (existsSync(candidate)) {
        return { filePath: candidate, projectRoot };
      }
    }
  }
  return null;
}

/**
 * Minimal shape we need from a collection definition. Mirrors the public
 * `CollectionDef` from `defineCollection` so we stay schema-agnostic and do
 * not import the full type graph here.
 */
export type LoadedCollection = {
  /** Loader identifier — `'markdown'` is the only kind that participates in markdown validation. */
  loader: string | { kind?: string };
  /** Directory relative to the project root. */
  directory: string;
  /** Include glob patterns relative to `directory`. */
  include?: string[];
  /** Exclude glob patterns relative to `directory`. */
  exclude?: string[];
  /** Optional Zod schema applied to each entry in this collection. */
  schema?: ZodType;
};

export type LoadedCollections = Record<string, LoadedCollection>;

/** Pull the `collections` map from a loaded module. */
function pickCollections(mod: Record<string, unknown>): LoadedCollections | null {
  const candidates = [mod.default, mod.collections, mod.config];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const obj = candidate as Record<string, unknown>;
      // Heuristic: must look like a map of collections, not the wrapped
      // `{ root, collections }` returned by `defineConfig`.
      if ("collections" in obj && typeof obj.collections === "object") {
        return obj.collections as LoadedCollections;
      }
      // Treat plain objects whose values look like collection defs as the map.
      const values = Object.values(obj);
      if (
        values.length > 0 &&
        values.every(
          (value) => value && typeof value === "object" && "directory" in (value as object),
        )
      ) {
        return obj as LoadedCollections;
      }
    }
  }
  return null;
}

/**
 * Dynamically import the discovered config and extract the collections map.
 *
 * Node 24's automatic TypeScript type-stripping handles `.ts` files
 * transparently. Files that import other relative TS modules also resolve
 * because Node uses the file:// URL of the importer.
 */
export async function loadContentCollections(
  configPath: string,
): Promise<LoadedCollections | null> {
  const url = pathToFileURL(isAbsolute(configPath) ? configPath : resolve(configPath)).href;
  const mod = (await import(/* @vite-ignore */ /* webpackIgnore: true */ url)) as Record<
    string,
    unknown
  >;
  return pickCollections(mod);
}

export type FileSchemaEntry = {
  collectionName: string;
  schema?: ZodType;
  loaderKind: string;
};

/**
 * Walk every collection's `directory + include` patterns and build a lookup
 * from absolute file path to the collection (and its schema) that owns it.
 *
 * Earlier collections in declaration order win when a file matches more than
 * one collection — this lets users put a more-specific collection first to
 * intentionally override the broader one.
 */
export async function buildFileSchemaMap(
  collections: LoadedCollections,
  projectRoot: string,
): Promise<Map<string, FileSchemaEntry>> {
  const map = new Map<string, FileSchemaEntry>();
  for (const [collectionName, definition] of Object.entries(collections)) {
    const loaderKind =
      typeof definition.loader === "string"
        ? definition.loader
        : (definition.loader?.kind ?? "data");
    if (loaderKind !== "markdown") continue;

    const baseDir = resolve(projectRoot, definition.directory);
    if (!existsSync(baseDir)) continue;

    const include = definition.include ?? ["**/*.md", "**/*.mdx"];
    const exclude = definition.exclude ?? [];
    const matched = await fg(include, {
      cwd: baseDir,
      absolute: true,
      ignore: exclude,
      onlyFiles: true,
      dot: false,
    });

    for (const filePath of matched) {
      if (map.has(filePath)) continue;
      map.set(filePath, {
        collectionName,
        schema: definition.schema,
        loaderKind,
      });
    }
  }
  return map;
}

/**
 * High-level helper: discover, load, and build the per-file schema lookup
 * in one call. Returns `null` when no config is found (the validator falls
 * back to schema-less structural validation).
 */
export async function loadContentSchemaMap(searchDirs: readonly string[]): Promise<{
  configPath: string;
  projectRoot: string;
  collections: LoadedCollections;
  schemaByFile: Map<string, FileSchemaEntry>;
} | null> {
  const discovered = discoverContentConfig(searchDirs);
  if (!discovered) return null;
  const collections = await loadContentCollections(discovered.filePath);
  if (!collections) return null;
  const schemaByFile = await buildFileSchemaMap(collections, dirname(discovered.filePath));
  return {
    configPath: discovered.filePath,
    projectRoot: dirname(discovered.filePath),
    collections,
    schemaByFile,
  };
}
