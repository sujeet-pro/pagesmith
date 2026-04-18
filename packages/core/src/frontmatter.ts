/**
 * Frontmatter extraction and validation.
 *
 * Uses gray-matter to parse YAML frontmatter from markdown,
 * and optionally validates against a Zod schema.
 */

import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import type { ZodSchema } from "zod";
import { validateSchema } from "./validation/schema-validator";

export type FrontmatterResult = {
  frontmatter: Record<string, any>;
  content: string;
};

/** Extract frontmatter from raw markdown using gray-matter. */
export function extractFrontmatter(raw: string): FrontmatterResult {
  const { data, content } = matter(raw, { engines: { yaml: parseYaml } });
  return { frontmatter: data, content };
}

/**
 * Validate frontmatter against a Zod schema. Returns parsed data or errors.
 *
 * @deprecated Use `validateSchema()` from `@pagesmith/core` for richer
 * validation results including field paths and severity levels.
 */
export function validateFrontmatter<T>(
  frontmatter: Record<string, any>,
  schema: ZodSchema<T>,
): { success: true; data: T } | { success: false; errors: string[] } {
  const { issues, validatedData } = validateSchema(frontmatter, schema);

  if (issues.length === 0) {
    return { success: true, data: validatedData as T };
  }

  const errors = issues.map((issue) =>
    issue.field ? `${issue.field}: ${issue.message}` : issue.message,
  );
  return { success: false, errors };
}
