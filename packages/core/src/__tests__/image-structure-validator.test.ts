import { describe, expect, it } from "vite-plus/test";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Root } from "mdast";
import {
  imageStructureValidator,
  validateImageHtml,
} from "../validation/image-structure-validator";

function mdast(raw: string): Root {
  return unified().use(remarkParse).parse(raw) as Root;
}

function runValidator(raw: string) {
  return imageStructureValidator.validate({
    filePath: "/tmp/post.md",
    slug: "/post",
    collection: "content",
    rawContent: raw,
    data: {},
    mdast: mdast(raw),
  });
}

describe("imageStructureValidator", () => {
  it("accepts the canonical figure > picture > source + img shape", async () => {
    const raw = [
      "# Post",
      "",
      "<figure>",
      "  <picture>",
      '    <source srcset="./dark.png" media="(prefers-color-scheme: dark)">',
      '    <img src="./light.png" alt="Diagram">',
      "  </picture>",
      "  <figcaption>Nice diagram.</figcaption>",
      "</figure>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues).toEqual([]);
  });

  it("accepts a bare <picture> (without outer <figure>) as long as the inside is valid", async () => {
    const raw = [
      "# Post",
      "",
      "<picture>",
      '  <source srcset="./dark.svg" media="(prefers-color-scheme: dark)">',
      '  <img src="./light.svg" alt="Diagram">',
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues).toEqual([]);
  });

  it("flags <figure> nested inside <picture>", async () => {
    const raw = [
      "# Post",
      "",
      "<picture>",
      '  <source srcset="./dark.png" media="(prefers-color-scheme: dark)">',
      "  <figure>",
      '    <img src="./light.png" alt="Diagram">',
      "  </figure>",
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues.length).toBeGreaterThan(0);
    const firstFigure = issues.find((i) => i.message.includes("<figure> is not allowed"));
    expect(firstFigure).toBeDefined();
    expect(firstFigure?.severity).toBe("error");
    expect(firstFigure?.field).toContain("line");
  });

  it("flags a <picture> with no <img> fallback", async () => {
    const raw = [
      "# Post",
      "",
      "<picture>",
      '  <source srcset="./dark.png" media="(prefers-color-scheme: dark)">',
      '  <source srcset="./light.png">',
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues.some((i) => i.message.includes("must contain a fallback <img>"))).toBe(true);
  });

  it("flags a <picture> that contains multiple <img> tags", async () => {
    const raw = [
      "# Post",
      "",
      "<picture>",
      '  <img src="./a.png" alt="A">',
      '  <img src="./b.png" alt="B">',
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues.some((i) => i.message.includes("exactly one <img>"))).toBe(true);
  });

  it("flags disallowed elements directly inside <picture>", async () => {
    const raw = [
      "# Post",
      "",
      "<picture>",
      "  <div>wrapper</div>",
      '  <img src="./img.png" alt="Diagram">',
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues.some((i) => i.message.includes("<div>"))).toBe(true);
  });

  it("flags unbalanced <picture> tags", async () => {
    const raw = ["# Post", "", "<picture>", '  <img src="./img.png" alt="Diagram">', ""].join("\n");

    const issues = await runValidator(raw);
    expect(issues.some((i) => i.message.includes("Unbalanced <picture>"))).toBe(true);
  });

  it("does not flag <picture> markup shown inside fenced code blocks", async () => {
    const raw = [
      "# Post",
      "",
      "Here is an example:",
      "",
      "```html",
      "<picture>",
      '  <figure><img src="x.png" alt="Bad"></figure>',
      "</picture>",
      "```",
      "",
    ].join("\n");

    // Note: pass a non-rawContent context here so the raw-content sweep is
    // bypassed; the MDAST walk alone should ignore fenced code.
    const issues = await imageStructureValidator.validate({
      filePath: "/tmp/post.md",
      slug: "/post",
      collection: "content",
      data: {},
      mdast: mdast(raw),
    });
    expect(issues).toEqual([]);
  });

  it("ignores HTML-looking text inside inline comments", async () => {
    const raw = [
      "# Post",
      "",
      "<picture>",
      "  <!-- <figure> allowed here because this is a comment -->",
      '  <img src="./img.png" alt="Diagram">',
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    expect(issues).toEqual([]);
  });

  it("reports the markdown line where the offending <picture> starts", async () => {
    const raw = [
      "# Post",
      "", // line 2
      "Intro.", // line 3
      "", // line 4
      "<picture>", // line 5
      "  <figure>", // line 6
      '    <img src="./x.png" alt="x">', // line 7
      "  </figure>",
      "</picture>",
      "",
    ].join("\n");

    const issues = await runValidator(raw);
    const match = issues.find((i) => i.message.includes("<figure> is not allowed"));
    expect(match).toBeDefined();
    expect(match?.field).toMatch(/line 5/);
  });
});

describe("validateImageHtml", () => {
  it("validates an HTML string directly and returns the same rule set", () => {
    const html = '<picture><figure><img src="x.png" alt="x"></figure></picture>';
    const issues = validateImageHtml(html);
    expect(issues.some((i) => i.message.includes("<figure> is not allowed"))).toBe(true);
  });

  it("returns no issues for valid markup", () => {
    const html =
      '<figure class="ps-figure"><picture><source srcset="x.avif" type="image/avif"><img src="x.webp" alt="x"></picture></figure>';
    const issues = validateImageHtml(html);
    expect(issues).toEqual([]);
  });
});
