---
name: pagesmith-docs-customize-theme
description: Customize layouts, components, footer, CSS variables, and header of a @pagesmith/docs site without forking the package. Use when the user wants to restyle the docs, add a custom header or footer, swap the sidebar, change colors, override typography, add a branded banner, or wire project-specific components into the docs theme.
---

# Customize The @pagesmith/docs Theme

Customize in layers — start with the lightest override that solves the problem. Only fork a layout if the shallower seams are not enough.

## Read the locally installed reference first

Before editing config, JSX, or running CLI commands, open `node_modules/@pagesmith/docs/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for `theme.*` config keys, exported components/layouts, the `--pagesmith-*` CSS custom properties, and `pagesmith-docs` CLI flags. If it disagrees with this skill or general training data, follow the local file.

Always invoke the CLI through `npx pagesmith-docs <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` rather than a globally installed binary that may be a different version.

## Override seams (lightest → heaviest)

1. **Config fields** — `footerLinks`, `copyright`, `editLink`, `maintainer`, `logo` in `pagesmith.config.json5`. No code needed.
2. **CSS custom properties** — override `--pagesmith-*` variables in your own stylesheet.
3. **Individual components** — `theme.components.*` maps component names to your JSX files.
4. **Layout override** — `theme.layouts.*` replaces a whole page layout (docs, listing, home).
5. **Custom preset** — only if you need a radically different structure. Out of scope here; see `pagesmith-site-setup` and `pagesmith-site-use-preset`.

## Config-level customization

Use this for everything that fits in declarative config:

```json5
// pagesmith.config.json5
{
  logo: { src: '/logo.svg', alt: 'Acme' },
  footerLinks: [
    { label: 'GitHub', href: 'https://github.com/<owner>/<repo>' },
    { label: 'Twitter', href: 'https://twitter.com/acme' },
  ],
  copyright: '© 2026 Acme Inc.',
  editLink: {
    repoUrl: 'https://github.com/<owner>/<repo>',
    branch: 'main',
    dir: 'docs',
  },
  maintainer: { name: 'Acme Docs Team', url: 'https://acme.example.com' },
}
```

Prefer this over writing custom JSX — the preset updates in place and you do not have to re-test the whole theme.

## CSS custom properties

Override `--pagesmith-*` variables in a stylesheet the docs site imports:

```css
/* styles/docs-overrides.css */
:root {
  --pagesmith-color-accent: #6d28d9;
  --pagesmith-color-accent-contrast: #ffffff;
  --pagesmith-font-sans: 'Inter', system-ui, sans-serif;
  --pagesmith-sidebar-width: 280px;
}

[data-theme='dark'] {
  --pagesmith-color-accent: #a78bfa;
}
```

Wire it up:

```json5
// pagesmith.config.json5
{
  css: ['./styles/docs-overrides.css'],
}
```

Place the override stylesheet **after** the default Pagesmith CSS so cascade wins. The preset handles ordering when you use `css:`.

## Component-level override

Swap a single component while keeping the rest of the theme:

```tsx
// theme/Footer.tsx
import type { FooterProps } from '@pagesmith/docs/components'

export default function Footer(props: FooterProps) {
  return (
    <footer class="acme-footer">
      <div>{props.copyright}</div>
      <nav>
        {props.links.map(l => (
          <a href={l.href}>{l.label}</a>
        ))}
      </nav>
    </footer>
  )
}
```

```json5
// pagesmith.config.json5
{
  theme: {
    components: {
      Footer: './theme/Footer.tsx',
    },
  },
}
```

Overridable components (names are stable across minor versions):

| Name | Purpose |
| --- | --- |
| `Header` | Top bar, logo, nav, search trigger |
| `Footer` | Bottom bar, links, copyright |
| `Sidebar` | Section navigation |
| `TOC` | Right-side table of contents |
| `SearchTrigger` | Opens the search modal |
| `PageMeta` | "Last updated", "Edit this page" links |

## Layout override

For a wholesale page rewrite:

```tsx
// theme/DocsLayout.tsx
import type { DocsLayoutProps } from '@pagesmith/docs'
import { Header, Sidebar, Footer, TOC } from '@pagesmith/docs/components'

export default function DocsLayout(props: DocsLayoutProps) {
  return (
    <div class="acme-docs">
      <Header {...props.header} />
      <div class="acme-docs__body">
        <Sidebar {...props.sidebar} />
        <article>
          {props.children}
          <TOC {...props.toc} />
        </article>
      </div>
      <Footer {...props.footer} />
    </div>
  )
}
```

```json5
// pagesmith.config.json5
{
  theme: {
    layouts: {
      docs: './theme/DocsLayout.tsx',
      home: './theme/HomeLayout.tsx',
      listing: './theme/ListingLayout.tsx',
    },
  },
}
```

Only the layouts you specify are overridden — everything else keeps the preset default.

## Preserve runtime hooks

The shipped runtime (theme toggle, TOC highlight, sidebar collapse, code tabs, copy buttons, search) hooks onto `data-pagesmith-*` attributes. If you rewrite layouts or components:

- Keep `data-pagesmith-theme-toggle` on the theme-toggle button.
- Keep `data-pagesmith-toc` on the TOC container.
- Keep `data-pagesmith-sidebar` on the sidebar nav.
- Keep `data-pagesmith-search-trigger` on any element that opens search.

Drop one and the corresponding interactive behavior silently stops working.

## Dark mode

- Dark theme toggles by setting `[data-theme='dark']` on `<html>`.
- Use `[data-theme='dark']` selectors in your CSS, not `@media (prefers-color-scheme)` alone.
- The toggle button writes `data-theme` and stores user choice in `localStorage` under `pagesmith-theme`.

## Verify

```bash
npx pagesmith-docs dev
```

- Toggle light/dark and check every overridden component.
- Resize the viewport; sidebar/TOC should collapse appropriately.
- `npx pagesmith-docs build` must still succeed.

## Gotchas

- Don't edit files under `node_modules/@pagesmith/docs/theme/`. Upgrades will overwrite them.
- Always re-check search, theme toggle, and TOC highlight after a theme change — they depend on `data-pagesmith-*` attributes.
- `css:` paths are relative to the config file, not the project root.
- When overriding `Header`, keep the search trigger unless you know you want to remove search entirely.
- Keep custom JSX layouts minimal; import `@pagesmith/docs/components` for the heavy pieces so you inherit accessibility behavior.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/docs-guidelines.md`
- `./references/recipes.md`
