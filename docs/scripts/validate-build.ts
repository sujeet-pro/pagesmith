#!/usr/bin/env -S node --strip-types --no-warnings

import { runBuildValidation } from "@pagesmith/site/build-validator";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const outDir = resolve(ROOT, "gh-pages");
const basePath = "/pagesmith";
const trailingSlash = false;

const exitCode = runBuildValidation({ outDir, basePath, trailingSlash, exclude: ["examples"] });
process.exit(exitCode);
