---
name: write-custom-validator
description: Add a project-specific content validator (e.g. enforce internal link patterns, require cover images, flag TODO comments) using the Pagesmith validator API.
---

# Write A Custom Content Validator

## When To Use This

Zod schemas cover data shape; content validators cover semantic rules that need the full markdown AST: "no broken internal links", "every blog post has a `coverImage`", "no bare TODOs", etc.

## Steps

1. Implement `ContentValidator`:

```ts
import type { ContentValidator } from '@pagesmith/core'
import { visit } from 'unist-util-visit'

export const requireCoverImage: ContentValidator = {
  name: 'require-cover-image',
  validate(ctx) {
    if (!ctx.entry.data.coverImage) {
      return [{
        field: 'coverImage',
        message: 'Blog posts must declare a coverImage',
        severity: 'error',
      }]
    }
    return []
  },
}
```

2. Attach to one or more collections:

```ts
import { defineCollection, z } from '@pagesmith/core'
import { requireCoverImage } from './validators/require-cover-image'

export const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({ title: z.string(), coverImage: z.string().optional() }),
  validators: [requireCoverImage],
})
```

3. Decide on built-in validators:

By default Pagesmith runs `linkValidator`, `headingValidator`, and `codeBlockValidator`. Disable them with `disableBuiltinValidators: true` on a collection if they conflict with yours — otherwise your validators run alongside.

4. Run `layer.validate()` in a build script to fail CI on validator errors:

```ts
const results = await layer.validate()
const errors = results.flatMap(r => r.issues.filter(i => i.severity === 'error'))
if (errors.length) {
  for (const e of errors) console.error(e)
  process.exit(1)
}
```

## Rules

- Return `ValidationIssue[]`, not thrown errors, unless the validator itself crashed.
- Use `severity: 'warn'` for conventions and `severity: 'error'` for contract-level rules.
- Keep validators pure w.r.t. the AST (`ctx.mdast`). Pagesmith parses once and shares the AST across validators.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`
