// Pure logic for the "MIGRATING.md must cover the version being published"
// release gate. Kept in its own side-effect-free module (no top-level I/O,
// no `process.exit`) so it can be unit tested directly — importing
// `scripts/validate-pagesmith.ts` itself would execute the whole validation
// script, including its own `process.exit()` call.

const HEADING_VERSION_PATTERN = /^##\s+(\d+\.\d+\.\d+)\b/;

export interface MigratingCoverageResult {
  ok: boolean;
  /** The first `## X.Y.Z` version found in MIGRATING.md, or `null` if none. */
  headingVersion: string | null;
  message: string;
}

/** Find the first `## X.Y.Z (...)` heading in MIGRATING.md's body. */
export function findTopMigratingVersion(content: string): string | null {
  for (const rawLine of content.split("\n")) {
    const match = HEADING_VERSION_PATTERN.exec(rawLine.trim());
    if (match) return match[1]!;
  }
  return null;
}

/** Compare two `major.minor.patch` strings. Negative when `a` < `b`. */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Release gate: the top-most `## X.Y.Z (...)` heading in MIGRATING.md must be
 * at or ahead of `packageVersion` — the version on disk in
 * `packages/core/package.json`, which the publish workflow's `sync:versions`
 * step bumps to the release version before this check runs (see
 * `.github/workflows/publish.yml`'s `prepare` job and the `validate-pagesmith`
 * job that runs after it).
 *
 * - Heading BEHIND the package version → FAIL. A release happened (or is
 *   about to) without a matching MIGRATING.md entry — exactly the drift this
 *   check exists to catch (see the 0.10.0 section that went missing while
 *   the top heading still said "0.9.9 (next)").
 * - Heading AT or AHEAD of the package version → PASS. "Ahead" covers the
 *   normal pre-release state where the top section documents work in flight
 *   under a "(next)" label for a version not yet cut.
 */
export function checkMigratingCoversVersion(
  content: string,
  packageVersion: string,
): MigratingCoverageResult {
  const headingVersion = findTopMigratingVersion(content);
  if (!headingVersion) {
    return {
      ok: false,
      headingVersion: null,
      message: "MIGRATING.md has no top-level `## X.Y.Z (...)` version heading.",
    };
  }

  if (compareVersions(headingVersion, packageVersion) < 0) {
    return {
      ok: false,
      headingVersion,
      message:
        `MIGRATING.md's top heading is ${headingVersion}, behind the package version ` +
        `${packageVersion}. Add a "## ${packageVersion} (...)" section (or newer) before releasing.`,
    };
  }

  return {
    ok: true,
    headingVersion,
    message: `MIGRATING.md's top heading (${headingVersion}) covers package version ${packageVersion}.`,
  };
}
