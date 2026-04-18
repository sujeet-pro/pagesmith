#!/usr/bin/env -S node --strip-types --no-warnings

import { existsSync, readFileSync, statSync } from "fs";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { extname, join, resolve } from "path";

const outDir: string = join(process.cwd(), "gh-pages");
const repoPrefix: string = "/pagesmith";
const rawPort: number = parseInt(process.env.PORT || "3000", 10);
const port: number = Math.min(Math.max(Number.isNaN(rawPort) ? 3000 : rawPort, 1024), 65535);

if (!existsSync(outDir)) {
  console.error("gh-pages/ not found. Run `vp run build` first.");
  process.exit(1);
}

const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  let url: string = (req.url || "/").split("?")[0];

  if (url === repoPrefix) {
    url = "/";
  } else if (url.startsWith(`${repoPrefix}/`)) {
    url = url.slice(repoPrefix.length);
  }

  let filePath: string = join(outDir, url);
  if (!resolve(filePath).startsWith(resolve(outDir))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // GitHub Pages-compatible resolution: path.html first, then path/index.html
  if (!extname(filePath)) {
    const flatHtml = `${filePath}.html`;
    const dirIndex = join(filePath, "index.html");
    if (existsSync(flatHtml)) {
      filePath = flatHtml;
    } else if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = dirIndex;
    }
  }

  if (!existsSync(filePath)) {
    const notFoundPage = join(outDir, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(existsSync(notFoundPage) ? readFileSync(notFoundPage) : "<h1>404 - Not Found</h1>");
    return;
  }

  const ext: string = extname(filePath);
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  res.end(readFileSync(filePath));
});

server.listen(port, () => {
  const base: string = `http://localhost:${port}${repoPrefix}`;
  console.info(`\nPreview: ${base}/\n`);
  console.info(`  Docs:     ${base}/`);
  console.info(`  Examples: ${base}/examples/\n`);
});
