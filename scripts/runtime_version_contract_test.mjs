import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PRODUCT_VERSION } from "../server/content-runtime.mjs";

const pubspec = await readFile(new URL("../flutter_app/pubspec.yaml", import.meta.url), "utf8");
const pubspecVersion = pubspec.match(/^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\+(\d+)\s*$/m);
assert.ok(pubspecVersion, "Flutter pubspec must contain semantic version+build");
assert.equal(pubspecVersion[1], PRODUCT_VERSION, "Runtime PRODUCT_VERSION must match Flutter product version");

const smoke = await readFile(new URL("./remote_runtime_v1_smoke.mjs", import.meta.url), "utf8");
assert.match(smoke, /import\s*\{\s*PRODUCT_VERSION\s*\}/, "remote Runtime smoke must consume PRODUCT_VERSION from source");
assert.match(smoke, /data\?\.version\s*===\s*PRODUCT_VERSION/, "remote Runtime smoke must compare deployed version with PRODUCT_VERSION");
assert.doesNotMatch(smoke, /version\s*===\s*["']1\.0\.1["']/, "remote Runtime smoke must not hard-code the historic 1.0.1 product version");

const matchProduction = await readFile(new URL("../server/match-production.mjs", import.meta.url), "utf8");
assert.match(matchProduction, /import\s*\{[^}]*PRODUCT_VERSION[^}]*\}\s*from\s*["']\.\/content-runtime\.mjs["']/, "production Match Runtime must consume shared PRODUCT_VERSION");
assert.doesNotMatch(matchProduction, /version:\s*["']\d+\.\d+\.\d+["']/, "production Match Runtime must not hard-code product versions");
assert.match(matchProduction, /cached:\s*false[\s\S]*stale:\s*false/, "production Match Runtime must expose explicit cache/stale state");

console.log("runtime version contract: ok", { version: PRODUCT_VERSION, build: pubspecVersion[2] });
