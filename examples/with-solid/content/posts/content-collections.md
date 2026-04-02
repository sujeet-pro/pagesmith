---
title: Content Collections
description: Typed content with virtual modules and SolidJS components
date: 2026-03-15
tags: ["content", "collections"]
order: 3
---

## Defining collections with schemas

The `content.config.mjs` file uses `defineCollection` from `@pagesmith/core` to declare each content collection. Every collection specifies a `loader` (such as `'markdown'`), a `directory` where content files live, and a `schema` built with `z` (Zod). The schema validates frontmatter at build time — if a post is missing a required `title` or has a `date` that cannot be coerced into a Date object, the build fails with a descriptive error. This catches content mistakes before they reach production.

The `posts` collection schema defines `title` as a required string, `date` as a coerced date (so strings like `2026-03-15` are automatically parsed), `tags` as an array of strings defaulting to an empty array, and `order` as an optional number used for sorting. The `pages` collection is simpler, requiring only `title` with an optional `description`.

## Virtual modules

Once the `pagesmithContent` Vite plugin processes your collections, each one becomes available as a virtual module. In your SolidJS components you import them directly:

```ts
import posts from 'virtual:content/posts'
import pages from 'virtual:content/pages'
```

Each entry in the array has a `contentSlug` (the file path relative to the collection directory, without the extension), a `frontmatter` object matching your Zod schema, and an `html` string containing the rendered markdown.

The plugin also generates a TypeScript declaration file (`src/pagesmith-content.d.ts`) so your editor provides full autocompletion and type checking on frontmatter fields. You never need to write these types by hand — they are derived from your Zod schemas automatically.

## Iterating with For

The `Home.tsx` component uses Solid's `For` component to render the list of posts. `For` is optimized for rendering arrays — it tracks each item by reference and only updates the DOM nodes that actually changed. The posts are spread into a new array and sorted by date before rendering, so the newest post appears first.

## Looking up a single entry with createMemo

The `Post.tsx` component receives a `slug` prop and uses `createMemo` to find the matching entry in the posts array. `createMemo` caches the result so the lookup only re-runs when the slug changes. The component then uses Solid's `Show` component to conditionally render the post, with a fallback message if no match is found.

## Rendering HTML content

Solid does not use `dangerouslySetInnerHTML` like React. Instead, it provides the `innerHTML` prop directly on any element. In `Post.tsx`, the rendered markdown is injected via `<div class="prose" innerHTML={p().html} />`. Pagesmith's content layer handles the markdown-to-HTML transformation at build time, so the HTML string is ready to use without any runtime parsing.
