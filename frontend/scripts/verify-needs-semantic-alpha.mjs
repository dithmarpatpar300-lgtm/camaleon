/**
 * Verifies lossy tools with background option opt into Semantic Alpha Engine.
 * Run: node scripts/verify-needs-semantic-alpha.mjs (from frontend/)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const registryPath = join(root, "../src/lib/tools/tool-registry.ts");
const needsPath = join(root, "../src/lib/semantic-alpha/needs-semantic-alpha.ts");

const registrySrc = readFileSync(registryPath, "utf8");
const needsSrc = readFileSync(needsPath, "utf8");

const lossyWithBackground = [
  "png-to-jpg",
  "webp-to-jpg",
  "gif-to-jpg",
  "bmp-to-jpg",
  "tiff-to-jpg",
];

for (const id of lossyWithBackground) {
  if (!registrySrc.includes(`id: "${id}"`)) {
    console.error(`missing tool in registry: ${id}`);
    process.exit(1);
  }
  if (!registrySrc.includes(`key: "background"`)) {
    console.error("registry missing background option spec");
    process.exit(1);
  }
}

if (!needsSrc.includes('key === "background"')) {
  console.error("needsSemanticAlpha must key off background option");
  process.exit(1);
}

console.log("verify-needs-semantic-alpha: ok (" + lossyWithBackground.length + " tools)");
