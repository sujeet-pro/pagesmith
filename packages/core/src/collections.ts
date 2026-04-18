/**
 * Convenience collection factories.
 *
 * These wrap `defineCollection` with sensible defaults for common content
 * patterns. Use them for projects that follow the default conventions; drop
 * down to `defineCollection` directly when you need full control.
 */

import type { z } from "zod";

import { defineCollection } from "./config";
import {
  BaseFrontmatterSchema,
  BlogFrontmatterSchema,
  ProjectFrontmatterSchema,
} from "./schemas/frontmatter";
import type { CollectionComputed, CollectionDef } from "./schemas/collection";

type FactoryOptions<S extends z.ZodType, TComputed extends CollectionComputed = {}> = {
  /** Override the default content directory. */
  directory?: string;
  /**
   * Override the default frontmatter schema. Use `BlogFrontmatterSchema.extend({...})`
   * (or the relevant base) when adding project-specific fields.
   */
  schema?: S;
  /** Extra include globs beyond the default `**\/*.md`. */
  include?: string[];
  /** Extra exclude globs. */
  exclude?: string[];
  /** Computed fields derived from each entry. */
  computed?: TComputed & CollectionComputed;
};

type FactoryResult<S extends z.ZodType, TComputed extends CollectionComputed> = CollectionDef<
  S,
  TComputed,
  "markdown"
>;

/** A markdown collection that uses `BlogFrontmatterSchema` by default. */
export function blogCollection<
  S extends z.ZodType = typeof BlogFrontmatterSchema,
  TComputed extends CollectionComputed = {},
>(options: FactoryOptions<S, TComputed> = {}): FactoryResult<S, TComputed> {
  const { directory = "content/posts", schema, include, exclude, computed } = options;
  return defineCollection({
    loader: "markdown",
    directory,
    schema: (schema ?? BlogFrontmatterSchema) as S,
    ...(include ? { include } : {}),
    ...(exclude ? { exclude } : {}),
    ...(computed ? { computed } : {}),
  }) as FactoryResult<S, TComputed>;
}

/** A markdown collection that uses `ProjectFrontmatterSchema` by default. */
export function projectsCollection<
  S extends z.ZodType = typeof ProjectFrontmatterSchema,
  TComputed extends CollectionComputed = {},
>(options: FactoryOptions<S, TComputed> = {}): FactoryResult<S, TComputed> {
  const { directory = "content/projects", schema, include, exclude, computed } = options;
  return defineCollection({
    loader: "markdown",
    directory,
    schema: (schema ?? ProjectFrontmatterSchema) as S,
    ...(include ? { include } : {}),
    ...(exclude ? { exclude } : {}),
    ...(computed ? { computed } : {}),
  }) as FactoryResult<S, TComputed>;
}

/**
 * A markdown collection that uses `BaseFrontmatterSchema` — suitable for
 * docs-style content where every entry has at least title/description.
 */
export function docsCollection<
  S extends z.ZodType = typeof BaseFrontmatterSchema,
  TComputed extends CollectionComputed = {},
>(options: FactoryOptions<S, TComputed> = {}): FactoryResult<S, TComputed> {
  const { directory = "content/docs", schema, include, exclude, computed } = options;
  return defineCollection({
    loader: "markdown",
    directory,
    schema: (schema ?? BaseFrontmatterSchema) as S,
    ...(include ? { include } : {}),
    ...(exclude ? { exclude } : {}),
    ...(computed ? { computed } : {}),
  }) as FactoryResult<S, TComputed>;
}
