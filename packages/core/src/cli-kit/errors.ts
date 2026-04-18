/**
 * Errors and error formatting shared by all Pagesmith CLIs.
 *
 * `CliError` is preferred over plain `Error` when you want to control the
 * process exit code or attach a follow-up "hint" line for the user. `formatCliError`
 * walks the `cause` chain so deeply-wrapped errors still surface readable lines.
 */

export class CliError extends Error {
  readonly exitCode: number;
  readonly hint?: string;

  constructor(
    message: string,
    options: { exitCode?: number; hint?: string; cause?: unknown } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "CliError";
    this.exitCode = options.exitCode ?? 1;
    this.hint = options.hint;
  }
}

function formatUnknownCause(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "symbol") return value.toString();

  try {
    const json = JSON.stringify(value);
    if (json) return json;
  } catch {
    // Fall through to the generic object tag below.
  }

  return Object.prototype.toString.call(value);
}

export function formatCliError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const lines: string[] = [];
  let current: unknown = error;
  let depth = 0;

  while (current instanceof Error) {
    const prefix = depth === 0 ? "" : "Caused by: ";
    const message = current.message || current.name;
    const line = `${prefix}${message}`;
    if (line !== lines.at(-1)) {
      lines.push(line);
    }
    current = (current as { cause?: unknown }).cause;
    depth += 1;
  }

  if (current != null) {
    lines.push(`Caused by: ${formatUnknownCause(current)}`);
  }

  if (error instanceof CliError && error.hint) {
    lines.push("");
    lines.push(`Hint: ${error.hint}`);
  }

  return lines.join("\n");
}

export function exitCodeFor(error: unknown): number {
  if (error instanceof CliError) return error.exitCode;
  return 1;
}
