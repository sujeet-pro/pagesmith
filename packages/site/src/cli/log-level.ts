import type { SiteLogLevel } from "../preset.js";

export function parseLogLevel(input: string): SiteLogLevel {
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

export function parsePort(input: number | string): number {
  const port = typeof input === "number" ? input : Number.parseInt(input, 10);
  if (!Number.isFinite(port)) throw new Error("--port must be a valid number");
  if (port < 1 || port > 65535) throw new Error("--port must be between 1 and 65535");
  return port;
}
