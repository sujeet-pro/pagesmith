/**
 * `pagesmithSsg({ beforeBuild })` hook: writes `rss.xml` from the `guide`
 * collection's dated entries.
 *
 * Demonstrates `generateFeed` from `@pagesmith/site/ssg-utils` -- the shared
 * RSS 2.0 serializer other Pagesmith sites can reuse instead of hand-rolling
 * feed XML. `beforeBuild` runs once, before the SSR/prerender pipeline, with
 * `outDir` already holding the client build's hashed assets -- a safe place
 * to drop additional static files that the route renderer will not touch.
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { generateFeed } from "@pagesmith/site/ssg-utils";
import type { SsgBeforeBuildContext } from "@pagesmith/site/vite";
import { buildLayer, renderEntries, routeFor, toIso } from "./content";

/** Public origin this example deploys to (see README's "Live Demo" link). */
const ORIGIN = "https://projects.sujeet.pro";

export async function writeRssFeed(ctx: SsgBeforeBuildContext): Promise<void> {
  const basePath = ctx.config.base.replace(/\/+$/, "");
  const layer = buildLayer(ctx.rootDir);
  const guideRaw = await layer.getCollection("guide");
  const guideEntries = await renderEntries(guideRaw, "guide");

  const xml = generateFeed(
    guideEntries.map((entry) => ({
      title: entry.data.title,
      path: routeFor(entry),
      publishedDate: toIso(entry.data.date),
      description: entry.data.description,
      tags: entry.data.tags,
    })),
    {
      origin: ORIGIN,
      basePath,
      title: "Pagesmith + Site JSX -- Guide",
      description: "Guide updates from the @pagesmith/site blog-site example.",
      language: "en",
    },
  );

  writeFileSync(join(ctx.outDir, "rss.xml"), xml);
  ctx.logger.info(`rss.xml written with ${guideEntries.length} item(s)`);
}
