import type { TransmutationModule } from "@/workers/types";
import type { WasmCrate } from "@/lib/wasm/load-glue";

/** All Wasm transmutator crates — keep in sync with `scripts/build-wasm.mjs`. */
export const WASM_CRATES = [
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
] as const satisfies readonly WasmCrate[];

export type WasmCrateName = (typeof WASM_CRATES)[number];

export function wasmGlueUrl(crate: WasmCrateName | TransmutationModule): string {
  return `/wasm/${crate}/${crate}.js`;
}

export function wasmBinaryUrl(crate: WasmCrateName | TransmutationModule): string {
  return `/wasm/${crate}/${crate}_bg.wasm`;
}

export function wasmAssetUrls(crate: WasmCrateName | TransmutationModule): string[] {
  return [wasmGlueUrl(crate), wasmBinaryUrl(crate)];
}
