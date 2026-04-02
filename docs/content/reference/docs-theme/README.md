# Docs Theme Reference

The `@pagesmith/docs` package includes a complete default theme that provides layouts, styles, and runtime behavior for documentation sites. The theme is designed around a minimal, monochrome aesthetic that adapts to light and dark color schemes automatically.

## Theme File Structure

The theme is located in the `theme/` directory of the `@pagesmith/docs` package:

```
theme/
  components/
    DocFooter.tsx         Prev/next navigation and copyright footer
    DocHeader.tsx         Sticky top bar with logo, nav, and search trigger
    DocSidebar.tsx        Left navigation sidebar with section grouping
    DocTOC.tsx            Table of contents (right sidebar and mobile accordion)
    Html.tsx              Root HTML document shell (head, meta, scripts, body)
  layouts/
    DocHome.tsx           Landing page layout with hero and features
    DocPage.tsx           Standard 3-column documentation page
    DocNotFound.tsx       404 error page
  runtime/
    main.ts              Browser entry point, initializes all runtime modules
    search.ts             Search modal with Pagefind UI
    sidebar.ts            Mobile sidebar toggle and close behavior
    toc-highlight.ts      Active heading tracking in the TOC
  styles/
    main.css              Master stylesheet entry (imports all others)
    foundations/
      reset.css           CSS reset
      fonts.css           Font face declarations
      tokens.css          Design token custom properties
    content/
      prose.css           Typography styles for rendered markdown
      toc.css             Table of contents styling
    code/
      block.css           Code block frames, titles, copy buttons
      inline.css          Inline code styling
      tabs.css            Tabbed code block UI
      line-features.css   Line numbers, highlighting, diff marks
      lang-icons.css      Language badge icons in code blocks
    layout/
      grid.css            Responsive 3-column grid system
      header.css          Sticky header bar
      sidebar.css         Left sidebar navigation
      footer.css          Footer with prev/next cards
      home.css            Home page specific styles
    components/
      search.css          Search trigger button and modal dialog
      not-found.css       404 page styling
```

## Default Layouts

### DocHome

The home page layout renders a landing page with an optional hero section and features grid. It receives props including `content` (rendered markdown), `frontmatter`, and `site` configuration.

The hero section is built from frontmatter data. It supports:

- `hero.name` -- displayed as a small label above the main heading
- `hero.text` -- the primary `<h1>` heading
- `hero.tagline` -- a subtitle paragraph below the heading
- `hero.actions` -- an array of call-to-action buttons, each with `text`, `link`, and optional `theme` (`"brand"` or `"alt"`)

If no explicit `hero` frontmatter key is provided, the layout falls back to constructing a hero from `title`, `tagline`, `description`, and `actions` frontmatter fields.

The features grid accepts a `features` array in frontmatter, where each feature has:

- `icon` -- emoji or text icon
- `title` -- feature heading
- `details` -- feature description

Any markdown content below the frontmatter is rendered in a centered content section beneath the features.

The DocHome layout uses the `.doc-home` CSS class with a single-column centered layout (max-width `100ch`).

### DocPage

The standard documentation page layout with a 3-column responsive grid. This is the default layout for all non-home content pages.

The three columns are:

1. **Left sidebar** (`DocSidebar`) -- hierarchical navigation grouped by content section
2. **Main content** (`<main>`) -- the rendered markdown with page title, description, and prev/next navigation
3. **Right aside** (`DocTOC`) -- table of contents extracted from page headings

The layout includes:

- A page header with the `<h1>` title and optional description from frontmatter
- A mobile TOC accordion (`<details>`) that appears when the right aside is hidden
- The rendered prose content
- A footer with prev/next page navigation cards and copyright information

Props include `sidebarSections` (auto-generated from the content tree), `prev`/`next` links for sequential navigation, and `headings` for the TOC.

### DocNotFound

A simple 404 error page with:

- A large "404" code display
- "Page Not Found" heading
- An explanatory message
- A "Go Home" button linking to the root

The layout uses the `.doc-not-found` CSS class with a vertically and horizontally centered design.

## Components

### Html (`Html.tsx`)

The root HTML document shell wrapping every page. Responsible for:

- `<!DOCTYPE html>` and `<html lang>` attribute from config
- `<meta charset>`, viewport, description, and OpenGraph tags
- `<meta name="color-scheme" content="light dark">` for automatic dark mode
- Separate `<meta name="theme-color">` tags for light and dark modes (values from `theme.lightColor` / `theme.darkColor`)
- Google Analytics script injection (when `analytics.googleAnalytics` is configured)
- Font preloading for woff2 font files from `@pagesmith/core`
- CSS stylesheet link
- Runtime JavaScript inclusion
- `<noscript>` fallback styling
- Pagefind search initialization script (when search is enabled)

