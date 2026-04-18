#!/usr/bin/env -S node --strip-types --no-warnings

type BumpType = "major" | "minor" | "patch";

const SEMVER_PATTERN =
  /^v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<suffix>(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/;

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function parseVersion(rawVersion: string): {
  major: number;
  minor: number;
  patch: number;
  suffix: string;
  normalized: string;
} {
  const match = rawVersion.trim().match(SEMVER_PATTERN);
  if (!match?.groups) {
    throw new Error(`Invalid semver version: ${rawVersion}`);
  }

  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch),
    suffix: match.groups.suffix ?? "",
    normalized: `${match.groups.major}.${match.groups.minor}.${match.groups.patch}${match.groups.suffix ?? ""}`,
  };
}

function bumpVersion(currentVersion: string, bumpType: BumpType): string {
  const parsed = parseVersion(currentVersion);

  switch (bumpType) {
    case "major":
      return `${parsed.major + 1}.0.0`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

function main(): void {
  const exactVersion = readFlag("--version");
  if (exactVersion) {
    process.stdout.write(`${parseVersion(exactVersion).normalized}\n`);
    return;
  }

  const currentVersion = readFlag("--current");
  const bumpType = readFlag("--bump") as BumpType | undefined;

  if (!currentVersion || !bumpType) {
    throw new Error(
      "Usage: resolve-release-version --current <version> --bump <major|minor|patch>\n" +
        "   or: resolve-release-version --version <exact-version>",
    );
  }

  if (!["major", "minor", "patch"].includes(bumpType)) {
    throw new Error(`Invalid bump type: ${bumpType}`);
  }

  process.stdout.write(`${bumpVersion(currentVersion, bumpType)}\n`);
}

main();
