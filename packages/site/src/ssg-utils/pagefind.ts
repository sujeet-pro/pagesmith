import { existsSync, readFileSync } from "fs";
import { execFileSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export type PagefindLogger = {
  info?(message: string): void;
  warn?(message: string): void;
};

export type PagefindIndexOptions = {
  extraFlags?: string[];
  logPrefix?: string;
  logStart?: boolean;
  logger?: PagefindLogger;
  /**
   * Control how the pagefind child process's stdio is connected. Defaults to
   * `"inherit"` so CLI users see live indexing output. Tests that exercise
   * pagefind failure paths can pass `"ignore"` to keep the runner output
   * focused on real assertions instead of inheriting the binary's stderr.
   */
  stdio?: "inherit" | "ignore" | "pipe";
};

function resolvePackageRoot(startPath: string): string {
  let current = dirname(startPath);

  while (true) {
    const pkgPath = join(current, "package.json");
    if (existsSync(pkgPath)) return current;

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not resolve package root from: ${startPath}`);
    }
    current = parent;
  }
}

function resolvePagefindBinaryPath(): string {
  const pagefindEntry = fileURLToPath(import.meta.resolve("pagefind"));
  const packageRoot = resolvePackageRoot(pagefindEntry);
  const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf-8")) as {
    bin?: string | Record<string, string>;
  };

  const binPath =
    typeof packageJson.bin === "string"
      ? packageJson.bin
      : (packageJson.bin?.pagefind ?? Object.values(packageJson.bin ?? {})[0]);

  if (binPath) {
    const resolvedFromPackageJson = join(packageRoot, binPath);
    if (existsSync(resolvedFromPackageJson)) {
      return resolvedFromPackageJson;
    }
  }

  const legacyCandidate = join(packageRoot, "lib", "runner", "bin.cjs");
  if (existsSync(legacyCandidate)) {
    return legacyCandidate;
  }

  throw new Error(`Could not resolve Pagefind CLI entry from package metadata at ${packageRoot}`);
}

function isMissingPagefindDependency(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("pagefind") &&
    (message.includes("ERR_MODULE_NOT_FOUND") ||
      message.includes("Cannot find package") ||
      message.includes("Cannot find module"))
  );
}

export function runPagefindIndexing(outDir: string, options: PagefindIndexOptions = {}): void {
  const logger = options.logger ?? { info: console.info, warn: console.warn };
  const prefix = options.logPrefix ?? "Pagefind";

  if (options.logStart) {
    logger.info?.(`${prefix}: Indexing with Pagefind...`);
  }

  try {
    const pagefindBin = resolvePagefindBinaryPath();
    // Default the pagefind child stdio to `"inherit"` for CLI users, but
    // automatically demote to `"ignore"` when running under Vitest so tests
    // that intentionally trigger pagefind failures do not pollute the
    // runner output with the binary's own stderr.
    const defaultStdio = process.env.VITEST ? "ignore" : "inherit";
    execFileSync(process.execPath, [pagefindBin, "--site", outDir, ...(options.extraFlags ?? [])], {
      stdio: options.stdio ?? defaultStdio,
    });
  } catch (error) {
    if (isMissingPagefindDependency(error)) {
      logger.warn?.(`${prefix}: Pagefind is not installed, skipping search indexing`);
      return;
    }
    throw error;
  }
}