### DocHeader (`DocHeader.tsx`)

The sticky header bar at the top of every page:

- Hamburger menu toggle for mobile sidebar (hidden at `>= 140ch`)
- Site name/logo linking to the home page (or `homeLink` if configured)
- Navigation links from `meta.json5` header links with `.active` class for current section
- Search trigger button (when search is enabled)
- Maximum inner width of `1400px`, centered with auto margins
- Uses `backdrop-filter: blur(12px)` for a frosted glass appearance

### DocSidebar (`DocSidebar.tsx`)

The left navigation sidebar:

- Organized by content sections with uppercase, small-caps section headings
- Supports collapsible section groups (when `sidebar.collapsible` is true in config)
- Each section can specify `collapsed: true` in `meta.json5` to start collapsed
- Links use muted text that becomes prominent on hover and active
- Nested items are indented with slightly smaller font size
- Active items get a subtle accent background
- Multi-package support via `packages` config (shows package labels)
- At `>= 140ch`, the sidebar is sticky within the grid
- Below `140ch`, it becomes a fixed overlay with a smooth slide transition

### DocTOC (`DocTOC.tsx`)

The right-side table of contents:

- Built from the `headings` array extracted during markdown processing
- Renders as a nested list of links to heading anchors
- Active heading highlighted via the `toc-highlight.ts` runtime module
- At `>= 110ch`, appears as a sticky aside column
- Below `110ch`, replaced by a `<details>` accordion above the article content

### DocFooter (`DocFooter.tsx`)

The page footer:

- Prev/next navigation cards for sequential page browsing (2-column grid, collapses to single column below `800px`)
- Footer links from the `footerLinks` config
- Copyright line

## CSS Architecture

### Design Tokens

> [!NOTE]
> These design tokens are specific to the `@pagesmith/docs` default theme. They differ from `@pagesmith/core`'s standalone CSS tokens. See the [Runtime reference](/reference/runtime/) for core tokens.

All visual properties are defined as CSS custom properties in `tokens.css` under the `:root` selector. The theme uses the CSS `light-dark()` function for every color value, which automatically responds to the user's `prefers-color-scheme` media query. The `:root` sets `color-scheme: light dark` to enable this behavior.

#### Color Tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#111111` | Primary background |
| `--color-bg-alt` | `#fafafa` | `#1a1a1a` | Alternate/secondary background |
| `--color-bg-elevated` | `#ffffff` | `#1e1e1e` | Elevated surface (cards, modals) |
| `--color-bg-code` | `#f8f8f8` | `#1a1a1a` | Code block background |
| `--color-bg-hover` | `#f4f4f5` | `#252525` | Hover state background |
| `--color-text` | `#111111` | `#e5e5e5` | Primary text |
| `--color-text-secondary` | `#333333` | `#cccccc` | Secondary text |
| `--color-text-muted` | `#999999` | `#888888` | Muted/tertiary text |
| `--color-border` | `#e5e5e5` | `#2a2a2a` | Default border |
| `--color-border-subtle` | `#f0f0f0` | `#222222` | Subtle/lighter border |
| `--color-border-hover` | `#e0e0e0` | `#3a3a3a` | Border on hover |
| `--color-accent` | `#000000` | `#e5e5e5` | Accent color (active states) |
| `--color-accent-hover` | `#1a1a1a` | `#cccccc` | Accent hover |
| `--color-accent-subtle` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | Subtle accent background |
| `--color-code-bg` | `#f8f8f8` | `#1a1a1a` | Inline code background |
| `--color-code-text` | `#333333` | `#cccccc` | Inline code text |
| `--color-blockquote-border` | `#e0e0e0` | `#333333` | Blockquote left border |
| `--color-blockquote-bg` | `#fafafa` | `#1a1a1a` | Blockquote background |
| `--color-overlay-bg` | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.5)` | Modal/overlay backdrop |
| `--color-header-bg` | `rgba(255,255,255,0.85)` | `rgba(17,17,17,0.85)` | Header background (translucent) |
| `--color-text-inverse` | `#ffffff` | `#111111` | Inverted text color |

#### Shadow Tokens

| Token | Description |
|---|---|
| `--shadow-sm` | Subtle small shadow (`0 1px 2px`) |
| `--shadow-md` | Medium shadow (`0 4px 6px`) |
| `--shadow-lg` | Large shadow (`0 10px 25px`) |

Shadow colors also use `light-dark()` for appropriate opacity in each scheme.

#### Typography Tokens

