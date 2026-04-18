# @pagesmith/core Recipes

Common recipes for the headless content layer.

## Recipe: Add content collections

1. Define collections with `defineCollection` / `defineCollections`.
2. Use Zod schemas from `@pagesmith/core`.
3. Point each collection at a content directory.
4. Use `createContentLayer` or `pagesmithContent` depending on the project shape.

## Recipe: Add Vite virtual content modules

```ts
import { pagesmithContent } from "@pagesmith/core/vite";
```

Keep `pagesmithContent` on the core package. If the project also needs SSG, import that from `@pagesmith/site/vite`.

## Recipe: Use the content layer without Vite

```ts
import { createContentLayer, defineConfig } from "@pagesmith/core";
import collections from "./content.config";

const layer = createContentLayer(defineConfig({ collections }));
```

This is the right starting point for apps that already own routing and build tooling, such as Next.js or custom SSR servers.

If the app also wants Pagesmith's shipped markdown presentation layer, pair it with:

- `@pagesmith/site/css/content`
- `@pagesmith/site/runtime/content`

## Recipe: Render markdown in an existing app

1. Define collections with `defineCollection` / `defineCollections`.
2. Create a layer with `createContentLayer(defineConfig({ collections }))`.
3. Call `entry.render()` where the host app needs HTML, headings, or read time.
4. Inject `rendered.html` using the framework's raw-HTML escape hatch.
5. Add `@pagesmith/site/css/content` and `@pagesmith/site/runtime/content` only when you want the shared prose/code-block UI.

## Recipe: Add site-building on top of core

Split imports by responsibility:

```ts
import { pagesmithContent } from "@pagesmith/core/vite";
import { pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";
```

Do not move collection logic into `@pagesmith/site`.

## Recipe: Inspect a content layer over MCP

1. Start a small project-local wrapper that builds your `ContentLayer` and calls `startCoreMcpServer({ layer })`.
2. Call `core_list_collections` to understand collection names, directories, and schema fields.
3. Call `core_list_entries` for a collection before pulling full page content.
4. Call `core_search_entries` to narrow to likely matches by slug, title, description, or tags.
5. Call `core_get_entry` only for the specific entries that need rendered HTML or headings.
6. Run `core_validate` when the task involves schema drift, broken content, or release checks.
