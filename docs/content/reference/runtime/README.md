# Runtime

`@pagesmith/core/runtime` exposes optional CSS and JS for teams that want a packaged markdown runtime.

## CSS Exports

- `getRuntimeCSS()`
- `getRuntimeCSSPath()`
- `getContentCSS()`
- `getContentCSSPath()`
- `getDiagramsCSS()`
- `getDiagramsCSSPath()`
- `getViewportCSS()`
- `getViewportCSSPath()`

## Why Use It

Use the runtime bundle when you want:

- prose styling
- code block styling
- diagram light/dark visibility helpers
- viewport overflow protection

Skip it when you already own the presentation layer and only need Pagesmith for loading, validating, and rendering content.
