# Search

`@pagesmith/docs` includes built-in full-text search powered by [Pagefind](https://pagefind.app/). Search is enabled by default and requires no additional configuration. The search index is generated at build time, so there is no server-side component or external service involved.

## How It Works

During `pagesmith build`, after all HTML pages have been rendered, the Pagefind CLI runs against the output directory. It scans every page that has a `data-pagefind-body` attribute (which the default layouts add to the `<main>` element), extracts text content, and builds a static search index in the `pagefind/` directory inside the build output.

At runtime, a search modal dialog is available on every page. Users can open it by clicking the search trigger button in the header or by pressing `Ctrl+K` (or `Cmd+K` on macOS). The Pagefind UI library is loaded lazily -- it initializes only when the search modal is opened for the first time, so it does not impact initial page load performance.

## Configuration

Search is configured through the `search` object in `pagesmith.config.json5`:

```json5
{
  search: {
    // Enable or disable search entirely (default: true)
    enabled: true,

    // Show thumbnail images in search results (default: false)
    showImages: false,

    // Show sub-results (section matches within a page) (default: true)
    showSubResults: true,

    // Extra CLI flags passed to the pagefind binary at build time
    pagefindFlags: [],
  },
}
```

### Configuration Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | When `false`, search is completely disabled: no search UI is rendered, no Pagefind assets are included, and the indexing step is skipped during build |
| `showImages` | `boolean` | `false` | Whether to show page thumbnail images in search results. Disabled by default to keep the search results clean and fast |
| `showSubResults` | `boolean` | `true` | Whether to show sub-results (individual section matches within a page). When enabled, search results expand to show the specific sections that matched |
| `pagefindFlags` | `string[]` | `[]` | Additional CLI flags passed directly to the Pagefind binary. Use this for advanced Pagefind configuration that is not exposed through the search config |

## Disabling Search

To disable search entirely:

```json5
{
  search: {
    enabled: false,
  },
}
```

When disabled:

- The search button is removed from the header
- Pagefind CSS and JS assets are not included in the page
- The Pagefind indexing step is skipped during build
- No `pagefind/` directory is created in the output

## Search Modal UI

The search interface is a native HTML `<dialog>` element that overlays the page. It contains the Pagefind UI widget which provides:

- A text input for search queries
- Real-time results as you type
- Highlighted matching text in results
- Sub-result expansion showing specific sections within a page
- Keyboard navigation through results

### Opening Search

There are two ways to open the search modal:

1. **Click** the search trigger button in the site header
2. **Keyboard shortcut**: `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS)

The same shortcut toggles the modal closed if it is already open.

### Closing Search

- Press `Escape` or use the keyboard shortcut again
- Click the close button inside the modal
- Click the backdrop area outside the dialog content

### Keyboard Navigation

When the search modal is open, the search input is automatically focused. You can type your query immediately. Pagefind handles keyboard navigation within the results list.

## How Search Works Without JavaScript

The search trigger button in the header is a regular HTML element. In environments where JavaScript is not available, the search modal will not function since it relies on JavaScript to open the dialog element and initialize Pagefind UI. The trigger button remains visible but non-functional.

If you want to hide the search trigger entirely when JavaScript is disabled, you can add a `<noscript>` style block in a custom layout:

```html
<noscript>
  <style>
    [data-search-trigger] { display: none; }
  </style>
</noscript>
```

The default theme does not hide the trigger automatically, since the presence of the button still signals that search exists on the site.

## Controlling What Gets Indexed

By default, the built-in layouts add `data-pagefind-body` to the `<main>` element of each page. Pagefind only indexes content inside elements marked with `data-pagefind-body`, which means headers, footers, sidebars, and table of contents are excluded from search results.

If you create custom layouts, make sure to add `data-pagefind-body` to the element that wraps your main content:

```tsx
<main data-pagefind-body="">
  <div class="prose" innerHTML={content} />
</main>
```

Without this attribute, Pagefind will not index the page content and it will not appear in search results.

### Excluding Content from Search

To exclude specific elements within an indexed page, use the `data-pagefind-ignore` attribute:

```html
<div data-pagefind-ignore>
  This content will not appear in search results.
</div>
```

This is useful for boilerplate sections, navigation breadcrumbs within the content area, or auto-generated content that would clutter search results.

## Extra Pagefind CLI Flags

The `pagefindFlags` array passes additional arguments directly to the Pagefind CLI during the build step. This is useful for advanced configuration that Pagesmith does not expose through its own config.

Common examples:

```json5
{
  search: {
    enabled: true,
    pagefindFlags: [
      // Exclude specific paths from indexing
      '--glob', '!**/404/**',

      // Set a custom bundle directory name
      '--bundle-dir', '_search',
    ],
  },
}
```

Refer to the [Pagefind CLI documentation](https://pagefind.app/docs/) for the full list of available flags.

Note that the `--site` flag is automatically set to the output directory and should not be provided in `pagefindFlags`.

## Customizing Search Appearance

The Pagefind UI ships with its own CSS that controls the search results layout. Since `@pagesmith/docs` initializes Pagefind with `resetStyles: false`, the default Pagefind styles are applied.

You can override the appearance using Pagefind's CSS custom properties. Add these overrides in a custom stylesheet or in a layout's `<style>` block:

```css
/* Override Pagefind UI colors */
:root {
  --pagefind-ui-scale: 1;
  --pagefind-ui-primary: #1a73e8;
  --pagefind-ui-text: #333;
  --pagefind-ui-background: #fff;
  --pagefind-ui-border: #e0e0e0;
  --pagefind-ui-tag: #f0f0f0;
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: 8px;
  --pagefind-ui-image-border-radius: 4px;
  --pagefind-ui-image-box-ratio: 3 / 2;
  --pagefind-ui-font: inherit;
}
```

These variables are documented in the [Pagefind UI styling reference](https://pagefind.app/docs/ui-usage/#customising-the-styles).

## Search in Development

During development (`pagesmith dev`), the search index is not rebuilt on every change. The search modal will still appear in the UI, but results may be stale or unavailable if you have not run a build recently. To test search with current content, run `pagesmith build` first, then use `pagesmith preview` to verify the search index.
