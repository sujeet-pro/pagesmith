import { z } from 'zod'

// ── Markdown config ──

export const MarkdownConfigSchema = z.object({
  remarkPlugins: z.array(z.any()).optional(),
  rehypePlugins: z.array(z.any()).optional(),
  allowDangerousHtml: z.boolean().optional(),
  math: z.union([z.boolean(), z.literal('auto')]).optional(),
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
})

export type MarkdownConfig = z.infer<typeof MarkdownConfigSchema>
