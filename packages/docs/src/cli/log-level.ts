export type LogLevel = "silent" | "error" | "warn" | "info" | "verbose";

export function parseLogLevel(input: string): LogLevel {
  const normalized = input.trim().toLowerCase();
  if (normalized === "silent") return "silent";
  if (normalized === "error" || normalized === "errors") return "error";
  if (normalized === "warn" || normalized === "warning" || normalized === "warnings") return "warn";
  if (normalized === "info" || normalized === "log") return "info";
  if (normalized === "verbose" || normalized === "debug") return "verbose";
  throw new Error(
    `--log-level must be one of: silent, error, warn, info, verbose (got "${input}")`,
  );
}

/**
 * Parse a `--port` CLI value. Accepts the literal `"auto"` (case-insensitive)
 * to opt into the auto-port-discovery mode, an integer, or a numeric string.
 */
export function parsePort(input: number | string): number | "auto" {
  if (typeof input === "string" && input.trim().toLowerCase() === "auto") {
    return "auto";
  }
  const port = typeof input === "number" ? input : Number.parseInt(input, 10);
  if (!Number.isFinite(port)) throw new Error('--port must be a valid number or "auto"');
  if (port < 1 || port > 65535) throw new Error("--port must be between 1 and 65535");
  return port;
}
