import { resolve } from "path";

const basePath = process.env.PAGESMITH_NEXT_BASE_PATH || "";
const repoRoot = resolve(import.meta.dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  assetPrefix: basePath || undefined,
  basePath,
  outputFileTracingRoot: repoRoot,
  reactStrictMode: true,
  serverExternalPackages: ["@pagesmith/core", "@pagesmith/site"],
  trailingSlash: true,
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
