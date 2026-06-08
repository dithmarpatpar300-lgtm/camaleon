/**
 * Ensures Wasm glue + binaries from public/wasm are present in OpenNext assets
 * before Wrangler uploads. Without this, Cloudflare deploys can miss /wasm/* (404).
 */
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dest = join(root, ".open-next", "assets", "wasm");

const candidates = [
  join(root, "public", "wasm"),
  join(root, "..", "motor_transmutacion", "public", "wasm"),
];

const src = candidates.find((dir) =>
  existsSync(join(dir, "transmutador_jpg", "transmutador_jpg.js"))
);

if (!src) {
  console.error(
    "sync-wasm-assets: missing wasm output — run `npm run build:wasm` before build:cf"
  );
  console.error("  checked:", candidates.join(", "));
  process.exit(1);
}

if (src !== candidates[0]) {
  console.warn(
    "sync-wasm-assets: using legacy path motor_transmutacion/public/wasm — update build:wasm"
  );
}

cpSync(src, dest, { recursive: true });

const destSentinel = join(dest, "transmutador_jpg", "transmutador_jpg.js");
if (!existsSync(destSentinel)) {
  console.error("sync-wasm-assets: copy failed");
  process.exit(1);
}

console.log("sync-wasm-assets: copied public/wasm → .open-next/assets/wasm");
