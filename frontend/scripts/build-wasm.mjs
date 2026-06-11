/**
 * Cross-platform Wasm build — always outputs to frontend/public/wasm/.
 * wasm-pack resolves --out-dir relative to the crate when using npm's
 * relative paths; this script uses absolute paths (same as scripts/build-wasm.sh).
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
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
];

for (const crate of crates) {
  const cratePath = join(repoRoot, "motor_transmutacion", crate);
  const outDir = join(wasmOutBase, crate);

  console.log(`build-wasm: ${crate} → ${outDir}`);
  execSync(
    `wasm-pack build --target web --out-dir "${outDir}" --out-name ${crate}`,
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

console.log("build-wasm: all modules ready in frontend/public/wasm/");
