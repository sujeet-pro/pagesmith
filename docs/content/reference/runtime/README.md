---
title: Runtime
description: Pre-built CSS and JavaScript exports from @pagesmith/core — content and standalone tiers, fonts, tokens, and runtime helpers.
---

# Runtime

`@pagesmith/core` provides pre-built CSS and JS assets for styling rendered markdown content. This page is the comprehensive guide for CSS imports, runtime JavaScript, design tokens, and customization.

## CSS Export Paths

Pagesmith provides four CSS export paths that can be imported directly in Vite projects or any bundler that supports package exports:

| Import Path | Contents | Use Case |
|---|---|---|
| `@pagesmith/core/css/content` | Reset + tokens + prose typography + inline code + viewport | Embedding rendered markdown in an existing app |
| `@pagesmith/core/css/standalone` | Reset + tokens + prose + inline code + TOC + page grid + sidebar | Full documentation site layout |
| `@pagesmith/core/css/viewport` | Viewport overflow protection and responsive base | Minimal responsive shell |
| `@pagesmith/core/css/fonts` | Font face declarations for Open Sans and JetBrains Mono (variable woff2) | Self-hosted fonts matching the design tokens |

### Importing CSS in Vite Projects

In a Vite-based project, import CSS directly in your entry file or theme stylesheet:

```ts title="src/theme.css"
@import '@pagesmith/core/css/fonts';
@import '@pagesmith/core/css/content';
```

Or import from JavaScript/TypeScript:

```ts title="src/main.ts"
import '@pagesmith/core/css/fonts'
import '@pagesmith/core/css/content'
```

For a full documentation layout:

```ts title="src/theme.css"
@import '@pagesmith/core/css/fonts';
@import '@pagesmith/core/css/standalone';
```

### CSS File Contents

#### `@pagesmith/core/css/content` (Content Tier)

The content CSS bundle includes everything needed for styled markdown output without any layout:

```text title="Content CSS Imports"
foundations/reset.css       CSS reset
foundations/tokens.css      Design tokens as custom properties
content/prose.css           Typography for rendered markdown
code/block.css              Code block frame, line, and copy styles
code/inline.css             Inline code styling
code/tabs.css               Tab chrome for grouped code blocks
viewport.css                Viewport overflow protection
```

Code block styling **is** included in the shared CSS bundle. Shiki token colors still arrive inline per block, but the frame chrome, line layout, copy button styling, and tabs come from the shipped Pagesmith CSS.

#### `@pagesmith/core/css/standalone` (Standalone Tier)

The standalone CSS bundle adds layout components on top of the content tier:

```text title="Standalone CSS Imports"
foundations/reset.css       CSS reset
foundations/tokens.css      Design tokens as custom properties
content/prose.css           Typography for rendered markdown
content/toc.css             Table of contents sidebar
code/block.css              Code block frame, line, and copy styles
code/inline.css             Inline code styling
code/tabs.css               Tab chrome for grouped code blocks
viewport.css                Viewport overflow protection
layout/grid.css             Page grid
layout/sidebar.css          Sidebar layout
```

#### `@pagesmith/core/css/viewport`

Minimal viewport and responsive base styles. Useful when you only need overflow protection without the full content or standalone bundles.

#### `@pagesmith/core/css/fonts`

Font face declarations for the two bundled variable fonts:

- **Open Sans** (variable, 300-800 weight) -- used for body text (`--font-sans`)
- **JetBrains Mono** (variable, 400-700 weight) -- used for code (`--font-mono`)

The font files are distributed as woff2 in the `@pagesmith/core/assets/fonts/` directory. The `fonts.css` file references them with relative URLs.

## How Pagesmith Handles Code Block CSS

Pagesmith splits code block rendering into two layers:

- Shared CSS bundles provide frame chrome, line layout, tabs, diff markers, and button styling.
- The renderer adds inline theme variables for syntax token colors and per-block light/dark backgrounds.
- The shared Pagesmith content runtime enables tabs, copy, and collapse interactions.

If you want to customize code block appearance, override the `--ps-*` custom properties or target the Pagesmith code block classes in your own stylesheet.

## Runtime JS Accessor Functions