| Token | Value | Purpose |
|---|---|---|
| `--font-sans` | `"Avenir Next", Avenir, "Segoe UI", sans-serif` | Body text font stack |
| `--font-mono` | `"SFMono-Regular", "Cascadia Code", Menlo, Consolas, monospace` | Code font stack |
| `--font-size-xs` | `0.75rem` | Extra small text |
| `--font-size-sm` | `0.875rem` | Small text (sidebar, TOC, footer) |
| `--font-size-base` | `1rem` | Base body text |
| `--font-size-lg` | `1.125rem` | Large text (logo) |
| `--font-size-xl` | `1.25rem` | Extra large |
| `--font-size-2xl` | `1.5rem` | Heading 2 size |
| `--font-size-3xl` | `2rem` | Heading 1 / hero size |

#### Spacing and Shape Tokens

| Token | Value | Purpose |
|---|---|---|
| `--radius-sm` | `4px` | Small border radius (buttons, badges) |
| `--radius-md` | `6px` | Medium border radius (inputs, cards) |
| `--radius-lg` | `8px` | Large border radius (modals, code blocks) |

#### Transition Tokens

| Token | Value | Purpose |
|---|---|---|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Quick interactions (hover, focus) |
| `--transition-normal` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions (sidebar, accordion) |

#### Layout Tokens

| Token | Value | Purpose |
|---|---|---|
| `--header-height` | `60px` | Fixed header height used for spacing and sticky offsets |

### Color Scheme

The theme uses the modern CSS `light-dark()` function for automatic dark mode support. This approach avoids duplicating styles in media queries -- every color token is defined once with both values:

```css
:root {
  color-scheme: light dark;
  --color-bg: light-dark(#ffffff, #111111);
  --color-text: light-dark(#111111, #e5e5e5);
}
```

The browser automatically selects the correct value based on the user's system preference (`prefers-color-scheme`). The `color-scheme: light dark` declaration tells the browser that the page supports both modes, which also affects form controls and scrollbars.

The `<meta name="color-scheme" content="light dark">` tag is included in the HTML head, along with separate `<meta name="theme-color">` tags for light and dark modes (values configurable via `theme.lightColor` and `theme.darkColor` in the config).

## Responsive Grid System

The layout uses character-based breakpoints (`ch` units) for responsive behavior, ensuring the grid adapts based on how much content can fit rather than arbitrary pixel widths.

### Breakpoints

| Breakpoint | Layout | Description |
|---|---|---|
| `< 110ch` | Single column | Both sidebars hidden. Mobile TOC accordion visible. Sidebar available as a fixed overlay. |
| `>= 110ch` | Content + right aside | Right aside (TOC) becomes a sticky column at `30ch` width. Mobile TOC hidden. |
| `>= 140ch` | 3-column | Left sidebar (navigation) joins the grid at `30ch` width. Sidebar is sticky, no longer an overlay. Hamburger menu hidden. |
| `>= 160ch` | Centered 3-column | Content column gains a `100ch` max-width. The three columns are centered with `justify-content: center`. |

Additionally, a pixel-based breakpoint at `640px` adjusts padding and font sizes for small mobile screens.

### Grid Structure

The grid is defined on `.doc-layout` using CSS Grid:

```css
/* < 110ch: single column */
.doc-layout {
  grid-template-columns: minmax(0, 1fr);
}

/* >= 110ch: content + TOC */
@media (min-width: 110ch) {
  .doc-layout {
    grid-template-columns: minmax(0, 1fr) 30ch;
  }
}

/* >= 140ch: sidebar + content + TOC */
@media (min-width: 140ch) {
  .doc-layout {
    grid-template-columns: 30ch minmax(0, 1fr) 30ch;
  }
}

/* >= 160ch: centered with max content width */
@media (min-width: 160ch) {
  .doc-layout {
    grid-template-columns: 30ch minmax(0, 100ch) 30ch;
    justify-content: center;
  }
}
```

### Mobile Sidebar Overlay

On viewports narrower than `140ch`, the left sidebar is positioned as a fixed overlay that slides in from the left. It is controlled by a hidden checkbox (`#sidebar-toggle`) using the CSS checkbox hack pattern:

- The checkbox is visually hidden but accessible
- A hamburger button in the header is a `<label>` for the checkbox
- When checked, the sidebar transforms from `translateX(-100%)` to `translateX(0)`
- A semi-transparent overlay backdrop appears behind the sidebar

JavaScript enhances this with:
- Closing on clicks outside the sidebar
- Closing when clicking a navigation link
- Closing on the Escape key

### Mobile TOC Accordion

On viewports narrower than `110ch`, the right-side TOC is hidden and replaced by a `<details>` accordion element placed above the article content. The accordion uses a custom arrow indicator via `clip-path` that rotates when opened.

