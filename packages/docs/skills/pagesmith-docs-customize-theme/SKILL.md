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

1. **Config fields** — `icon`, `footerLinks`, `copyright`, `editLink`, `maintainer`, `theme.*` in `pagesmith.config.json5`. No code needed.
2. **CSS custom properties** — override `--pagesmith-*` variables in a stylesheet that `@pagesmith/docs` loads after its own bundles (for example by adding it to a custom layout via `theme.layouts`).
3. **Layout override** — `theme.layouts.*` replaces a whole page layout (`page`, `home`, `listing`, `notFound`) with your own TSX file. The individual components are composed inside the layout file, which is the supported way to swap a header/footer/sidebar without forking the preset.
4. **Custom preset** — only if you need a radically different structure. Out of scope here; see `pagesmith-site-setup` and `pagesmith-site-use-preset`.

## Config-level customization

Use this for everything that fits in declarative config (all keys validated by `packages/docs/schemas/pagesmith-config.schema.json`):

```json5
// pagesmith.config.json5
{
  // Header logo — inline SVG string OR public-relative path (auto-detected from public/favicon.* otherwise)
  icon: "./public/logo.svg",
  // Flat grid or grouped columns (up to 4 columns on wide screens)
  footerLinks: [
    { label: "GitHub", path: "https://github.com/<owner>/<repo>" },
    { label: "Twitter", path: "https://twitter.com/acme" },
  ],
  // Copyright is a struct, not a string. Leave endYear as null to auto-advance via browser.
  copyright: { projectName: "Acme", startYear: 2024, endYear: null },
  // Edit-link schema: { repo, branch?, label? }
  editLink: {
    repo: "https://github.com/<owner>/<repo>",
    branch: "main",
    label: "Edit this page",
  },
  maintainer: { name: "Acme Docs Team", link: "https://acme.example.com" },
  theme: {
    lightColor: "#f8fafc",
    darkColor: "#0f172a",
    defaultColorScheme: "auto",
    defaultTheme: "paper",
    defaultTextSize: "base",
  },
}
```

Prefer this over writing custom JSX — the preset updates in place and you do not have to re-test the whole theme.

## CSS custom properties

Override `--pagesmith-*` variables in a stylesheet that your layout imports:

```css
/* styles/docs-overrides.css */
:root {
  --pagesmith-color-accent: #6d28d9;
  --pagesmith-color-accent-contrast: #ffffff;
  --pagesmith-font-sans: "Inter", system-ui, sans-serif;
  --pagesmith-sidebar-width: 280px;
}

[data-theme="dark"] {
  --pagesmith-color-accent: #a78bfa;
}
```

Wire it up through a custom layout (there is no top-level `css:` key — `@pagesmith/docs` owns stylesheet composition):

```tsx
// theme/layouts/DocPage.tsx
import "../../styles/docs-overrides.css";
import { PageShell, SiteDocument } from "@pagesmith/docs";

export default function DocPage(props) {
  /* render PageShell ... */
}
```

Place the override stylesheet import **after** any `@pagesmith/docs` CSS so cascade wins.

## Layout override

For a page rewrite, replace the whole layout via `theme.layouts`:

```tsx
// theme/layouts/DocPage.tsx
import { SiteDocument } from "@pagesmith/docs/components";
import { PageShell } from "@pagesmith/docs/layouts";

export default function DocPage(props) {
  const { content, frontmatter, headings, slug, site, sidebarSections, prev, next } = props;
  return (
    <SiteDocument title={`${frontmatter.title} — ${site.title}`} site={site}>
      <PageShell
        site={site}
        currentPath={slug}
        headings={headings}
        sidebarSections={sidebarSections}
      >
        <article data-pagefind-body="">
          <div class="prose" innerHTML={content} />
        </article>
      </PageShell>
    </SiteDocument>
  );
}
```

```json5
// pagesmith.config.json5
{
  theme: {
    layouts: {
      page: "./theme/layouts/DocPage.tsx",
      home: "./theme/layouts/DocHome.tsx",
      listing: "./theme/layouts/DocListing.tsx",
      notFound: "./theme/layouts/DocNotFound.tsx",
    },
  },
}
```

Only the layouts you specify are overridden — everything else keeps the preset default. The four supported layout keys are `page`, `home`, `listing`, and `notFound`.

## Component building blocks

`@pagesmith/docs/components` re-exports everything under `@pagesmith/site/components`, so inside a custom layout you can compose:

| Component                                                | Purpose                                     |
| -------------------------------------------------------- | ------------------------------------------- |
| `SiteDocument` (aliased as `Html`)                       | `<html>` shell, `<head>`, security defaults |
| `SiteHeader` / `DocHeader`                               | Top bar with logo, nav, theme, search       |
| `SiteSidebar` / `DocSidebar` / `SiteSidebarModal`        | Section navigation (desktop + modal)        |
| `SiteFooter` / `DocFooter`                               | Bottom bar, links, copyright                |
| `TableOfContents` (`DocTOC`), `AccordionTableOfContents` | Right-side / accordion TOC                  |
| `Breadcrumbs`                                            | Auto-generated breadcrumbs                  |
| `ListingCards` (`DocListingCards`)                       | Home / listing page cards                   |
| `ThemeDropdownControls`, `FooterThemeControls`           | Theme / color-scheme / text-size controls   |
| `HeroSection`, `ActionButtons`                           | Home page hero + CTAs                       |
| `ContentMeta`                                            | "Last updated", "Edit this page" links      |

Layout wrappers from `@pagesmith/docs/layouts` (re-exported from `@pagesmith/site/layouts`): `PageShell` (aliased as `DocPageShell`), `HomeLayout`, `ListingLayout`, `NotFoundLayout`. Pair them with the runtime hooks in the next section.

## Preserve runtime hooks

The shipped runtime (theme toggle, TOC highlight, sidebar collapse, code tabs, copy buttons, search) hooks onto `data-ps-*` attributes. If you rewrite layouts or components:

- Keep `data-ps-theme-toggle-button` on the theme toggle button and `data-ps-theme-controls` on the wrapping region (`data-ps-theme-dropdown` on the dropdown form, if used).
- Keep `data-ps-toc` on the TOC container.
- Keep `data-ps-sidebar` and `data-ps-sidebar-modal` on the sidebar / modal containers.
- Keep `data-ps-search-trigger` on any element that opens search.
- Keep `data-ps-code-copy`, `data-ps-code-collapse`, and `data-ps-code-collapse-toggle` on code-block chrome if you re-emit it.

Drop one and the corresponding interactive behavior silently stops working. Legacy `data-theme-toggle` / `data-footer-*` aliases continue to work, but new markup should use the `data-ps-*` form.

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
- Always re-check search, theme toggle, and TOC highlight after a theme change — they depend on `data-ps-*` attributes.
- `theme.layouts.*` paths are resolved relative to the config file, not the project root.
- When replacing the header, keep `SiteHeader`'s search trigger element (the `data-ps-search-trigger` button) unless you know you want to remove search entirely.
- Keep custom JSX layouts minimal; import `@pagesmith/docs/components` for the heavy pieces so you inherit accessibility behavior.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/docs-guidelines.md`
- `./references/recipes.md`