The `@pagesmith/core/runtime` module provides functions that read pre-built CSS and JS files for server-side rendering scenarios where you need to inline assets or reference file paths.

### Standalone Tier (Full Site)

For projects that want a complete page layout with navigation, table of contents, and interactive features:

| Function | Returns |
|---|---|
| `getRuntimeCSS()` | Full standalone CSS as a string |
| `getRuntimeCSSPath()` | Absolute file path to the standalone CSS file |
| `getRuntimeJS()` | Standalone runtime JS as a string (TOC highlight) |
| `getRuntimeJSPath()` | Absolute file path to the standalone JS file |

### Content Tier (Markdown Rendering Only)

For projects that already have their own layout but want consistent styling for rendered markdown:

| Function | Returns |
|---|---|
| `getContentCSS()` | Content-only CSS as a string |
| `getContentCSSPath()` | Absolute file path to the content CSS file |
| `getContentJS()` | Content-only runtime JS as a string |
| `getContentJSPath()` | Absolute file path to the content JS file |

### Individual CSS Files

| Function | Returns |
|---|---|
| `getViewportCSS()` | Viewport/responsive base CSS as a string |
| `getViewportCSSPath()` | Absolute file path to the viewport CSS file |

All accessor functions read from the `@pagesmith/core` package directory, checking `src/` first (for development with linked packages) and falling back to `dist/` (for published builds).

## Runtime JavaScript Behavior

### Standalone Runtime

The standalone runtime initializes:

- **TOC Highlight** (`toc-highlight.ts`) -- Uses `IntersectionObserver` with a root margin of `-80px 0px -66% 0px` to track which heading is near the top of the viewport. When the active heading changes, the corresponding TOC item gets the `.active` class and is scrolled into view.

Code block interactivity such as copy and collapse is handled by the built-in renderer through inline scripts injected during markdown processing.

### Content Runtime

The content runtime is a minimal placeholder. Code block interactivity is handled by the built-in renderer's inline script, and projects using the content tier have their own navigation and TOC implementation.

### Progressive Enhancement

The runtime JavaScript is strictly a progressive enhancement layer. All content is readable and functional without JavaScript. Copy buttons and collapse controls are rendered in the HTML output during markdown processing, but require JavaScript to function.

## Design Tokens (CSS Custom Properties)

> [!NOTE]
> These design tokens are for `@pagesmith/core`'s standalone CSS. The `@pagesmith/docs` default theme uses its own design tokens with different values (different color palette, different font stack). See the [Docs Theme reference](/reference/docs-theme/) for docs-specific tokens.

All visual properties in Pagesmith CSS are defined as CSS custom properties in `foundations/tokens.css` under `:root`. The tokens use the CSS `light-dark()` function for automatic dark mode support, with `color-scheme: light dark` on `:root`.

### Color Tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-bg` | `#f5f4f0` | `#111110` | Primary background |
| `--color-bg-alt` | `#efefeb` | `#1a1a18` | Alternate/secondary background |
| `--color-bg-elevated` | `#f5f4f0` | `#1e1e1c` | Elevated surface (cards, modals) |
| `--color-bg-code` | `#efefeb` | `#1a1a18` | Code block background |
| `--color-bg-hover` | `#efefeb` | `#222220` | Hover state background |
| `--color-text` | `#111110` | `#f5f4f0` | Primary text |
| `--color-text-secondary` | `#333330` | `#ccccca` | Secondary text |
| `--color-text-muted` | `#7a7a72` | `#888882` | Muted/tertiary text |
| `--color-border` | `#d0cfc9` | `#2a2a28` | Default border |
| `--color-border-subtle` | `#e5e4de` | `#222220` | Subtle/lighter border |
| `--color-border-hover` | `#c0bfb9` | `#3a3a38` | Border on hover |
| `--color-accent` | `#d4381e` | `#e04a2e` | Accent color (active states, links) |
| `--color-accent-hover` | `#b82e16` | `#f05a3e` | Accent hover |
| `--color-accent-subtle` | `rgba(212,56,30,0.06)` | `rgba(224,74,46,0.08)` | Subtle accent background |
| `--color-code-bg` | `#efefeb` | `#1a1a18` | Inline code background |
| `--color-code-text` | `#333330` | `#ccccca` | Inline code text |
| `--color-blockquote-border` | `#d0cfc9` | `#333330` | Blockquote left border |
| `--color-blockquote-bg` | `#efefeb` | `#1a1a18` | Blockquote background |
| `--color-overlay-bg` | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.5)` | Modal/overlay backdrop |
| `--color-header-bg` | `rgba(245,244,240,0.85)` | `rgba(17,17,16,0.85)` | Header background (translucent) |
| `--color-text-inverse` | `#f5f4f0` | `#111110` | Inverted text color |

