import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { formatPath, validateSchema } from '../validation/schema-validator'

describe('formatPath', () => {
  it('formats a simple field path', () => {
    expect(formatPath(['title'])).toBe('title')
  })

  it('formats a nested field path', () => {
    expect(formatPath(['author', 'name'])).toBe('author.name')
  })

  it('formats array index paths', () => {
    expect(formatPath(['tags', 0])).toBe('tags[0]')
  })

  it('formats mixed paths', () => {
    expect(formatPath(['authors', 0, 'email'])).toBe('authors[0].email')
  })

  it('formats an empty path', () => {
    expect(formatPath([])).toBe('')
  })
})

describe('validateSchema', () => {
  const schema = z.object({
    title: z.string(),
    count: z.number(),
    tags: z.array(z.string()).default([]),
  })

  it('returns validated data for valid input', () => {
    const { issues, validatedData } = validateSchema(
      { title: 'Hello', count: 5, tags: ['a'] },
      schema,
    )
    expect(issues).toEqual([])
    expect(validatedData.title).toBe('Hello')
    expect(validatedData.count).toBe(5)
    expect(validatedData.tags).toEqual(['a'])
  })

  it('applies default values', () => {
    const { issues, validatedData } = validateSchema({ title: 'Hello', count: 1 }, schema)
    expect(issues).toEqual([])
    expect(validatedData.tags).toEqual([])
  })

  it('throws on missing required fields', () => {
    expect(() => validateSchema({ count: 1 }, schema)).toThrow(/Schema validation failed/)
  })

  it('throws on wrong types', () => {
    expect(() => validateSchema({ title: 123, count: 'not a number' }, schema)).toThrow(
      /Schema validation failed/,
    )
  })

  it('error message includes field path', () => {
    try {
      validateSchema({ title: 123, count: 1 }, schema)
      expect.unreachable('should have thrown')
    } catch (err: any) {
      expect(err.message).toContain('title')
    }
  })

  it('validates nested objects', () => {
    const nestedSchema = z.object({
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    })

    const { issues, validatedData } = validateSchema(
      { author: { name: 'Test', email: 'test@example.com' } },
      nestedSchema,
    )
    expect(issues).toEqual([])
    expect(validatedData.author.name).toBe('Test')
  })

  it('throws on invalid nested object fields', () => {
    const nestedSchema = z.object({
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    })

    expect(() =>
      validateSchema({ author: { name: 'Test', email: 'not-an-email' } }, nestedSchema),
    ).toThrow(/Schema validation failed/)
  })

  it('validates arrays', () => {
    const arraySchema = z.object({
      items: z.array(z.number()),
    })

    const { issues, validatedData } = validateSchema({ items: [1, 2, 3] }, arraySchema)
    expect(issues).toEqual([])
    expect(validatedData.items).toEqual([1, 2, 3])
  })

  it('throws on invalid array elements', () => {
    const arraySchema = z.object({
      items: z.array(z.number()),
    })

    expect(() => validateSchema({ items: [1, 'two', 3] }, arraySchema)).toThrow(
      /Schema validation failed/,
    )
  })

  it('coerces date strings to Date objects', () => {
    const dateSchema = z.object({
      publishedDate: z.coerce.date(),
    })

    const { issues, validatedData } = validateSchema({ publishedDate: '2024-01-15' }, dateSchema)
    expect(issues).toEqual([])
    expect(validatedData.publishedDate).toBeInstanceOf(Date)
    expect(validatedData.publishedDate.getFullYear()).toBe(2024)
  })

  it('strips extra fields with strict schema', () => {
    const strictSchema = z
      .object({
        title: z.string(),
      })
      .strict()

    expect(() => validateSchema({ title: 'Hello', extra: 'field' }, strictSchema)).toThrow(
      /Schema validation failed/,
    )
  })

  it('passes through extra fields with passthrough schema', () => {
    const passthroughSchema = z
      .object({
        title: z.string(),
      })
      .passthrough()

    const { issues, validatedData } = validateSchema(
      { title: 'Hello', extra: 'field' },
      passthroughSchema,
    )
    expect(issues).toEqual([])
    expect(validatedData.title).toBe('Hello')
    expect(validatedData.extra).toBe('field')
  })
})
