import { dirname } from "path";
import { extractFrontmatter } from "./frontmatter";
import { processMarkdown } from "./markdown";
import type { Heading } from "./schemas/heading";
import type { MarkdownConfig } from "./schemas/markdown-config";

export type ConvertOptions = {
  markdown?: MarkdownConfig;
  /**
   * Absolute or project-relative source path for the markdown being converted.
   * Provide this when the markdown references local images so Pagesmith can
   * resolve refs from the markdown file and fill intrinsic dimensions.
   */
  sourcePath?: string;
  /**
   * Allowed root directory for relative local image refs. Defaults to the
   * markdown file's own directory when `sourcePath` is provided. Set this when
   * you want `convert()` to allow refs that move outside the file directory but
   * still stay inside a broader content root, matching `entry.render()`.
   */
  assetRoot?: string;
};

export type ConvertResult = {
  html: string;
  headings: Heading[];
  /** @deprecated Use `headings` for consistency with `processMarkdown()` and `entry.render()`. */
  toc: Heading[];
  frontmatter: Record<string, unknown>;
};

export async function convert(input: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const preExtracted = options.sourcePath
    ? {
        ...extractFrontmatter(input),
        fileData: {
          pagesmithFilePath: options.sourcePath,
          pagesmithAssetRoot: options.assetRoot ?? dirname(options.sourcePath),
        },
      }
    : undefined;

  const result = await processMarkdown(input, options.markdown || {}, preExtracted);
  return {
    html: result.html,
    headings: result.headings,
    toc: result.headings,
    frontmatter: result.frontmatter,
  };
}
