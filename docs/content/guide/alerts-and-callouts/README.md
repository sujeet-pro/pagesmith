---
title: Alerts & Callouts
description: GitHub-style alert blocks for notes, tips, warnings, lists, and code examples.
---

# Alerts & Callouts

Pagesmith supports GitHub-style alerts through `remark-github-alerts`. These render as styled callout boxes with icons and colored borders. The syntax matches GitHub's own markdown rendering, so the same content reads well in repos and in your Pagesmith site.

## Alert Types

There are five built-in alert types, each with a distinct color and icon.

### Note

Use notes for general information that supplements the main content.

> [!NOTE]
> Pagesmith processes Markdown through a unified pipeline. Plugins run in a fixed order so headings, math, alerts, and code blocks render consistently across the site.

### Tip

Use tips for practical suggestions or best practices.

> [!TIP]
> Use callouts to separate setup advice, migration notes, and deployment caveats without dropping into raw HTML.

### Important

Use important callouts for information readers need in order to succeed.

> [!IMPORTANT]
> Content-layer projects usually define collections in `content.config.ts`. Docs sites use `pagesmith.config.json5` for site configuration and `docs/content/` for the content tree.

### Warning

Use warnings for potential pitfalls or situations that could cause problems.

> [!WARNING]
> Renaming a content directory after publishing can break internal links and imported asset paths. Update references before moving folders around.

### Caution

Use caution for actions that are irreversible or easy to misuse.

> [!CAUTION]
> Deleting a generated output directory is safe only when it contains build artifacts. If you keep hand-edited files in that folder, move them elsewhere first.

## Multi-paragraph Alerts

Alerts can contain multiple paragraphs. Continue the blockquote syntax on each line.

> [!NOTE]
> The Markdown pipeline runs in two phases. First, the remark phase parses Markdown into an AST and applies transformations like GFM support, math parsing, and smart typography.
>
> Then the rehype phase converts the tree to HTML and applies transformations including syntax highlighting, heading anchors, and external link handling.
>
> Custom plugins can hook into either phase to extend the pipeline.

## Alerts with Formatted Content

Alerts support the full range of Markdown formatting inside them, including bold text, inline code, links, and lists.

> [!TIP]
> Use the `mark` meta on code blocks to highlight important lines. For example, writing ` ```ts mark={3} ` highlights line 3 with a neutral background color.
>
> See the [Code Blocks](../code-blocks/README.md) guide for the full list of title, line number, diff, collapse, and tab options.

> [!IMPORTANT]
> Schema validation runs at **build time** in both content-layer projects and docs sites, not at runtime. Match your frontmatter and data files to the Zod schemas for your collections:
>
> - `title` should be a non-empty string where required
> - date fields should use valid ISO 8601 strings when your schema expects them
> - `tags` can default to an empty array when omitted

## Alerts with Code Blocks

You can include fenced code blocks inside alerts to show configuration examples or command snippets.

> [!TIP]
> To enable line numbers globally, add a `markdown.shiki` block like this:
>
> ```ts title="pagesmith.config.json5"
> markdown: {
>   shiki: {
>     defaultShowLineNumbers: true,
>   },
> }
> ```

> [!WARNING]
> Avoid `z.any()` in collection schemas when you want meaningful validation:
>
> ```ts
> // Bad -- no validation
> schema: z.object({
>   title: z.any(),
> });
>
> // Good -- proper validation
> schema: z.object({
>   title: z.string().min(1),
> });
> ```

## Alerts with Lists

Alerts can include bullet points and numbered lists for structured information.

> [!NOTE]
> Pagesmith includes built-in content validation for common Markdown pitfalls:
>
> 1. **Link validation** for empty text, suspicious protocols, and broken internal references
> 2. **Heading validation** for multiple h1s or skipped heading levels
> 3. **Code block validation** for missing languages and unknown meta properties

> [!CAUTION]
> Before rolling out a broad content refactor, make sure to:
>
> - back up the content directory
> - update links that point at renamed routes
> - validate schema changes against existing entries
> - rebuild the site before publishing
