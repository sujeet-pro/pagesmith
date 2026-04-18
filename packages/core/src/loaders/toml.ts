/**
 * TOML loader.
 */

import { readFile } from "fs/promises";
import { parse } from "smol-toml";
import { LoaderError } from "./errors";
import type { Loader, LoaderResult } from "./types";

export class TomlLoader implements Loader {
  name = "toml";
  kind = "data" as const;
  extensions = [".toml"];

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, "utf-8");
    try {
      const data = parse(raw);
      return { data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new LoaderError(message, filePath, "TOML");
    }
  }
}
