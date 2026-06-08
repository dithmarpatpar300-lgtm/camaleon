/**
 * Ensures Wasm glue + binaries from public/wasm are present in OpenNext assets
 * before Wrangler uploads. Without this, Cloudflare deploys can miss /wasm/* (404).
 */
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "public", "wasm");
const dest = join(root, ".open-next", "assets", "wasm");
const sentinel = join(src, "transmutador_jpg", "transmutador_jpg.js");

if (!existsSync(sentinel)) {
  console.error(
    "sync-wasm-assets: missing public/wasm — run `npm run build:wasm` before build:cf"
  );
  process.exit(1);
}

cpSync(src, dest, { recursive: true });

const destSentinel = join(dest, "transmutador_jpg", "transmutador_jpg.js");
if (!existsSync(destSentinel)) {
  console.error("sync-wasm-assets: copy failed");
  process.exit(1);
}

console.log("sync-wasm-assets: copied public/wasm → .open-next/assets/wasm");
