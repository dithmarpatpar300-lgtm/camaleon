import type { WasmLoadHints } from "@/lib/device/device-capability";
import { isWasmCrateCached } from "@/lib/offline/cache-status";
import { readForceOffline } from "@/lib/offline/force-offline";

/** Crate folder names under `public/wasm/`. */
export type WasmCrate =
  | "transmutador_jpg"
  | "transmutador_png"
  | "transmutador_webp"
  | "transmutador_encode"
  | "transmutador_gif"
  | "transmutador_bmp"
  | "transmutador_tiff"
  | "transmutador_ico"
  | "transmutador_tga"
  | "transmutador_avif"
  | "transmutador_avif_encode"
  | "transmutador_svg"
  | "transmutador_optimize";

export type WasmGlueModule = {
  default: (input?: ArrayBuffer | WebAssembly.Module | Response) => Promise<void>;
} & Record<string, unknown>;

/** Read an export from a Wasm glue module (untyped wasm-bindgen boundary). */
export function wasmExport<T>(module: WasmGlueModule, name: string): T {
  return module[name] as T;
}

/**
 * Runtime dynamic import for `/wasm/*` glue JS (static assets).
 *
 * Specifier must stay non-literal so OpenNext/esbuild does not try to resolve
 * these paths when bundling the Cloudflare worker (`webpackIgnore` is webpack-only).
 */
export async function importWasmGlue(crate: WasmCrate): Promise<WasmGlueModule> {
  if (readForceOffline()) {
    const cached = await isWasmCrateCached(crate);
    if (!cached) {
      throw new Error("SIMULATED_OFFLINE: conversion engine not cached");
    }
  }

  const parts = ["/wasm/", crate, "/", crate, ".js"] as const;
  const spec: string = parts.join("");
  return import(/* webpackIgnore: true */ spec) as Promise<WasmGlueModule>;
}

/**
 * Initialize a Wasm glue module with strategy-aware loading.
 *
 * Streaming path: calls `module.default()` (original behavior, fetch + instantiateStreaming).
 * Buffered path: pre-fetches the `.wasm` file into a complete ArrayBuffer and passes it to
 * `module.default(buffer)` — avoids `instantiateStreaming` corruption under memory pressure.
 * Retry path: on `wasm validation error`, retries with cache-bust URL.
 */
export async function initWasmModule(
  module: WasmGlueModule,
  crate: WasmCrate,
  hints?: WasmLoadHints
): Promise<void> {
  if (!hints || hints.strategy === "streaming") {
    await module.default();
    return;
  }

  const wasmUrl = `/wasm/${crate}/${crate}_bg.wasm`;
  const maxRetries = hints.strategy === "buffered-with-retry" ? hints.retries : 0;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = attempt > 0 ? `${wasmUrl}?retry=${attempt}` : wasmUrl;
      const response = await fetch(url, { cache: attempt > 0 ? "reload" : undefined });
      if (!response.ok) {
        throw new Error(`WASM fetch failed: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength === 0) {
        throw new Error("WASM buffer is empty");
      }
      await module.default(buffer);
      return;
    } catch (err) {
      lastError = err;
      const msg =
        typeof err === "string" ? err : err instanceof Error ? err.message : String(err ?? "unknown");
      if (attempt < maxRetries && (msg.includes("validation error") || msg.includes("bad type"))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
