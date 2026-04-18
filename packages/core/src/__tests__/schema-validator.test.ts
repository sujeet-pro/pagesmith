import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { formatPath, validateSchema } from "../validation/schema-validator";

describe("formatPath", () => {
  it("formats a simple field path", () => {
    expect(formatPath(["title"])).toBe("title");
  });

  it("formats a nested field path", () => {
    expect(formatPath(["author", "name"])).toBe("author.name");
  });

  it("formats array index paths", () => {
    expect(formatPath(["tags", 0])).toBe("tags[0]");
  });

  it("formats mixed paths", () => {
    expect(formatPath(["authors", 0, "email"])).toBe("authors[0].email");
  });

  it("formats an empty path", () => {
    expect(formatPath([])).toBe("");
  });
});

describe("validateSchema", () => {
  const schema = z.object({
    title: z.string(),
    count: z.number(),
    tags: z.array(z.string()).default([]),
  });

  it("returns validated data for valid input", () => {
    const { issues, validatedData } = validateSchema(
      { title: "Hello", count: 5, tags: ["a"] },
      schema,
    );
    expect(issues).toEqual([]);
    expect(validatedData.title).toBe("Hello");
    expect(validatedData.count).toBe(5);
    expect(validatedData.tags).toEqual(["a"]);
  });

  it("applies default values", () => {
    const { issues, validatedData } = validateSchema({ title: "Hello", count: 1 }, schema);
    expect(issues).toEqual([]);
    expect(validatedData.tags).toEqual([]);
  });

  it("returns issues for missing required fields", () => {
    const { issues, validatedData } = validateSchema({ count: 1 }, schema);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe("error");
    expect(validatedData).toEqual({ count: 1 });
  });

  it("returns issues for wrong types", () => {
    const { issues } = validateSchema({ title: 123, count: "not a number" }, schema);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.severity === "error")).toBe(true);
  });

  it("issue message includes field path", () => {
    const { issues } = validateSchema({ title: 123, count: 1 }, schema);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].field).toBe("title");
  });

  it("validates nested objects", () => {
    const nestedSchema = z.object({
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const { issues, validatedData } = validateSchema(
      { author: { name: "Test", email: "test@example.com" } },
      nestedSchema,
    );
    expect(issues).toEqual([]);
    expect(validatedData.author.name).toBe("Test");
  });

  it("returns issues for invalid nested object fields", () => {
    const nestedSchema = z.object({
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const { issues } = validateSchema(
      { author: { name: "Test", email: "not-an-email" } },
      nestedSchema,
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].field).toContain("email");
  });

  it("validates arrays", () => {
    const arraySchema = z.object({
      items: z.array(z.number()),
    });

    const { issues, validatedData } = validateSchema({ items: [1, 2, 3] }, arraySchema);
    expect(issues).toEqual([]);
    expect(validatedData.items).toEqual([1, 2, 3]);
  });

  it("returns issues for invalid array elements", () => {
    const arraySchema = z.object({
      items: z.array(z.number()),
    });

    const { issues } = validateSchema({ items: [1, "two", 3] }, arraySchema);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].field).toContain("items");
  });

  it("coerces date strings to Date objects", () => {
    const dateSchema = z.object({
      publishedDate: z.coerce.date(),
    });

    const { issues, validatedData } = validateSchema({ publishedDate: "2024-01-15" }, dateSchema);
    expect(issues).toEqual([]);
    expect(validatedData.publishedDate).toBeInstanceOf(Date);
    expect(validatedData.publishedDate.getFullYear()).toBe(2024);
  });

  it("returns issues for extra fields with strict schema", () => {
    const strictSchema = z
      .object({
        title: z.string(),
      })
      .strict();

    const { issues } = validateSchema({ title: "Hello", extra: "field" }, strictSchema);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("passes through extra fields with passthrough schema", () => {
    const passthroughSchema = z
      .object({
        title: z.string(),
      })
      .passthrough();

    const { issues, validatedData } = validateSchema(
      { title: "Hello", extra: "field" },
      passthroughSchema,
    );
    expect(issues).toEqual([]);
    expect(validatedData.title).toBe("Hello");
    expect(validatedData.extra).toBe("field");
  });
});
