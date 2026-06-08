/** Crate folder names under `public/wasm/`. */
export type WasmCrate =
  | "transmutador_jpg"
  | "transmutador_png"
  | "transmutador_webp"
  | "transmutador_encode"
  | "transmutador_gif"
  | "transmutador_bmp"
  | "transmutador_tiff";

export type WasmGlueModule = {
  default: () => Promise<void>;
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
  const parts = ["/wasm/", crate, "/", crate, ".js"] as const;
  const spec: string = parts.join("");
  return import(/* webpackIgnore: true */ spec) as Promise<WasmGlueModule>;
}
