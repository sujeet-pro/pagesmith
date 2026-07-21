import { describe, expect, it } from "vite-plus/test";
import {
  checkMigratingCoversVersion,
  findTopMigratingVersion,
} from "../../scripts/migrating-version-gate.ts";

describe("migrating-version-gate", () => {
  describe("findTopMigratingVersion", () => {
    it("finds the first ## X.Y.Z heading", () => {
      const content = "# Title\n\nSome intro.\n\n## 0.11.0 (next)\n\nStuff.\n\n## 0.10.0 (minor)\n";
      expect(findTopMigratingVersion(content)).toBe("0.11.0");
    });

    it("ignores non-version ## headings before the first version heading", () => {
      const content = "# Title\n\n## High-impact changes\n\n## 0.9.7 (patch)\n";
      expect(findTopMigratingVersion(content)).toBe("0.9.7");
    });

    it("returns null when no version heading exists", () => {
      const content = "# Title\n\n## High-impact changes\n\nNo versions here.\n";
      expect(findTopMigratingVersion(content)).toBeNull();
    });
  });

  describe("checkMigratingCoversVersion", () => {
    it("passes when the top heading equals the package version", () => {
      const result = checkMigratingCoversVersion("## 0.10.0 (minor)\n", "0.10.0");
      expect(result.ok).toBe(true);
      expect(result.headingVersion).toBe("0.10.0");
    });

    it("passes when the top heading is ahead of the package version (a '(next)' section)", () => {
      const result = checkMigratingCoversVersion("## 0.11.0 (next)\n", "0.10.0");
      expect(result.ok).toBe(true);
      expect(result.headingVersion).toBe("0.11.0");
    });

    it("fails when the top heading is behind the package version", () => {
      // Reproduces the exact bug this gate exists to catch: the package was
      // bumped to 0.10.0 but MIGRATING.md's top heading still said 0.9.9.
      const result = checkMigratingCoversVersion("## 0.9.9 (next)\n", "0.10.0");
      expect(result.ok).toBe(false);
      expect(result.headingVersion).toBe("0.9.9");
      expect(result.message).toContain("behind the package version");
    });

    it("fails when MIGRATING.md has no version heading at all", () => {
      const result = checkMigratingCoversVersion("# Title\n\nNo headings.\n", "0.10.0");
      expect(result.ok).toBe(false);
      expect(result.headingVersion).toBeNull();
    });

    it("compares numerically, not lexically (0.10.0 > 0.9.9)", () => {
      const result = checkMigratingCoversVersion("## 0.9.9 (patch)\n", "0.10.0");
      expect(result.ok).toBe(false);
    });
  });
});
