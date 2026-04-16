---
name: customize-theme
description: Override layouts, CSS, and runtime behavior shipped by @pagesmith/site while keeping the defaults for everything you don't touch.
---

# Customize The Pagesmith Theme

## Layers You Can Override

1. **CSS bundles** — opt into specific bundles only:

```ts
import '@pagesmith/site/css/chrome'
import '@pagesmith/site/css/content'
import '@pagesmith/site/css/code-block'
import '@pagesmith/site/css/code-inline'
import '@pagesmith/site/css/fonts'
```

Drop the ones you don't want; ship your own CSS for the rest.

2. **Runtime JS** — `@pagesmith/site/runtime/*` exports small browser runtimes (theme toggle, TOC highlight, code tabs, copy buttons, skip link, sidebar, footer-year, search trigger). Import only what you need.

3. **Layouts** — `@pagesmith/site/layouts` ships default JSX layouts. Import and compose, or write your own that render the same `data-pagesmith-*` hooks so the runtime still works.

4. **Components** — `@pagesmith/site/components` exports lower-level building blocks (Header, Footer, TOC, Sidebar, SearchTrigger). Swap any one and keep the rest.

5. **Preset theme override** — when using `@pagesmith/docs`, override layouts via `theme.layouts.*` in `pagesmith.config.json5`. See `@pagesmith/docs` skill `customize-theme` for that flow specifically.

## Steps

1. Import only the bundles you need.
2. Write project-level CSS after the Pagesmith imports so cascade wins.
3. Keep `data-pagesmith-*` attributes on elements that pair with runtime JS (theme toggle button, TOC container, code-block wrappers).
4. Use CSS custom properties (`--pagesmith-*`) for dark/light theming rather than overriding rule blocks.

## Rules

- Don't edit files under `node_modules/@pagesmith/site/`; customizations go in your project.
- Don't forget fonts — if you drop `css/fonts`, supply alternatives or the default typography breaks.
- If you write a custom Footer, keep the copyright block consistent with `pagesmith.config.json5` `copyright`.

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/recipes.md`
