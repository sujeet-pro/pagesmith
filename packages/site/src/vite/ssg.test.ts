import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { prerenderRoutes } from "./ssg.js";

// prerenderRoutes loads a *built* SSR entry via dynamic import, so the test
// writes a real `.mjs` module exporting `render(url)` plus a client
// `index.html` template into a temp dir, then asserts every route was written.
let workDir: string;

function scaffold(): { outDir: string; serverEntry: string } {
  const outDir = join(workDir, "dist");
  const serverDir = join(outDir, ".server");
  const serverEntry = join(serverDir, "entry-server.mjs");
  mkdirSync(serverDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), "<html><body><!--ssr-outlet--></body></html>");
  writeFileSync(serverEntry, `export function render(url) { return '<main>' + url + '</main>'; }`);
  return { outDir, serverEntry };
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "pagesmith-ssg-"));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("prerenderRoutes", () => {
  it("writes an index.html per route (default bounded concurrency)", async () => {
    const routes = ["/", "/about", "/posts/hello"];
    const { outDir, serverEntry } = scaffold();

    const result = await prerenderRoutes({ outDir, serverEntry, routes, cleanup: false });

    expect(result.pages).toBe(3);
    expect(readFileSync(join(outDir, "index.html"), "utf-8")).toContain("<main>/</main>");
    expect(readFileSync(join(outDir, "about", "index.html"), "utf-8")).toContain(
      "<main>/about</main>",
    );
    expect(readFileSync(join(outDir, "posts", "hello", "index.html"), "utf-8")).toContain(
      "<main>/posts/hello</main>",
    );
  });

  it("produces identical output when forced serial (concurrency: 1)", async () => {
    const routes = ["/", "/a", "/b"];
    const { outDir, serverEntry } = scaffold();

    const result = await prerenderRoutes({
      outDir,
      serverEntry,
      routes,
      cleanup: false,
      concurrency: 1,
    });

    expect(result.pages).toBe(3);
    expect(readFileSync(join(outDir, "a", "index.html"), "utf-8")).toContain("<main>/a</main>");
    expect(readFileSync(join(outDir, "b", "index.html"), "utf-8")).toContain("<main>/b</main>");
  });

  it("throws when the SSR entry is missing", async () => {
    const { outDir } = scaffold();
    await expect(
      prerenderRoutes({ outDir, serverEntry: join(outDir, "nope.mjs"), routes: ["/"] }),
    ).rejects.toThrow(/SSR entry not found/);
  });
});
