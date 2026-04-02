# Shared Content Example

A shared content collection example demonstrating all supported loader types in `@pagesmith/core`:

- **Markdown** (`posts`, `pages`) -- file-based content with frontmatter
- **JSON** (`authors`) -- structured data files
- **YAML** (`configYaml`) -- configuration in YAML format
- **TOML** (`configToml`) -- configuration in TOML format
- **JSON5** (`configJson5`) -- configuration in JSON5 format with comments

## Content configuration

The `content.config.ts` file serves as a reference for content configuration with comprehensive Zod schemas covering validation, computed fields, and entry filtering.

## Kitchen-sink post

The `posts/kitchen-sink/` entry demonstrates all markdown pipeline features supported by `@pagesmith/core`, including GFM extensions, math, code blocks with Expressive Code, footnotes, alerts, and more.
