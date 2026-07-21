---
name: pagesmith-site-customize-theme
description: Customize layouts, CSS bundles, runtime JS, and components shipped by @pagesmith/site while keeping the defaults for everything untouched. Use when the user wants full control over a non-docs Pagesmith site's look and feel, needs to swap individual components, restyle with CSS variables, or opt out of specific runtime behaviors.
allowed-tools: Bash(npx pagesmith-site *)
---

# Customize The @pagesmith/site Theme

`@pagesmith/site` ships four overridable layers. Start with the lightest and only reach for heavier tools when you need to.

If you are using the docs preset (`@pagesmith/docs`), use `pagesmith-docs-customize-theme` instead — it exposes higher-level config knobs.

## Read the locally installed reference first

Before editing CSS, JSX, or running CLI commands, open `node_modules/@pagesmith/site/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for the CSS bundle list, runtime entry points, exported components/layouts, the `--pagesmith-*` CSS custom properties, the `data-ps-*` runtime hooks, and `pagesmith-site` CLI flags. If it disagrees with this skill or general training data, follow the local file.

Always invoke the CLI through `npx pagesmith-site <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` instead of a globally installed binary that may be a different version.

## Layer 1 — CSS bundles

Import only the bundles you need:

```ts
import "@pagesmith/site/css/chrome";
import "@pagesmith/site/css/content";
import "@pagesmith/site/css/code-block";
import "@pagesmith/site/css/code-inline";
import "@pagesmith/site/css/fonts";
```

Drop the imports you don't want and ship your own CSS for those regions. Custom property overrides go in a stylesheet imported **after** the Pagesmith bundles so cascade wins:

```css
:root {
  --pagesmith-color-accent: #3b82f6;
  --pagesmith-font-sans: "Inter", system-ui, sans-serif;
}

[data-theme="dark"] {
  --pagesmith-color-accent: #60a5fa;
}
```

If you drop `css/fonts`, provide alternatives or typography breaks everywhere prose renders.

## Layer 2 — Runtime JS

`@pagesmith/site/runtime/*` exports small browser runtimes. Each one is a no-op when its DOM hook is absent, so import only the ones your markup uses.

Individual runtimes:

| Runtime                  | DOM hook(s)                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `runtime/theme`          | `[data-ps-theme-toggle-button]`, `[data-ps-theme-dropdown]`, `[data-ps-footer-scheme\|theme\|text-size]` |
| `runtime/toc-highlight`  | `[data-ps-toc]`                                                                                          |
| `runtime/code-blocks`    | `[data-ps-code-copy]`, `[data-ps-code-collapse]`, `[data-ps-code-collapse-toggle]`                       |
| `runtime/code-tabs`      | `[data-ps-code-tabs]`                                                                                    |
| `runtime/sidebar`        | `[data-ps-sidebar]`, `[data-ps-sidebar-modal]`                                                           |
| `runtime/search-trigger` | `[data-ps-search-trigger]` and `Cmd/Ctrl-K`                                                              |
| `runtime/footer-year`    | `[data-ps-footer-year]`                                                                                  |
| `runtime/skip-link`      | `[data-ps-skip-link]`                                                                                    |

Bundled entry points (use these if you prefer fewer imports):

- `runtime/chrome` — theme, sidebar, search, toc, footer-year, skip-link.
- `runtime/content` — code-blocks + code-tabs.
- `runtime/standalone` — chrome + content.

```ts
import "@pagesmith/site/runtime/theme";
import "@pagesmith/site/runtime/toc-highlight";
import "@pagesmith/site/runtime/code-blocks";
```

Legacy `data-theme-toggle` / `data-footer-*` attributes are still recognised as fallbacks, but prefer the `data-ps-*` form in new markup.

## Layer 3 — Layouts

`@pagesmith/site/layouts` ships composable JSX layouts. Three ways to customize:

1. **Import as-is** — use the shipped `PageShell`/`HomeLayout`/`ListingLayout` verbatim.
2. **Wrap** — render a shipped layout inside your own shell.
3. **Replace** — write your own layout that renders the same `data-ps-*` hooks.

```tsx
import { PageShell } from "@pagesmith/site/layouts";
import { SiteHeader, SiteFooter } from "@pagesmith/site/components";

export function PageLayout({ children, site, currentPath, headings, sidebarSections }) {
  return (
    <PageShell
      site={site}
      currentPath={currentPath}
      headings={headings}
      sidebarSections={sidebarSections}
    >
      <div class="prose">{children}</div>
    </PageShell>
  );
}
```

Available layouts: `PageShell` (aliased as `DocPageShell`), `HomeLayout`, `ListingLayout`, `NotFoundLayout`. Keep `data-ps-*` attributes on anything interactive — dropping one silently disables the paired runtime behavior.

## Layer 4 — Components

`@pagesmith/site/components` exports the low-level building blocks:

- `SiteDocument` (also exported as `Html`)
- `SiteHeader` / `DocHeader`
- `SiteSidebar` / `DocSidebar` / `SiteSidebarModal` / `DocSidebarModal`
- `SiteFooter` / `DocFooter`
- `TableOfContents` (`DocTOC`) and `AccordionTableOfContents`
- `Breadcrumbs`
- `ListingCards` / `DocListingCards`
- `ThemeDropdownControls`, `FooterThemeControls`
- `HeroSection`, `ActionButtons`
- `ContentMeta`

Swap one, keep the rest:

```tsx
import { SiteHeader } from "@pagesmith/site/components";

export function Header(props) {
  return (
    <header class="my-header">
      <img src="/logo.svg" alt="" />
      <SiteHeader {...props} />
    </header>
  );
}
```

## Dark mode

- The `runtime/theme` module writes `[data-theme='dark']` on `<html>` and persists the user choice in `localStorage['pagesmith-theme']`.
- Prefer `[data-theme='dark']` selectors in CSS over raw `@media (prefers-color-scheme: dark)` so the toggle takes effect immediately.

## Verify

- `npx pagesmith-site dev` — toggle light/dark, resize viewport, check every overridden component.
- `npx pagesmith-site build` — succeeds without warnings.
- Check search, TOC highlight, and code copy buttons — all are runtime-dependent.

## Gotchas

- Don't edit anything under `node_modules/@pagesmith/site/`. Overrides live in the project.
- Keep `data-ps-*` attributes on elements paired with runtime JS. Drop one and that behavior silently stops working.
- CSS custom properties (`--pagesmith-*`) are the supported extension API. Do not override internal rule blocks — class names are not part of the public contract.
- If you need bundled CSS + runtime but fully custom layout, compose your own layout from `@pagesmith/site/components` + `@pagesmith/site/layouts` and skip the docs preset entirely.
- When using `@pagesmith/docs`, prefer `pagesmith-docs-customize-theme`. It offers higher-level overrides via `pagesmith.config.json5` without JSX.

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `./references/site-guidelines.md`
- `./references/recipes.md`
