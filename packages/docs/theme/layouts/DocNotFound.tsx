/**
 * DocNotFound layout.
 *
 * 404 page for documentation sites. Uses the shared NotFoundLayout from @pagesmith/site.
 */

import { h } from "@pagesmith/docs/jsx-runtime";
import { NotFoundLayout } from "@pagesmith/docs/layouts";
import { resolveChrome } from "../utils/chrome";

type Props = {
  content: string;
  frontmatter: Record<string, any>;
  headings: Array<{ depth: number; text: string; slug: string }>;
  slug: string;
  site: any;
  [key: string]: any;
};

export default function DocNotFound(props: Props) {
  const { site, slug } = props;

  return <NotFoundLayout slug={slug} site={site} />;
}
