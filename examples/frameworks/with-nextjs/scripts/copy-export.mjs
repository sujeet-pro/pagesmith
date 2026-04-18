import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { resolve } from "path";

const sourceDir = resolve(import.meta.dirname, "../out");
const targetDir = resolve(import.meta.dirname, "../../../../gh-pages/examples/nextjs");
const projectDir = resolve(import.meta.dirname, "..");
const llmsFiles = ["llms.txt", "llms-full.txt"];

if (!existsSync(sourceDir)) {
  throw new Error(`Next export output not found: ${sourceDir}`);
}

for (const fileName of llmsFiles) {
  const sourcePath = resolve(projectDir, fileName);
  const destPath = resolve(sourceDir, fileName);
  if (existsSync(sourcePath) && !existsSync(destPath)) {
    copyFileSync(sourcePath, destPath);
  }
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(resolve(targetDir, ".."), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
