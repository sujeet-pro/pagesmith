import { join } from "path";
import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { createContentLayer } from "../content-layer";
import { defineCollection, defineConfig } from "../config";

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

function makeWatchLayer() {
  const config = defineConfig({
    root: FIXTURES_DIR,
    collections: {
      posts: defineCollection({
        loader: "markdown",
        directory: "content",
        schema: z.object({
          title: z.string(),
        }),
      }),
    },
  });
  return createContentLayer(config);
}

describe("ContentLayer.watch", () => {
  it("returns a WatchHandle with close method", () => {
    const layer = makeWatchLayer();
    const handle = layer.watch(() => {});
    expect(handle).toBeDefined();
    expect(typeof handle.close).toBe("function");
    handle.close();
  });

  it("can be called multiple times without errors", () => {
    const layer = makeWatchLayer();
    const handle1 = layer.watch(() => {});
    const handle2 = layer.watch(() => {});

    expect(handle1).toBeDefined();
    expect(handle2).toBeDefined();

    handle1.close();
    handle2.close();
  });

  it("close can be called multiple times safely", () => {
    const layer = makeWatchLayer();
    const handle = layer.watch(() => {});

    handle.close();
    expect(() => handle.close()).not.toThrow();
  });

  it("does not throw for collection with nonexistent directory", () => {
    const config = defineConfig({
      root: "/tmp/__nonexistent_ps_test__",
      collections: {
        missing: defineCollection({
          loader: "markdown",
          directory: "nonexistent",
          schema: z.object({ title: z.string() }),
        }),
      },
    });
    const layer = createContentLayer(config);
    const handle = layer.watch(() => {});
    expect(handle).toBeDefined();
    handle.close();
  });
});

describe("ContentLayer.getCacheStats", () => {
  it("returns zeroed stats before loading", () => {
    const layer = makeWatchLayer();
    const stats = layer.getCacheStats();

    expect(stats.collections).toBe(0);
    expect(stats.totalEntries).toBe(0);
    expect(stats.entries).toEqual({});
  });

  it("returns accurate stats after loading a collection", async () => {
    const layer = makeWatchLayer();
    await layer.getCollection("posts");
    const stats = layer.getCacheStats();

    expect(stats.collections).toBe(1);
    expect(stats.totalEntries).toBeGreaterThan(0);
    expect(stats.entries.posts).toBeGreaterThan(0);
  });

  it("resets to zero after invalidateAll", async () => {
    const layer = makeWatchLayer();
    await layer.getCollection("posts");
    layer.invalidateAll();
    const stats = layer.getCacheStats();

    expect(stats.collections).toBe(0);
    expect(stats.totalEntries).toBe(0);
  });
});
