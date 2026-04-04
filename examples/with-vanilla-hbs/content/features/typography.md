---
title: "Typography"
description: "Headings, text formatting, links, images, blockquotes, and smart typography features."
date: 2026-03-11
tags: [markdown, typography]
---

# Typography

Pagesmith renders standard Markdown typography with clean defaults and enhances it with smart quotes, em dashes, and other typographic niceties via `remark-smartypants`. This page demonstrates every text formatting feature available.

## Headings

Markdown supports six levels of headings. Use them to create a clear document hierarchy. Pagesmith automatically generates anchor links for each heading, making them linkable.

### Third-level heading

#### Fourth-level heading

##### Fifth-level heading

###### Sixth-level heading

Keep heading levels sequential -- do not skip from an h2 to an h4. The built-in heading validator will warn you if you do.

## Text Formatting

### Bold

Use double asterisks for **bold text**. Bold is useful for **key terms**, **important values**, or **UI labels** in documentation.

### Italic

Use single asterisks for *italic text*. Italics work well for *emphasis*, *technical terms on first use*, or *publication titles*.

### Bold and Italic

Combine both for ***bold and italic text*** when you need maximum emphasis. Use this sparingly -- if everything is emphasized, nothing is.

### Inline Code

Use backticks for `inline code`. This is appropriate for `function names`, `variable names`, `file paths` like `src/index.ts`, and short `command snippets`.

## Links

### Inline links

The simplest link syntax puts the URL directly after the text.

Read the [Pagesmith documentation](https://pagesmith.dev) for the complete guide.

Check the [getting started](/guide/installation) page to set up your first project.

### Reference-style links

For documents with many links, reference-style links keep the prose readable. The URL definitions can go anywhere in the document.

Pagesmith is built on the [unified][] ecosystem and uses [Vite][] as its build tool. Syntax highlighting is provided by [Expressive Code][ec].

[unified]: https://unifiedjs.com
[Vite]: https://vite.dev
[ec]: https://expressive-code.com

### Autolinks

Bare URLs are automatically converted to clickable links by remark-gfm.

Visit https://pagesmith.dev for more information.

### Anchor links

Link to sections within the same page using the heading's generated slug.

See the [Text Formatting](#text-formatting) section above for details on bold and italic syntax.

## Images

Images use the standard Markdown syntax with alt text for accessibility.

![A placeholder image demonstrating Markdown image syntax](https://placehold.co/600x400)

Images can also be wrapped in links:

[![Placeholder image linked to an external site](https://placehold.co/600x400)](https://pagesmith.dev)

## Blockquotes

### Simple blockquote

> Good documentation is not about the quantity of information but the clarity of explanation.

### Nested blockquotes

> Blockquotes can be nested to represent layered quotations.
>
> > This is a nested blockquote. It is indented further to show the nesting level.
> >
> > > And a third level, though deep nesting is rarely needed in practice.

### Multi-paragraph blockquote

> The unified ecosystem processes content through three stages: parsing, transforming, and compiling.
>
> The parsing stage converts raw text into an abstract syntax tree. The transforming stage modifies the tree through a chain of plugins. The compiling stage serializes the tree back into its output format.
>
> This architecture makes it straightforward to add new capabilities without changing existing plugins.

### Blockquote with other elements

> **Structured blockquotes** can contain other Markdown features:
>
> - Lists work inside blockquotes
> - So does `inline code`
> - And [links](https://pagesmith.dev)
>
> Even code blocks work:
>
> ```ts
> const message = 'Hello from inside a blockquote'
> ```

## Horizontal Rules

Horizontal rules create a thematic break between sections. Use three or more hyphens on a line by themselves.

The content above the rule is conceptually separate from the content below.

---

This paragraph follows the horizontal rule. Use these sparingly -- headings are usually a better way to separate sections.

## Smart Typography

Pagesmith automatically converts ASCII typography to proper typographic characters through `remark-smartypants`. This applies to regular text but leaves code blocks and inline code untouched.

### Smart quotes

"Double quotes" become curly double quotes. 'Single quotes' become curly single quotes. This happens automatically -- just write normal ASCII quotes.

### Dashes

An em dash---like this---is produced by typing three hyphens. It is used for parenthetical statements or abrupt changes in thought.

An en dash is produced by typing two hyphens and is used for ranges: pages 10--20, the years 2020--2025.

### Ellipsis

Three dots become a proper ellipsis character... like that. The typographic ellipsis is a single character rather than three separate periods.

### Examples in context

"It's a truth universally acknowledged," she said, "that good typography matters."

The project timeline runs from January--March, with milestones at weeks 2, 4, and 8...

He paused for a moment---then continued, "Let's ship it."

## Lists

### Unordered lists

- First item in the list
- Second item with a longer description that wraps to demonstrate how multi-line list items render
- Third item
  - Nested item under the third
  - Another nested item
    - Deeply nested item
- Fourth item

### Ordered lists

1. Clone the repository
2. Install dependencies
3. Create your content directory
4. Define your collections in `content.config.ts`
5. Start the development server

### Mixed lists

1. Set up the project
   - Initialize with `npm create pagesmith@latest`
   - Choose a template
2. Configure collections
   - Define schemas with Zod
   - Set up directory structure
3. Write content
   - Create Markdown files with frontmatter
   - Add images and other assets
