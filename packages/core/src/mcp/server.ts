import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { basename, resolve } from "path";
import { z } from "zod";
import type { ContentLayer } from "../content-layer.js";
import type { Loader } from "../loaders/types.js";
import { asTextResource, getPackageVersion, resolvePackageDocPath } from "./shared.js";

export type CoreMcpServerOptions = {
  layer: ContentLayer;
  rootDir?: string;
};

function getLoaderType(loader: string | Loader): string {
  if (typeof loader === "string") return loader;
  return loader.name ?? "custom";
}

function getSchemaFieldNames(schema: z.ZodType): string[] | undefined {
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return getSchemaFieldNames(schema.unwrap() as z.ZodType);
  }
  if (schema instanceof z.ZodDefault) {
    return getSchemaFieldNames(schema._def.innerType as z.ZodType);
  }
  return undefined;
}

export function createCoreMcpServer(options: CoreMcpServerOptions): McpServer {
  const { layer } = options;
  const baseRoot = resolve(options.rootDir ?? process.cwd());

  const server = new McpServer(
    {
      name: "@pagesmith/core-mcp",
      version: getPackageVersion(import.meta.dirname),
    },
    {
      instructions: [
        "Use core_* tools to inspect @pagesmith/core content layers.",
        `Root directory: ${baseRoot}`,
      ].join("\n"),
    },
  );

  // ── Tools ──

  server.registerTool(
    "core_list_collections",
    {
      description:
        "List all configured collections with their loader type, directory, and schema field names.",
      inputSchema: {},
    },
    async () => {
      const names = layer.getCollectionNames();
      const collections = names.map((name) => {
        const def = layer.getCollectionDef(name);
        return {
          name,
          loader: def ? getLoaderType(def.loader) : "unknown",
          directory: def?.directory,
          schemaFields: def ? getSchemaFieldNames(def.schema) : undefined,
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(collections, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "core_list_entries",
    {
      description:
        "List entries in a collection with slug, title, description, and file path. Does not render content. Supports pagination via limit/offset.",
      inputSchema: {
        collection: z.string().describe("Collection name"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(50)
          .describe("Maximum number of entries to return (default 50)"),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("Number of entries to skip (default 0)"),
      },
    },
    async ({
      collection,
      limit,
      offset,
    }: {
      collection: string;
      limit: number;
      offset: number;
    }) => {
      const entries = await layer.getCollection(collection);
      const total = entries.length;
      const page = entries.slice(offset, offset + limit);

      const items = page.map((entry) => {
        const data = (entry.data ?? {}) as Record<string, unknown>;
        return {
          slug: entry.slug,
          title: typeof data.title === "string" ? data.title : undefined,
          description: typeof data.description === "string" ? data.description : undefined,
          filePath: entry.filePath,
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                collection,
                total,
                offset,
                limit,
                count: items.length,
                entries: items,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "core_get_entry",
    {
      description:
        "Load a single content entry by collection name and slug. Returns slug, validated data, rendered HTML, headings, and read time.",
      inputSchema: {
        collection: z.string().describe("Collection name"),
        slug: z.string().describe("Entry slug"),
      },
    },
    async ({ collection, slug }: { collection: string; slug: string }) => {
      const entry = await layer.getEntry(collection, slug);
      if (!entry) {
        throw new Error(`Entry not found: ${collection}/${slug}`);
      }

      const rendered = await entry.render();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                slug: entry.slug,
                collection: entry.collection,
                filePath: entry.filePath,
                data: entry.data,
                html: rendered.html,
                headings: rendered.headings,
                readTime: rendered.readTime,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "core_validate",
    {
      description:
        "Run validation on a specific collection or all collections. Returns structured validation results with error and warning counts.",
      inputSchema: {
        collection: z.string().optional().describe("Collection name (omit to validate all)"),
      },
    },
    async ({ collection }: { collection?: string }) => {
      const results = await layer.validate(collection);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "core_search_entries",
    {
      description:
        "Search entries across collections by matching a query string against titles, descriptions, tags, and slugs. Case-insensitive. Returns up to 20 matches.",
      inputSchema: {
        query: z.string().describe("Search query string"),
        collection: z.string().optional().describe("Limit search to a specific collection"),
      },
    },
    async ({ query, collection }: { query: string; collection?: string }) => {
      if (!query.trim()) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ query, matches: [], count: 0 }, null, 2) },
          ],
        };
      }

      const queryLower = query.toLowerCase();
      const maxResults = 20;
      const collectionNames = collection ? [collection] : layer.getCollectionNames();

      type SearchMatch = {
        collection: string;
        slug: string;
        title?: string;
        description?: string;
        filePath: string;
      };

      const matches: SearchMatch[] = [];

      for (const name of collectionNames) {
        if (matches.length >= maxResults) break;
        const entries = await layer.getCollection(name);
        for (const entry of entries) {
          if (matches.length >= maxResults) break;
          const data = (entry.data ?? {}) as Record<string, unknown>;
          const title = typeof data.title === "string" ? data.title : "";
          const description = typeof data.description === "string" ? data.description : "";
          const tags = Array.isArray(data.tags) ? data.tags.join(" ") : "";
          const searchText = `${entry.slug} ${title} ${description} ${tags}`.toLowerCase();

          if (searchText.includes(queryLower)) {
            matches.push({
              collection: name,
              slug: entry.slug,
              title: title || undefined,
              description: description || undefined,
              filePath: entry.filePath,
            });
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { query, collection: collection ?? null, count: matches.length, matches },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Resources ──

  server.registerResource(
    "core-agent-usage",
    "pagesmith://core/agents/usage",
    {
      title: "@pagesmith/core agent usage",
      description: "Version-matched AI usage guide for @pagesmith/core.",
      mimeType: "text/markdown",
    },
    async () =>
      asTextResource(
        "pagesmith://core/agents/usage",
        resolvePackageDocPath(
          import.meta.dirname,
          "skills/pagesmith-core-setup/references/usage.md",
        ),
      ),
  );

  server.registerResource(
    "core-llms-full",
    "pagesmith://core/llms-full",
    {
      title: "@pagesmith/core llms-full",
      description: "Version-matched full AI reference for @pagesmith/core.",
      mimeType: "text/markdown",
    },
    async () =>
      asTextResource(
        "pagesmith://core/llms-full",
        resolvePackageDocPath(import.meta.dirname, "llms-full.txt"),
      ),
  );

  server.registerResource(
    "core-reference",
    "pagesmith://core/reference",
    {
      title: "@pagesmith/core reference",
      description:
        "Core package reference for content layer, schemas, loaders, and markdown pipeline.",
      mimeType: "text/markdown",
    },
    async () =>
      asTextResource(
        "pagesmith://core/reference",
        resolvePackageDocPath(import.meta.dirname, "REFERENCE.md"),
      ),
  );

  return server;
}

export async function startCoreMcpServer(options: CoreMcpServerOptions): Promise<void> {
  const server = createCoreMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep logs on stderr; stdout is reserved for MCP protocol messages.
  console.error(
    `[pagesmith:mcp] @pagesmith/core MCP server started (root=${basename(resolve(options.rootDir ?? process.cwd()))})`,
  );
}
