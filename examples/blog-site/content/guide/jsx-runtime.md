---
title: JSX Runtime
description: Server-side rendering without a framework
date: 2026-03-17
tags:
  - jsx
  - rendering
series: Core Concepts
seriesOrder: 1
---

# JSX Runtime

The `@pagesmith/site/jsx-runtime` module provides a lightweight JSX-to-HTML runtime for server-side rendering. It is designed for static site generation -- no virtual DOM, no hydration, no client-side runtime.

In `src/entry-server.tsx`, layout components return `HtmlString` trees that are coerced with **`String(...)`** before being embedded in the larger HTML document string returned from `render()`.

## How it works

The runtime exports three primitives:

- **`h(tag, props, ...children)`** -- Creates an `HtmlString` from an element tag or function component. Automatically escapes text content and attribute values.
- **`Fragment({ children, innerHTML })`** -- Renders children in sequence, or injects raw HTML via `innerHTML`.
- **`HtmlString`** -- A wrapper class that marks a string as safe HTML, preventing double-escaping.

## JSX configuration

Configure the TypeScript compiler to use the site JSX runtime:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

And the Vite/OXC transpiler:

```ts title="vite.config.ts (excerpt)"
oxc: {
  jsx: {
    runtime: 'automatic',
    importSource: '@pagesmith/site',
  },
}
```

## Differences from React

The site JSX runtime uses standard HTML attribute names:

```tsx
// React
<div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

// Site JSX
<div class="prose" innerHTML={html} />
```

Key differences:

| React                                  | Site JSX                      |
| -------------------------------------- | ----------------------------- |
| `className`                            | `class`                       |
| `htmlFor`                              | `for`                         |
| `dangerouslySetInnerHTML={{ __html }}` | `innerHTML`                   |
| `style={{ color: 'red' }}` (object)    | `style="color: red"` (string) |

## Rendering to string

Components render by calling `h()` which returns an `HtmlString`. Converting to a string is implicit:

```tsx
import { h, Fragment } from "@pagesmith/site/jsx-runtime";

function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}!</p>;
}

const html = String(<Greeting name="World" />);
// => '<p>Hello, World!</p>'
```

The React example uses `renderToStaticMarkup(<Component />)`. This example achieves the same result with `String(h(Component, props))` -- or simply by embedding the component in a template literal, since `HtmlString.toString()` returns the HTML.
