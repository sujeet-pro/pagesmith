# Collections and Loaders

Collections are the core FS-CMS primitive in Pagesmith. Each collection maps a filesystem directory to:

- a loader
- a schema
- optional transforms, computed fields, filters, and validators

## Built-In Loaders

| Loader | Extensions | Notes |
| --- | --- | --- |
| `markdown` | `.md` | YAML frontmatter plus markdown body |
| `json` | `.json`, `.json5` | Strict JSON or JSON5 |
| `jsonc` | `.jsonc` | JSON with comments |
| `yaml` | `.yaml`, `.yml` | Structured config and content data |
| `toml` | `.toml` | Useful for feature flags or settings |

## Collection Hooks

```ts
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
  transform(entry) {
    entry.data.tags = entry.data.tags.map((tag) => tag.toLowerCase())
    return entry
  },
  computed: {
    slugPath: (entry) => `/posts/${entry.slug}/`,
  },
  filter(entry) {
    return !entry.data.draft
  },
})
```

## Slugs

Pagesmith generates slugs from relative file paths by default. Use `slugify(filePath, directory)` when you need custom URL rules.

## Custom Loaders

Custom loaders are small objects with `name`, `extensions`, and `load(filePath)`. Use them for CSV, XML, or proprietary export formats when the built-in loaders are not enough.

## Schema Strategy

Prefer schemas that describe exactly what your templates need:

- coerce dates at the schema level
- default array and boolean fields
- keep markdown-derived fields as computed fields or render metadata

## Practical Guidance

- Use one collection per durable content type.
- Keep singleton config files in their own collection.
- Prefer markdown collections for longform content and structured loaders for metadata-heavy content.