### Shadow Tokens

| Token | Description |
|---|---|
| `--shadow-sm` | Subtle small shadow (`0 1px 2px`) |
| `--shadow-md` | Medium shadow (`0 4px 6px`) |
| `--shadow-lg` | Large shadow (`0 10px 25px`) |

Shadow colors use dedicated shadow-color tokens with `light-dark()` for appropriate opacity in each scheme.

### Typography Tokens

| Token | Value | Purpose |
|---|---|---|
| `--font-sans` | `'Open Sans', system-ui, -apple-system, 'Segoe UI', sans-serif` | Body text font stack |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace` | Code font stack |
| `--font-size-xs` | `0.75rem` | Extra small text |
| `--font-size-sm` | `0.875rem` | Small text (sidebar, TOC, footer) |
| `--font-size-base` | `1rem` | Base body text |
| `--font-size-lg` | `1.125rem` | Large text |
| `--font-size-xl` | `1.25rem` | Extra large text |
| `--font-size-2xl` | `1.5rem` | Heading 2 size |
| `--font-size-3xl` | `2rem` | Heading 1 / hero size |

### Spacing and Shape Tokens

| Token | Value | Purpose |
|---|---|---|
| `--radius-sm` | `2px` | Small border radius (buttons, badges) |
| `--radius-md` | `4px` | Medium border radius (inputs, cards) |
| `--radius-lg` | `6px` | Large border radius (code blocks) |

### Transition Tokens

| Token | Value | Purpose |
|---|---|---|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Quick interactions (hover, focus) |
| `--transition-normal` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions (sidebar, accordion) |

### Layout Token

| Token | Value | Purpose |
|---|---|---|
| `--header-height` | `60px` | Fixed header height used for spacing and sticky offsets |

## Customizing Design Tokens

Since all visual properties flow through CSS custom properties, you can retheme the entire runtime by redefining tokens:

```css title="custom-tokens.css"
:root {
  --color-accent: light-dark(#0066cc, #66b3ff);
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-md: 8px;
}
```

For code-block styling and renderer chrome, override the `--ps-*` prefixed variables:

```css title="code-block-overrides.css"
:root {
  --ps-font-sans: "Inter", system-ui, sans-serif;
  --ps-font-mono: "Fira Code", monospace;
  --ps-font-size-sm: 0.8rem;
  --ps-radius-lg: 8px;
  --ps-color-border-subtle: light-dark(#e0e0e0, #333333);
}
```

## When to Use Each Tier

| Scenario | CSS Import | JS |
|---|---|---|
| Full documentation site with sidebar, TOC, navigation | `@pagesmith/core/css/standalone` | Standalone runtime |
| Blog or custom site with its own layout | `@pagesmith/core/css/content` | Content runtime |
| Embedding rendered markdown in an existing app | `@pagesmith/core/css/content` | Content runtime |
| Only need viewport protection | `@pagesmith/core/css/viewport` | None |
| Already own the entire presentation layer | None | None -- use `@pagesmith/core` for loading, validating, and rendering only |

When using the runtime programmatically (e.g., for SSR), use the accessor functions from `@pagesmith/core/runtime`:

```ts title="ssr-example.ts"
import { getContentCSS, getContentJS } from '@pagesmith/core/runtime'

const css = getContentCSS()
const js = getContentJS()

// Inject into your HTML template
const html = `
  <style>${css}</style>
  <script>${js}</script>
`
```

For Vite projects, prefer direct CSS imports over the accessor functions:

```ts title="src/theme.css"
@import '@pagesmith/core/css/fonts';
@import '@pagesmith/core/css/content';
```
