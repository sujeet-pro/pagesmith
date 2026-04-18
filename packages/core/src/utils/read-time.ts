/**
 * Read time estimation.
 *
 * Computes estimated reading time from markdown source (~200 words per minute).
 */

/** Compute read time in minutes from raw markdown. */
export function computeReadTime(rawMarkdown: string): number {
  const plainText = rawMarkdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^( {4}|\t).+$/gm, " ")
    .replace(/^---[\s\S]*?---/m, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_~`>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = plainText.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