## Runtime Modules

The theme's runtime JavaScript is a progressive enhancement layer. The site works fully without JavaScript -- the runtime adds interactivity improvements.

### Entry Point

`runtime/main.ts` initializes all modules on page load:

```ts
initSidebar()
initTocHighlight()
initSearch()
```

Code block interactivity (copy buttons) is handled by Expressive Code through inline scripts injected during markdown processing.

### Sidebar Toggle (`sidebar.ts`)

Manages the mobile sidebar overlay behavior:

- Closes the sidebar when clicking outside (on the overlay backdrop)
- Closes the sidebar when clicking a navigation link (for single-page feel)
- Closes the sidebar on the Escape key
- Operates by toggling the hidden `#sidebar-toggle` checkbox

### TOC Highlight (`toc-highlight.ts`)

Uses `IntersectionObserver` to track which heading is currently visible in the viewport and highlights the corresponding entry in the right-side table of contents.

- Observes all headings referenced by TOC links (via `.doc-aside .doc-toc-item a` and `.sidebar-right .toc-item a` selectors)
- Uses a root margin of `-80px 0px -66% 0px` to activate near the top of the viewport
- Applies the `.active` class to the current TOC item's parent `<li>`
- Smoothly scrolls the active TOC item into view when the active heading changes

### Search (`search.ts`)

Manages the Pagefind search modal:

- Opens the search modal (`<dialog>`) when clicking the search trigger button
- Supports `Ctrl+K` / `Cmd+K` keyboard shortcut to toggle the modal
- Lazily initializes Pagefind UI on first open for smaller initial bundle size
- Configures Pagefind with `showSubResults` and `showImages` from data attributes on the dialog element
- Auto-focuses the search input after the modal opens
- Closes on backdrop click (clicking outside the dialog content)

## Header

The header is a fixed, translucent bar at the top of every page with a blur backdrop effect:

- Uses `backdrop-filter: blur(12px)` for a frosted glass appearance
- Contains: hamburger toggle (mobile only), site logo/name, navigation links, and search trigger
- Maximum inner width of `1400px`, centered with auto margins
- The hamburger button is hidden at `>= 140ch` when the sidebar is part of the grid layout
- Navigation links show an `.active` class for the current section

## Sidebar

The left sidebar displays hierarchical navigation organized by content sections:

- Sections are displayed with uppercase, small-caps headings
- Links use muted text that becomes prominent on hover and when active
- Nested items are indented with slightly smaller font size
- Active items get a subtle accent background
- Non-expanded groups have their nested children hidden
- Collapsible groups (when `sidebar.collapsible` is enabled) toggle their children on click
- At `>= 140ch`, the sidebar is sticky within the grid with `height: calc(100vh - var(--header-height))`
- Below `140ch`, it becomes a fixed overlay with a smooth slide transition

## Footer

The page footer appears at the bottom of each `DocPage` and contains:

- **Prev/Next navigation** -- a 2-column grid of card-style links for sequential page browsing. Each card shows a directional label ("Previous" / "Next") and the page title. On screens below `800px`, the grid collapses to a single column.
- **Footer links** -- a centered row of links from the `footerLinks` config
- **Copyright** -- a centered copyright line at the bottom

## Overriding Layouts

To replace a default layout with a custom one, register it in `pagesmith.config.json5`:

```json5
theme: {
  layouts: {
    home: './theme/layouts/CustomHome.tsx',
    page: './theme/layouts/CustomPage.tsx',
  },
}
```

Custom layouts must be JSX files that export a function component. The component receives the same props as the default layout it replaces. The engine looks for exports in this order:

1. `default` export
2. Named export matching the capitalized layout name (e.g., `DocHome`, `Home`)

Section-level `meta.json5` files can also assign layouts via `layout` (for the section index page) and `itemLayout` (for items within the section). These layout names must be registered in `theme.layouts`.

## Overriding Styles

To add custom CSS alongside the default theme, create your own CSS file and reference it from a custom layout that imports or links to your stylesheet. The default theme's styles are bundled into a single `style.css` file in the build output.

Since all visual properties are controlled through CSS custom properties, you can override the theme's appearance by redefining tokens:

```css
:root {
  --color-accent: light-dark(#0066cc, #66b3ff);
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-md: 8px;
}
```

To change the color scheme without modifying individual tokens, override the `--color-bg`, `--color-text`, and related surface tokens. All components inherit from these tokens, so changes propagate throughout the theme.

For structural changes (different grid layouts, sidebar width, header height), override the corresponding CSS classes or create a custom layout via the `theme.layouts` configuration option.
