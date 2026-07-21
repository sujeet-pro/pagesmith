import { z } from "zod";

// ── Markdown config ──

/**
 * Image loading-hint behavior applied to in-flow content images during
 * markdown processing.
 *
 * When `lazyLoading` is enabled (the default), Pagesmith walks the rendered
 * images in document order: the first `eagerCount` images are marked
 * `fetchpriority="high"` (eager, tuned for the Largest Contentful Paint hero),
 * and every subsequent image gets `loading="lazy" decoding="async"` so it
 * defers until near the viewport. The hint is applied to the `<img>` inside a
 * generated `<picture>` as well as to plain images.
 */
export const MarkdownImagesConfigSchema = z
  .object({
    /**
     * Emit browser loading hints (`loading="lazy"`, `decoding="async"`, and
     * `fetchpriority`) on content images. Set to `false` to opt out entirely
     * and leave images without any Pagesmith-added loading attributes.
     * Defaults to `true`.
     */
    lazyLoading: z
      .boolean()
      .optional()
      .describe("Emit lazy/eager loading hints on content images."),
    /**
     * Number of leading images (in document order) to mark eager with
     * `fetchpriority="high"` instead of lazy. Defaults to `1` so the first
     * image — typically the LCP hero — is prioritized. Use `0` to make every
     * image lazy.
     */
    eagerCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Count of leading images loaded eagerly with fetchpriority=high."),
  })
  .optional();

export const MarkdownConfigSchema = z.object({
  remarkPlugins: z.array(z.any()).optional(),
  rehypePlugins: z.array(z.any()).optional(),
  allowDangerousHtml: z.boolean().optional(),
  math: z.union([z.boolean(), z.literal("auto")]).optional(),
  images: MarkdownImagesConfigSchema,
  shiki: z
    .object({
      themes: z.object({
        light: z.string(),
        dark: z.string(),
      }),
      langAlias: z.record(z.string(), z.string()).optional(),
      defaultShowLineNumbers: z.boolean().optional(),
    })
    .optional(),
});

export type MarkdownConfig = z.infer<typeof MarkdownConfigSchema>;
