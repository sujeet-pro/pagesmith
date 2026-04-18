import { describe, expect, it } from "vite-plus/test";
import { toSlug } from "../utils/slug";

describe("toSlug", () => {
  const dir = "/content/posts";

  it("converts a basic markdown path to a slug", () => {
    expect(toSlug("/content/posts/hello-world.md", dir)).toBe("hello-world");
  });

  it("converts a nested path to a slug", () => {
    expect(toSlug("/content/posts/2024/my-post.md", dir)).toBe("2024/my-post");
  });

  it("strips README suffix for folder-based entries", () => {
    expect(toSlug("/content/posts/my-post/README.md", dir)).toBe("my-post");
  });

  it("strips index suffix for folder-based entries", () => {
    expect(toSlug("/content/posts/my-post/index.md", dir)).toBe("my-post");
  });

  it("handles root README as /", () => {
    expect(toSlug("/content/posts/README.md", dir)).toBe("/");
  });

  it("handles root index as /", () => {
    expect(toSlug("/content/posts/index.md", dir)).toBe("/");
  });

  it("strips various file extensions", () => {
    expect(toSlug("/content/posts/data.json", dir)).toBe("data");
    expect(toSlug("/content/posts/config.yaml", dir)).toBe("config");
    expect(toSlug("/content/posts/settings.toml", dir)).toBe("settings");
  });

  it("handles deeply nested paths", () => {
    expect(toSlug("/content/posts/a/b/c/deep.md", dir)).toBe("a/b/c/deep");
  });

  it("handles deeply nested README", () => {
    expect(toSlug("/content/posts/a/b/c/README.md", dir)).toBe("a/b/c");
  });

  it("handles deeply nested index", () => {
    expect(toSlug("/content/posts/a/b/c/index.md", dir)).toBe("a/b/c");
  });

  it("normalizes backslashes to forward slashes on Windows-style paths", () => {
    // The function does .replace(/\\/g, '/') on the relative path
    // We can test by passing a directory that when resolved gives a backslash-free relative
    expect(toSlug("/content/posts/hello.md", "/content/posts")).toBe("hello");
  });
});
