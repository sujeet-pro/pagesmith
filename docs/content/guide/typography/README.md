---
title: Typography
description: Headings, text formatting, links, images, blockquotes, lists, and smart punctuation.
---

# Typography

Pagesmith renders standard Markdown typography with clean defaults and enhances prose with `remark-smartypants`. This page is intentionally example-heavy so you can see how common documentation content renders without extra HTML.

## Headings

Markdown supports six levels of headings. Use them to create a clear document hierarchy. Pagesmith automatically generates anchor links for each heading, making them linkable.

### Third-level heading

#### Fourth-level heading

##### Fifth-level heading

###### Sixth-level heading

Keep heading levels sequential -- do not skip from an h2 to an h4. The built-in heading validator warns when the structure jumps unexpectedly.

## Text Formatting

### Bold

Use double asterisks for **bold text**. Bold is useful for **key terms**, **important values**, and **UI labels** in documentation.

### Italic

Use single asterisks for _italic text_. Italics work well for _emphasis_, _technical terms on first use_, or _publication titles_.

### Bold and Italic

Combine both for **_bold and italic text_** when you need maximum emphasis. Use this sparingly -- if everything is emphasized, nothing is.

### Inline Code

Use backticks for `inline code`. This is appropriate for `function names`, `variable names`, `file paths` like `src/index.ts`, and short `command snippets`.

## Links

### Inline links

Read the [API reference](../../reference/api/README.md) for the complete guide.

Check the [getting started](../getting-started/README.md) page to set up your first project.

### Reference-style links

For documents with many links, reference-style links keep the prose readable. The URL definitions can go anywhere in the document.

Pagesmith is built on the [unified][] ecosystem and uses [Vite][] as its build tool. Syntax highlighting is provided by Pagesmith's built-in code renderer on top of Shiki.

[unified]: https://unifiedjs.com
[Vite]: https://vite.dev

### Autolinks

Bare URLs are automatically converted to clickable links by `remark-gfm`.

Visit https://github.com/sujeet-pro/pagesmith for more information.

### Anchor links

Link to sections within the same page using the heading's generated slug.

See the [Text Formatting](#text-formatting) section above for details on bold and italic syntax.

## Images

Images use the standard Markdown syntax with alt text for accessibility.

![Pagesmith favicon rendered through standard Markdown image syntax](/favicon.svg)

Images can also be wrapped in links:

[![Pagesmith favicon linked to the GitHub repository](/favicon.svg)](https://github.com/sujeet-pro/pagesmith)

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
> - And [links](https://github.com/sujeet-pro/pagesmith)
>
> Even code blocks work:
>
> ```ts
> const message = "Hello from inside a blockquote";
> ```

## Horizontal Rules

Horizontal rules create a thematic break between sections. Use three or more hyphens on a line by themselves.

The content above the rule is conceptually separate from the content below.

---

This paragraph follows the horizontal rule. Use these sparingly -- headings are usually a better way to separate sections.

## Smart Typography

Pagesmith automatically converts ASCII typography to proper typographic characters through `remark-smartypants`. This applies to regular prose while leaving code blocks and inline code untouched.

### Smart quotes

"Double quotes" become curly double quotes. 'Single quotes' become curly single quotes. This happens automatically -- just write normal ASCII quotes.

### Dashes

An em dash---like this---is produced by typing three hyphens. It works well for parenthetical statements or abrupt changes in thought.

An en dash is produced by typing two hyphens and is useful for ranges: pages 10--20, the years 2020--2025.

### Ellipsis

Three dots become a proper ellipsis character... like that.

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
   - Install dependencies for the workspace
   - Create the initial content folders and starter Markdown
2. Configure collections
   - Define schemas with Zod
   - Set up directory structure
3. Write content
   - Create Markdown files with frontmatter
   - Add images and other assets
