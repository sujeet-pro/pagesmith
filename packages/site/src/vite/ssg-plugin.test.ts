import { describe, expect, it, vi } from "vite-plus/test";
import type { ResolvedConfig } from "vite";
import { createLogger } from "@pagesmith/core";
import { pagesmithSsg, runBeforeBuildHook, type SsgBeforeBuildContext } from "./ssg-plugin.js";

function makeContext(overrides: Partial<SsgBeforeBuildContext> = {}): SsgBeforeBuildContext {
  return {
    rootDir: "/project",
    outDir: "/project/dist",
    config: {} as ResolvedConfig,
    logger: createLogger("silent"),
    ...overrides,
  };
}

describe("runBeforeBuildHook", () => {
  it("awaits the hook and passes the build context through", async () => {
    const seen: SsgBeforeBuildContext[] = [];
    const ctx = makeContext();
    await runBeforeBuildHook(async (received) => {
      seen.push(received);
    }, ctx);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(ctx);
    expect(seen[0]!.rootDir).toBe("/project");
    expect(seen[0]!.outDir).toBe("/project/dist");
  });

  it("wraps a thrown error with a clear, build-aborting message", async () => {
    await expect(
      runBeforeBuildHook(() => {
        throw new Error("content generation broke");
      }, makeContext()),
    ).rejects.toThrow(/pagesmithSsg beforeBuild hook failed: content generation broke/);
  });

  it("preserves the original error as the cause", async () => {
    const original = new Error("boom");
    const caught = (await runBeforeBuildHook(() => {
      throw original;
    }, makeContext()).catch((error: unknown) => error)) as Error;
    expect(caught.cause).toBe(original);
  });

  it("propagates rejected async hooks", async () => {
    await expect(
      runBeforeBuildHook(async () => {
        await Promise.reject(new Error("async fail"));
      }, makeContext()),
    ).rejects.toThrow(/async fail/);
  });
});

describe("pagesmithSsg", () => {
  it("returns dev and build plugins and accepts a beforeBuild hook", () => {
    const beforeBuild = vi.fn();
    const plugins = pagesmithSsg({ entry: "./src/entry-server.tsx", beforeBuild });
    expect(plugins).toHaveLength(2);
    expect(plugins.map((p) => p.name)).toEqual(["pagesmith:ssg-dev", "pagesmith:ssg-build"]);
    expect(beforeBuild).not.toHaveBeenCalled();
  });
});
