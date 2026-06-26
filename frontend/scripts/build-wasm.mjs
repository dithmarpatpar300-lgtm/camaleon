/**
 * Cross-platform Wasm build — always outputs to frontend/public/wasm/.
 * wasm-pack resolves --out-dir relative to the crate when using npm's
 * relative paths; this script uses absolute paths (same as scripts/build-wasm.sh).
 *
 * After building all crates, generates wasm-manifest.json with a buildId
 * (hash of per-crate file sizes) consumed by the Wasm Sync Engine at runtime.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(frontendRoot, "..");
const wasmOutBase = join(frontendRoot, "public", "wasm");

const crates = [
  "transmutador_jpg",
  "transmutador_png",
  "transmutador_webp",
  "transmutador_encode",
  "transmutador_gif",
  "transmutador_bmp",
  "transmutador_tiff",
  "transmutador_ico",
  "transmutador_tga",
  "transmutador_avif",
  "transmutador_avif_encode",
  "transmutador_svg",
  "transmutador_optimize",
];

for (const crate of crates) {
  const cratePath = join(repoRoot, "motor_transmutacion", crate);
  const outDir = join(wasmOutBase, crate);
  const noDefaultFeatures =
    crate === "transmutador_svg" ? " --no-default-features" : "";

  console.log(`build-wasm: ${crate} → ${outDir}`);
  execSync(
    `wasm-pack build --target web --out-dir "${outDir}" --out-name ${crate}${noDefaultFeatures}`,
    {
      cwd: cratePath,
      stdio: "inherit",
      env: {
        ...process.env,
        RUSTFLAGS: "-C target-feature=+simd128,+bulk-memory",
      },
    }
  );
}

const sentinel = join(wasmOutBase, "transmutador_jpg", "transmutador_jpg.js");
if (!existsSync(sentinel)) {
  console.error("build-wasm: expected output missing at frontend/public/wasm/");
  process.exit(1);
}

// --- Generate wasm-manifest.json ---
function readEngineVersion() {
  const cargoToml = readFileSync(join(repoRoot, "motor_transmutacion", "Cargo.toml"), "utf-8");
  const match = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
  return match ? match[1] : "0.0.0";
}

function fileSize(path) {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

const engineVersion = readEngineVersion();
const hash = createHash("sha256");
const crateEntries = {};
let totalWasmSize = 0;

for (const crate of crates) {
  const jsPath = join(wasmOutBase, crate, `${crate}.js`);
  const wasmPath = join(wasmOutBase, crate, `${crate}_bg.wasm`);
  const jsSize = fileSize(jsPath);
  const wasmSize = fileSize(wasmPath);
  crateEntries[crate] = { jsSize, wasmSize };
  totalWasmSize += jsSize + wasmSize;
  hash.update(`${crate}:${wasmSize}:${jsSize};`);
}

const buildId = hash.digest("hex").slice(0, 8);
const manifest = {
  version: engineVersion,
  buildId,
  generatedAt: new Date().toISOString(),
  totalWasmSize,
  crates: crateEntries,
};

const manifestPath = join(wasmOutBase, "wasm-manifest.json");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
console.log(`build-wasm: manifest written → ${manifestPath} (buildId: ${buildId}, ${crates.length} crates, ${(totalWasmSize / 1024 / 1024).toFixed(1)} MB)`);
console.log("build-wasm: all modules ready in frontend/public/wasm/");
