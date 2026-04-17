---
name: pagesmith-site-customize-theme
description: Customize layouts, CSS bundles, runtime JS, and components shipped by @pagesmith/site while keeping the defaults for everything untouched. Use when the user wants full control over a non-docs Pagesmith site's look and feel, needs to swap individual components, restyle with CSS variables, or opt out of specific runtime behaviors.
---

# Customize The @pagesmith/site Theme

`@pagesmith/site` ships four overridable layers. Start with the lightest and only reach for heavier tools when you need to.

If you are using the docs preset (`@pagesmith/docs`), use `pagesmith-docs-customize-theme` instead — it exposes higher-level config knobs.

## Read the locally installed reference first

Before editing CSS, JSX, or running CLI commands, open `node_modules/@pagesmith/site/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for the CSS bundle list, runtime entry points, exported components/layouts, the `--pagesmith-*` CSS custom properties, the `data-pagesmith-*` runtime hooks, and `pagesmith-site` CLI flags. If it disagrees with this skill or general training data, follow the local file.

Always invoke the CLI through `npx pagesmith-site <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` instead of a globally installed binary that may be a different version.

## Layer 1 — CSS bundles

Import only the bundles you need:

```ts
import '@pagesmith/site/css/chrome'
import '@pagesmith/site/css/content'
import '@pagesmith/site/css/code-block'
import '@pagesmith/site/css/code-inline'
import '@pagesmith/site/css/fonts'
```

Drop the imports you don't want and ship your own CSS for those regions. Custom property overrides go in a stylesheet imported **after** the Pagesmith bundles so cascade wins:

```css
:root {
  --pagesmith-color-accent: #3b82f6;
  --pagesmith-font-sans: 'Inter', system-ui, sans-serif;
}

[data-theme='dark'] {
  --pagesmith-color-accent: #60a5fa;
}
```

If you drop `css/fonts`, provide alternatives or typography breaks everywhere prose renders.

## Layer 2 — Runtime JS

`@pagesmith/site/runtime/*` exports small browser runtimes. Import only the ones your markup uses:

| Runtime | DOM hook |
| --- | --- |
| `theme-toggle` | `data-pagesmith-theme-toggle` |
| `toc-highlight` | `data-pagesmith-toc` |
| `code-tabs` | `data-pagesmith-code-tabs` |
| `copy-buttons` | `data-pagesmith-copy` |
| `sidebar` | `data-pagesmith-sidebar` |
| `search-trigger` | `data-pagesmith-search-trigger` |
| `footer-year` | `data-pagesmith-year` |
| `skip-link` | `data-pagesmith-skip-link` |

```ts
import '@pagesmith/site/runtime/theme-toggle'
import '@pagesmith/site/runtime/toc-highlight'
import '@pagesmith/site/runtime/copy-buttons'
```

Each runtime is a no-op when its target attribute is not present.

## Layer 3 — Layouts

`@pagesmith/site/layouts` ships default JSX layouts. Three ways to customize:

1. **Import as-is** — use the default layout verbatim.
2. **Wrap** — render the default layout inside your own shell.
3. **Replace** — write your own layout that renders the same `data-pagesmith-*` hooks.

```tsx
import { DefaultLayout } from '@pagesmith/site/layouts'
import { Header, Footer } from '@pagesmith/site/components'

export function PageLayout({ children, title }) {
  return (
    <html>
      <head><title>{title}</title></head>
      <body>
        <Header data-pagesmith-search-trigger />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

Keep the `data-pagesmith-*` attributes on anything interactive — skipping them silently disables runtime behavior.

## Layer 4 — Components

`@pagesmith/site/components` exports the low-level building blocks:

- `Header`
- `Footer`
- `TOC`
- `Sidebar`
- `SearchTrigger`
- `PageMeta`

Swap one, keep the rest:

```tsx
import { Header as DefaultHeader } from '@pagesmith/site/components'

export function Header(props) {
  return (
    <header class="my-header">
      <img src="/logo.svg" alt="" />
      <DefaultHeader {...props} />
    </header>
  )
}
```

## Dark mode

- The theme-toggle runtime writes `[data-theme='dark']` on `<html>` and persists the choice in `localStorage['pagesmith-theme']`.
- Prefer `[data-theme='dark']` selectors in CSS over raw `@media (prefers-color-scheme: dark)` so the toggle takes effect immediately.

## Verify

- `npx pagesmith-site dev` — toggle light/dark, resize viewport, check every overridden component.
- `npx pagesmith-site build` — succeeds without warnings.
- Check search, TOC highlight, and code copy buttons — all are runtime-dependent.

## Gotchas

- Don't edit anything under `node_modules/@pagesmith/site/`. Overrides live in the project.
- Keep `data-pagesmith-*` attributes on elements paired with runtime JS. Drop one and that behavior silently stops working.
- CSS custom properties (`--pagesmith-*`) are the supported extension API. Do not override internal rule blocks — class names are not part of the public contract.
- If you need bundled CSS + runtime but fully custom layout, use `pagesmithSite()` without `layouts:` and render the provided components from your own pages.
- When using `@pagesmith/docs`, prefer `pagesmith-docs-customize-theme`. It offers higher-level overrides via `pagesmith.config.json5` without JSX.

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `./references/site-guidelines.md`
- `./references/recipes.md`
