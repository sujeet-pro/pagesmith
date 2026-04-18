/**
 * Schema validation with rich error reporting.
 *
 * Wraps Zod's safeParse to produce human-readable validation issues.
 */

import type { ZodError, ZodType } from "zod";

export type ValidationIssue = {
  /** Field path (e.g. 'tags[0]') */
  field?: string;
  /** Human-readable error message */
  message: string;
  /** Error severity */
  severity: "error" | "warn";
  /** Origin of this issue — helps consumers distinguish validation phases. */
  source?: "schema" | "content" | "plugin" | "custom";
};

export type ValidationEntryResult = {
  slug: string;
  filePath: string;
  issues: ValidationIssue[];
};

export type ValidationResult = {
  collection: string;
  entries: ValidationEntryResult[];
  errors: number;
  warnings: number;
};

/** Format a Zod error path into a human-readable field path. */
export function formatPath(path: PropertyKey[]): string {
  return path
    .map((segment, i) => {
      if (typeof segment === "number") return `[${segment}]`;
      if (typeof segment === "symbol") return `[${String(segment)}]`;
      if (i === 0) return segment;
      return `.${segment}`;
    })
    .join("");
}

/** Validate data against a Zod schema and return structured issues. */
export function validateSchema(
  data: Record<string, any>,
  schema: ZodType,
): {
  issues: ValidationIssue[];
  validatedData: any;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return {
      issues: [],
      validatedData: result.data,
    };
  }

  const issues = (result.error as ZodError).issues.map((issue) => ({
    field: issue.path.length > 0 ? formatPath(issue.path) : undefined,
    message: issue.message,
    severity: "error" as const,
    source: "schema" as const,
  }));

  // On failure, return raw data so the pipeline can continue in non-strict mode.
  // The issues array signals that validation did not pass.
  return {
    issues,
    validatedData: data,
  };
}
