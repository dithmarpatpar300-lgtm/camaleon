import type { WorkerRequest, WorkerResponse } from "./types";

type TransmutarFn = (input: Uint8Array) => Uint8Array;
type TransmutarJpgWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type TransmutarPngWithQuality = (input: Uint8Array, quality: number) => Uint8Array;
type TransmutarPngWithOptions = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number
) => Uint8Array;

let initJpgPromise: Promise<void> | null = null;
let transmutarJpg: TransmutarFn | null = null;
let transmutarJpgWithCompression: TransmutarJpgWithCompression | null = null;

let initPngPromise: Promise<void> | null = null;
let transmutarPng: TransmutarFn | null = null;
let transmutarPngWithQuality: TransmutarPngWithQuality | null = null;
let transmutarPngWithOptions: TransmutarPngWithOptions | null = null;

async function initJpgWasm(): Promise<void> {
  const module = await import(
    /* webpackIgnore: true */
    "/wasm/transmutador_jpg/transmutador_jpg.js"
  );
  await module.default();
  transmutarJpg = module.transmutar_jpg_a_png;
  transmutarJpgWithCompression = module.transmutar_jpg_a_png_with_compression;
}

async function initPngWasm(): Promise<void> {
  const module = await import(
    /* webpackIgnore: true */
    "/wasm/transmutador_png/transmutador_png.js"
  );
  await module.default();
  transmutarPng = module.transmutar_png_a_jpg;
  transmutarPngWithQuality = module.transmutar_png_a_jpg_with_quality;
  transmutarPngWithOptions = module.transmutar_png_a_jpg_with_options;
}

function ensureJpgWasmInitialized(): Promise<void> {
  if (!initJpgPromise) {
    initJpgPromise = initJpgWasm();
  }
  return initJpgPromise;
}

function ensurePngWasmInitialized(): Promise<void> {
  if (!initPngPromise) {
    initPngPromise = initPngWasm();
  }
  return initPngPromise;
}

async function handleRequest(req: WorkerRequest): Promise<WorkerResponse> {
  if (req.module !== "transmutador_jpg" && req.module !== "transmutador_png") {
    return {
      id: req.id,
      ok: false,
      error: `Unknown module: ${req.module}`,
    };
  }

  const isJpg = req.module === "transmutador_jpg";
  const initPromise = isJpg ? ensureJpgWasmInitialized() : ensurePngWasmInitialized();

  try {
    await initPromise;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Wasm initialization failed");
    return { id: req.id, ok: false, error: message };
  }

  const input = new Uint8Array(req.bytes);
  const opts = req.options;

  try {
    let result: Uint8Array;
    const mime = isJpg ? "image/png" : "image/jpeg";
    const extension = isJpg ? "png" : "jpg";

    if (isJpg) {
      if (opts?.compression != null && transmutarJpgWithCompression) {
        result = transmutarJpgWithCompression(input, opts.compression);
      } else if (transmutarJpg) {
        result = transmutarJpg(input);
      } else {
        return { id: req.id, ok: false, error: "Wasm module not initialized" };
      }
    } else {
      if (opts?.background != null && transmutarPngWithOptions) {
        const bg = opts.background;
        result = transmutarPngWithOptions(
          input,
          opts.quality ?? 85,
          bg.r,
          bg.g,
          bg.b
        );
      } else if (opts?.quality != null && transmutarPngWithQuality) {
        result = transmutarPngWithQuality(input, opts.quality);
      } else if (transmutarPng) {
        result = transmutarPng(input);
      } else {
        return { id: req.id, ok: false, error: "Wasm module not initialized" };
      }
    }

    const output = result.buffer.slice(
      result.byteOffset,
      result.byteOffset + result.byteLength
    ) as ArrayBuffer;

    return { id: req.id, ok: true, bytes: output, mime, extension };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown worker error");
    return { id: req.id, ok: false, error: message };
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const response = await handleRequest(e.data);
  if (response.ok) {
    self.postMessage(response, { transfer: [response.bytes] });
  } else {
    self.postMessage(response);
  }
};

Promise.all([ensureJpgWasmInitialized(), ensurePngWasmInitialized()]).catch((err) => {
  console.error("Worker: Wasm initialization failed", err);
});
