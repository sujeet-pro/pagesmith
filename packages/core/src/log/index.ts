/**
 * `@pagesmith/core/log` — color-coded server-side logger.
 *
 * Server-only. Browser bundles MUST NOT import this module: it is intended
 * for CLIs, build pipelines, dev/preview HTTP servers, Vite plugins, and
 * other Node-runtime code paths. Browser code should not log to `console`
 * at all (lint-enforced); user-facing messages belong in the UI.
 *
 * Why a custom logger:
 *   - Consistent level filtering across CLIs (`silent | error | warn | info | verbose`).
 *   - ANSI color coding per level so warnings and errors stand out in TTYs
 *     and CI logs. Colors are auto-disabled when:
 *       - `process.env.NO_COLOR` is set (https://no-color.org/)
 *       - `process.env.FORCE_COLOR === '0'`
 *       - the underlying stream is not a TTY (e.g. piped output)
 *   - Optional per-logger `prefix` so subsystems can tag their lines
 *     (e.g. `[pagesmith:ssg]`) without callers repeating the prefix.
 *   - Errors are written to `stderr`; everything else goes to `stdout`. This
 *     keeps protocol channels (e.g. MCP servers reserving `stdout`) clean
 *     when they pin the logger to `stderr` via `error()`.
 */

export type LogLevel = "silent" | "error" | "warn" | "info" | "verbose";

export type LogMethod = (message: string, ...args: unknown[]) => void;

export interface Logger {
  readonly level: LogLevel;
  readonly prefix?: string;
  shouldLog(minimum: LogLevel): boolean;
  /** Write to `stderr`. Always shown unless `level === 'silent'`. */
  error: LogMethod;
  /** Write to `stdout`. Shown when level is `warn` or higher. */
  warn: LogMethod;
  /** Write to `stdout`. Shown when level is `info` or higher. */
  info: LogMethod;
  /** Write to `stdout`. Shown only when level is `verbose`. */
  verbose: LogMethod;
  /** Return a child logger that prepends `childPrefix` after the parent's prefix. */
  child(childPrefix: string): Logger;
}

export interface CreateLoggerOptions {
  /** Minimum severity to emit. Defaults to `'info'`. */
  level?: LogLevel;
  /** Optional tag rendered before every message (color-stripped on no-color streams). */
  prefix?: string;
  /**
   * Force-enable or force-disable colors. When unset, colors are inferred
   * from `NO_COLOR`, `FORCE_COLOR`, and stream `isTTY`.
   */
  color?: boolean;
}

const LOG_RANK: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
};

const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  cyan: "\u001b[36m",
  gray: "\u001b[90m",
} as const;

type Stream = "stdout" | "stderr";

function detectColor(stream: Stream): boolean {
  if (typeof process === "undefined") return false;
  const env = process.env ?? {};
  if (env.NO_COLOR && env.NO_COLOR !== "") return false;
  if (env.FORCE_COLOR === "0" || env.FORCE_COLOR === "false") return false;
  if (env.FORCE_COLOR && env.FORCE_COLOR !== "") return true;
  const target = stream === "stderr" ? process.stderr : process.stdout;
  return Boolean(target && (target as { isTTY?: boolean }).isTTY);
}

function paint(text: string, color: keyof typeof ANSI, enable: boolean): string {
  return enable ? `${ANSI[color]}${text}${ANSI.reset}` : text;
}

const LEVEL_BADGE: Record<
  Exclude<LogLevel, "silent">,
  { label: string; color: keyof typeof ANSI }
> = {
  error: { label: "error", color: "red" },
  warn: { label: "warn", color: "yellow" },
  info: { label: "info", color: "blue" },
  verbose: { label: "debug", color: "gray" },
};

function format(
  level: Exclude<LogLevel, "silent">,
  message: string,
  prefix: string | undefined,
  color: boolean,
): string {
  const badge = LEVEL_BADGE[level];
  const tag = paint(badge.label.padEnd(5), badge.color, color);
  if (prefix) {
    const tinted = paint(prefix, "cyan", color);
    return `${tag} ${tinted} ${message}`;
  }
  return `${tag} ${message}`;
}

function write(stream: Stream, line: string, args: unknown[]): void {
  // The logger module is the single sanctioned wrapper for `console`.
  // Bypass `no-console` here because we forward to `process.stdout` /
  // `process.stderr` semantics — `console.info` is locale-formatted and
  // bound to stdout, but we want unbuffered raw writes to honor the
  // chosen stream. Using `process.stdout.write` keeps the byte stream
  // explicit and avoids `console`'s own buffering quirks.
  const target = stream === "stderr" ? process.stderr : process.stdout;
  const suffix = line.endsWith("\n") ? "" : "\n";
  if (args.length === 0) {
    target.write(`${line}${suffix}`);
    return;
  }
  // For structured args, fall back to `console` so it formats objects
  // (deep inspect) like a developer expects.
  if (stream === "stderr") console.error(line, ...args);
  else console.info(line, ...args);
}

/**
 * Create a color-coded logger. Cheap (no I/O) so it can be created once per
 * subsystem and passed around via options bags.
 */
export function createLogger(options: CreateLoggerOptions | LogLevel = {}): Logger {
  const opts: CreateLoggerOptions = typeof options === "string" ? { level: options } : options;
  const level: LogLevel = opts.level ?? "info";
  const prefix = opts.prefix;
  const colorStdout = opts.color ?? detectColor("stdout");
  const colorStderr = opts.color ?? detectColor("stderr");

  const rank = LOG_RANK[level];
  const shouldLog = (minimum: LogLevel): boolean => rank >= LOG_RANK[minimum];

  const logger: Logger = {
    level,
    prefix,
    shouldLog,
    error(message, ...args) {
      if (!shouldLog("error")) return;
      write("stderr", format("error", message, prefix, colorStderr), args);
    },
    warn(message, ...args) {
      if (!shouldLog("warn")) return;
      write("stdout", format("warn", message, prefix, colorStdout), args);
    },
    info(message, ...args) {
      if (!shouldLog("info")) return;
      write("stdout", format("info", message, prefix, colorStdout), args);
    },
    verbose(message, ...args) {
      if (!shouldLog("verbose")) return;
      write("stdout", format("verbose", message, prefix, colorStdout), args);
    },
    child(childPrefix) {
      const merged = prefix ? `${prefix} ${childPrefix}` : childPrefix;
      return createLogger({ level, prefix: merged, color: opts.color });
    },
  };

  return logger;
}

/**
 * Module-level default logger. Inherits `PAGESMITH_LOG_LEVEL` from the env
 * if set (one of `silent | error | warn | info | verbose`), otherwise `info`.
 *
 * Prefer `createLogger({ prefix })` when a subsystem can pass a logger
 * around; reach for `defaultLogger` only at top-level scripts where
 * threading an instance is impractical.
 */
export const defaultLogger: Logger = createLogger({
  level: resolveEnvLevel() ?? "info",
});

function resolveEnvLevel(): LogLevel | undefined {
  if (typeof process === "undefined") return undefined;
  const raw = process.env?.PAGESMITH_LOG_LEVEL?.trim().toLowerCase();
  if (!raw) return undefined;
  if (raw === "silent" || raw === "error" || raw === "warn" || raw === "info" || raw === "verbose")
    return raw;
  return undefined;
}
