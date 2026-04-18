---
name: pagesmith-core-write-validator
description: Add a project-specific content validator to a Pagesmith collection — enforce things like "all blog posts have a cover image", "no broken internal links", "no bare TODOs in prose", or "every reference page has a runnable example". Use when Zod frontmatter validation is not enough and you need semantic rules over the markdown AST.
---

# Write A Pagesmith Content Validator

## Read the locally installed reference first

Before implementing a validator, open `node_modules/@pagesmith/core/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for the `ContentValidator` interface, the `ctx` fields (`mdast`, `hast`, `html`, `entry`, `layer`, `collection`), the built-in validators that already run, and the `disableBuiltinValidators` flag. If it disagrees with this skill or general training data, follow the local file.

Run verification commands (`node --strip-types scripts/validate-content.ts`, `npx vitest`) through `npx` or `package.json` scripts so they resolve to the project's `node_modules/.bin` instead of a globally installed binary that may be a different version.

## What validators are for

Zod schemas cover the **shape** of data. Content validators cover **semantic** rules that need the full markdown AST, the rendered HTML, or cross-entry context. Examples:

- "Every blog post declares a `coverImage` and the file exists."
- "No internal link points at a missing slug."
- "Code blocks use one of the approved languages."
- "Every API reference page has at least one example."
- "No `TODO`/`FIXME` in published pages."

## Implement `ContentValidator`

```ts
// validators/require-cover-image.ts
import type { ContentValidator, ValidationIssue } from "@pagesmith/core";

export const requireCoverImage: ContentValidator = {
  name: "require-cover-image",
  validate(ctx) {
    const issues: ValidationIssue[] = [];
    if (!ctx.entry.data.coverImage) {
      issues.push({
        field: "coverImage",
        message: "Blog posts must declare a coverImage in frontmatter",
        severity: "error",
      });
    }
    return issues;
  },
};
```

`ctx` gives you:

| Field            | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| `ctx.entry`      | The collection entry (data, slug, file path).                          |
| `ctx.mdast`      | Parsed markdown AST (mdast) — shared across validators for efficiency. |
| `ctx.hast`       | Rendered hast (HTML AST) when available.                               |
| `ctx.html`       | The final HTML string for entries that went through `render()`.        |
| `ctx.collection` | Collection name the entry belongs to.                                  |
| `ctx.layer`      | Access to other collections for cross-entry checks.                    |

## Attach to a collection

```ts
import { defineCollection, z } from "@pagesmith/core";
import { requireCoverImage } from "./validators/require-cover-image";

export const posts = defineCollection({
  loader: "markdown",
  directory: "content/posts",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    coverImage: z.string().optional(),
  }),
  validators: [requireCoverImage],
});
```

## Built-in validators

By default Pagesmith runs:

- `linkValidator` — reports broken internal links.
- `headingValidator` — warns on duplicate slugs and skipped levels.
- `codeBlockValidator` — flags fences with unsupported languages.

Your validators run **alongside** the built-ins. To disable the built-ins for a collection, set `disableBuiltinValidators: true` — but prefer keeping them on and silencing specific warnings with your own rules.

## Run validators

On-demand:

```ts
import { createContentLayer, defineConfig } from "@pagesmith/core";
import collections from "./content.config";

const layer = createContentLayer(defineConfig({ collections }));

const results = await layer.validate(); // all collections
// or
const results = await layer.validate("posts"); // one collection

const errors = results.flatMap((r) => r.issues.filter((i) => i.severity === "error"));
if (errors.length) {
  for (const e of errors) console.error(`[${e.severity}] ${e.collection}/${e.slug}: ${e.message}`);
  process.exit(1);
}
```

Add a `validate-content` script to `package.json` and call it in CI:

```json
{
  "scripts": {
    "validate:content": "node --strip-types scripts/validate-content.ts"
  }
}
```

## Common validator patterns

### Walk the AST

```ts
import { visit } from "unist-util-visit";

export const noBareTodos: ContentValidator = {
  name: "no-bare-todos",
  validate(ctx) {
    const issues: ValidationIssue[] = [];
    visit(ctx.mdast, "text", (node) => {
      if (/\b(TODO|FIXME)\b/.test(node.value)) {
        issues.push({
          field: "body",
          message: `Found "${node.value.trim()}" — remove before publishing`,
          severity: "warn",
        });
      }
    });
    return issues;
  },
};
```

### Cross-entry checks (require an author)

```ts
export const requireAuthor: ContentValidator = {
  name: "require-author",
  async validate(ctx) {
    const author = await ctx.layer.getEntry("authors", ctx.entry.data.authorId);
    if (!author) {
      return [
        {
          field: "authorId",
          message: `Author "${ctx.entry.data.authorId}" not found in authors collection`,
          severity: "error",
        },
      ];
    }
    return [];
  },
};
```

### Enforce code-block languages

```ts
export const onlyApprovedLanguages: ContentValidator = {
  name: "only-approved-languages",
  validate(ctx) {
    const ok = new Set(["ts", "tsx", "js", "bash", "json", "json5", "md"]);
    const issues: ValidationIssue[] = [];
    visit(ctx.mdast, "code", (node) => {
      if (node.lang && !ok.has(node.lang)) {
        issues.push({
          field: "body",
          message: `Code block uses unapproved language "${node.lang}"`,
          severity: "warn",
        });
      }
    });
    return issues;
  },
};
```

## Severity

- `error` — fail `layer.validate()` and block CI. Use for contract violations.
- `warn` — surface in logs but don't fail. Use for conventions.
- `info` — informational only. Often used for "consider".

## Rules

- Return `ValidationIssue[]`, never throw. Throw only when the validator itself crashes (bug, not content error).
- Use `ctx.mdast`; Pagesmith parses markdown once and shares the AST across validators. Re-parsing is wasteful and hides bugs.
- Keep validators pure with respect to the AST — no mutation. If you need to rewrite content, write a remark plugin instead (see `pagesmith-core-customize-markdown`).
- Prefer small, single-rule validators over one big function. Debugging is easier and you can enable/disable per collection.

## Verify

```bash
node --strip-types scripts/validate-content.ts
```

- Seed a file that intentionally violates a rule; the validator must surface it with the right `slug` and `message`.
- Fix the file and confirm the validator passes.
- Measure runtime on a realistic content set. Validators run on every build — keep them fast.

## Gotchas

- Validators run on `layer.validate()` explicitly, not on every `getEntry` call. Missing your CI integration is the usual reason they "don't fire".
- `ctx.html` is only populated for entries that went through `render()`. If you need the rendered HTML, call `ctx.entry.render()` inside the validator first.
- For cross-entry checks, calling `ctx.layer.getEntry` inside a validator is fine but can be slow for large collections — cache lookups per validation run if it matters.
- A validator registered on a collection applies to every entry in that collection. For conditional rules (e.g. "only posts tagged `guide`"), check inside `validate`.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `./references/core-guidelines.md`
- Sibling skills: `pagesmith-core-add-collection`, `pagesmith-core-customize-markdown`.
