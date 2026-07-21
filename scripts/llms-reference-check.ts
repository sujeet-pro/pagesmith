// Pure logic for the example llms*.txt staleness guard used by
// `scripts/validate-examples.ts`. Kept side-effect-free (no filesystem
// access) so it can be unit tested with plain strings, and reused for both
// `llms.txt` and `llms-full.txt` across every example workspace.
//
// Why a dangling-reference scan instead of true "regenerate and diff":
// the 16 committed `examples/*/llms.txt` + `examples/*/llms-full.txt` files
// are curated, per-example AI-context digests (see `prj-maintain-examples`)
// — there is no deterministic generator that reproduces their prose from
// source, and the closest thing to "regeneration" (rebuilding every example
// via `vite build`/`next build`, ~minutes) is exactly the "full example
// build" this check is meant to avoid paying for on every validate run.
//
// Instead we scope down to a cheap, deterministic subset of the same
// staleness class the full regen would catch: every backtick-quoted
// file-like path mentioned in a committed llms*.txt must still resolve to a
// real file. Renaming/moving/deleting a file that an example's llms.txt
// still references — the actual failure mode "the docs drifted from the
// code" describes — makes this fail; unrelated prose edits do not.

/** Backtick-quoted, extensioned, path-shaped tokens: `src/content.ts`, `README.md`, ... */
const FILE_REFERENCE_PATTERN =
  /`([A-Za-z0-9_.-][A-Za-z0-9_./-]*\.(?:md|mdx|ts|tsx|js|jsx|mjs|cjs|json|json5|css|txt|yaml|yml|toml|html))`/g;

/** Extract every backtick-quoted file-like reference from `content`, in order, without de-duplicating. */
export function extractFileReferences(content: string): string[] {
  return [...content.matchAll(FILE_REFERENCE_PATTERN)].map((match) => match[1]!);
}

export interface DanglingReferenceOptions {
  /**
   * References to skip entirely — for mentions that are illustrative rather
   * than referential (e.g. "not a `content.config.ts` collection example"
   * contrasting with a convention this example does NOT use).
   */
  ignore?: ReadonlySet<string>;
}

/**
 * Return every distinct reference extracted from `content` for which
 * `resolveExists(ref)` is false, skipping anything in `options.ignore`.
 * `resolveExists` is injected so callers can layer in whatever resolution
 * strategy fits (relative-to-example, relative-to-repo-root, basename
 * search, ...) without this module touching the filesystem itself.
 */
export function findDanglingReferences(
  content: string,
  resolveExists: (ref: string) => boolean,
  options: DanglingReferenceOptions = {},
): string[] {
  const ignore = options.ignore ?? new Set<string>();
  const seen = new Set<string>();
  const dangling: string[] = [];

  for (const ref of extractFileReferences(content)) {
    if (ignore.has(ref) || seen.has(ref)) continue;
    seen.add(ref);
    if (!resolveExists(ref)) dangling.push(ref);
  }

  return dangling;
}
