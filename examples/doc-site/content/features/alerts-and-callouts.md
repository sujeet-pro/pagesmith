---
title: "Alerts & Callouts"
description: "GitHub-style alert blocks for notes, tips, warnings, and other callout types."
date: 2026-03-12
tags: [markdown, alerts]
---

# Alerts & Callouts

Pagesmith supports GitHub-style alerts through `remark-github-alerts`. These render as styled callout boxes with icons and colored borders. The syntax is compatible with GitHub's own Markdown rendering.

## Alert Types

There are five built-in alert types, each with a distinct color and icon.

### Note

Use notes for general information that supplements the main content.

> [!NOTE]
> Pagesmith processes Markdown through a unified pipeline. All plugins run in a fixed order to ensure consistent output across your entire site.

### Tip

Use tips for helpful suggestions or best practices.

> [!TIP]
> Run `pagesmith dev` with the `--open` flag to automatically launch your browser when the dev server starts.

### Important

Use important callouts for information that users need to know to succeed.

> [!IMPORTANT]
> Content collections require a `content.config.ts` file at the project root. Without it, Pagesmith cannot discover or validate your Markdown files.

### Warning

Use warnings for potential pitfalls or situations that could cause problems.

> [!WARNING]
> Renaming a content directory after initial setup will break existing internal links. Update all references before changing directory names.

### Caution

Use caution for actions that are irreversible or could result in data loss.

> [!CAUTION]
> Running `pagesmith clean` permanently deletes the output directory and all generated files. This action cannot be undone.

## Multi-paragraph Alerts

Alerts can contain multiple paragraphs. Continue the blockquote syntax on each line.

> [!NOTE]
> The Markdown pipeline runs in two phases. First, the remark phase parses Markdown into an AST and applies transformations like GFM support, math parsing, and smart typography.
>
> Then, the rehype phase converts the AST to HTML and applies further transformations including syntax highlighting, heading anchors, and external link handling.
>
> Custom plugins can hook into either phase to extend the pipeline.

## Alerts with Formatted Content

Alerts support the full range of Markdown formatting inside them, including bold text, inline code, and links.

> [!TIP]
> Use the `mark` meta on code blocks to highlight important lines. For example, writing `` ```ts mark={3} `` will highlight line 3 with a neutral background color.
>
> Check the [code blocks](./code-blocks) page for all available annotation options.

> [!IMPORTANT]
> Schema validation runs at **build time**, not at runtime. Make sure your frontmatter matches the Zod schema defined in `content.config.ts`:
>
> - `title` must be a non-empty string
> - `date` must be a valid ISO 8601 date
> - `tags` defaults to an empty array if omitted

## Alerts with Code Blocks

You can include fenced code blocks inside alerts to show configuration examples or command snippets.

> [!TIP]
> To enable line numbers globally, add this to your Pagesmith configuration:
>
> ```ts title="content.config.ts"
> markdown: {
>   shiki: {
>     defaultShowLineNumbers: true,
>   },
> }
> ```

> [!WARNING]
> Avoid using `any` in your Zod schemas. This bypasses all type checking and validation:
>
> ```ts
> // Bad -- no validation
> schema: z.object({
>   title: z.any(),
> })
>
> // Good -- proper validation
> schema: z.object({
>   title: z.string().min(1),
> })
> ```

## Alerts with Lists

Alerts can include bullet points and numbered lists for structured information.

> [!NOTE]
> Pagesmith includes three built-in content validators for Markdown collections:
>
> 1. **Link validator** -- warns on bare URLs, empty link text, and suspicious protocols
> 2. **Heading validator** -- enforces a single h1 and sequential heading depth
> 3. **Code block validator** -- warns on missing language identifiers and unknown meta properties

> [!CAUTION]
> Before upgrading to a new major version, make sure to:
>
> - Back up your content directory
> - Read the migration guide thoroughly
> - Test the upgrade on a separate branch first
> - Verify all custom plugins still work
