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
type EstimateJpgSizeFn = (input: Uint8Array, compression: number) => number;
type EstimatePngSizeFn = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number
) => number;

let initJpgPromise: Promise<void> | null = null;
let transmutarJpg: TransmutarFn | null = null;
let transmutarJpgWithCompression: TransmutarJpgWithCompression | null = null;
let estimateJpgToPngSize: EstimateJpgSizeFn | null = null;

let initPngPromise: Promise<void> | null = null;
let transmutarPng: TransmutarFn | null = null;
let transmutarPngWithQuality: TransmutarPngWithQuality | null = null;
let transmutarPngWithOptions: TransmutarPngWithOptions | null = null;
let estimatePngToJpgSize: EstimatePngSizeFn | null = null;

let pendingEstimateId: string | null = null;
let pipeline: Promise<void> = Promise.resolve();

async function initJpgWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_jpg/transmutador_jpg.js");
  await module.default();
  transmutarJpg = module.transmutar_jpg_a_png;
  transmutarJpgWithCompression = module.transmutar_jpg_a_png_with_compression;
  estimateJpgToPngSize = module.estimate_jpg_to_png_size;
}

async function initPngWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_png/transmutador_png.js");
  await module.default();
  transmutarPng = module.transmutar_png_a_jpg;
  transmutarPngWithQuality = module.transmutar_png_a_jpg_with_quality;
  transmutarPngWithOptions = module.transmutar_png_a_jpg_with_options;
  estimatePngToJpgSize = module.estimate_png_to_jpg_size;
}

function ensureJpgWasmInitialized(): Promise<void> {
  if (!initJpgPromise) initJpgPromise = initJpgWasm();
  return initJpgPromise;
}

function ensurePngWasmInitialized(): Promise<void> {
  if (!initPngPromise) initPngPromise = initPngWasm();
  return initPngPromise;
}

function postResponse(response: WorkerResponse): void {
  if (response.ok && response.bytes) {
    self.postMessage(response, { transfer: [response.bytes] });
  } else {
    self.postMessage(response);
  }
}

function supersedeEstimate(id: string): void {
  postResponse({ id, ok: false, error: "superseded" });
}

async function handleRequest(req: WorkerRequest): Promise<WorkerResponse> {
  if (req.module !== "transmutador_jpg" && req.module !== "transmutador_png") {
    return { id: req.id, ok: false, error: `Unknown module: ${req.module}` };
  }

  const isEstimate = req.purpose === "estimate";
  const isJpg = req.module === "transmutador_jpg";
  const initPromise = isJpg ? ensureJpgWasmInitialized() : ensurePngWasmInitialized();

  try {
    await initPromise;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "Wasm initialization failed");
    return { id: req.id, ok: false, error: message };
  }

  const input = new Uint8Array(req.bytes);
  const opts = req.options;

  try {
    const mime = isJpg ? "image/png" : "image/jpeg";
    const extension = isJpg ? "png" : "jpg";

    if (isEstimate) {
      let outputSize: number;
      if (isJpg) {
        const compression = opts?.compression ?? 6;
        if (!estimateJpgToPngSize) {
          return { id: req.id, ok: false, error: "Wasm estimate export not initialized" };
        }
        outputSize = estimateJpgToPngSize(input, compression);
      } else {
        const quality = opts?.quality ?? 85;
        const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
        if (!estimatePngToJpgSize) {
          return { id: req.id, ok: false, error: "Wasm estimate export not initialized" };
        }
        outputSize = estimatePngToJpgSize(input, quality, bg.r, bg.g, bg.b);
      }
      return { id: req.id, ok: true, purpose: "estimate", outputSize };
    }

    let result: Uint8Array;
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
        result = transmutarPngWithOptions(input, opts.quality ?? 85, bg.r, bg.g, bg.b);
      } else if (opts?.quality != null && transmutarPngWithQuality) {
        result = transmutarPngWithQuality(input, opts.quality);
      } else if (transmutarPng) {
        result = transmutarPng(input);
      } else {
        return { id: req.id, ok: false, error: "Wasm module not initialized" };
      }
    }

    const outputSize = result.byteLength;
    const output = result.buffer.slice(result.byteOffset, result.byteOffset + outputSize) as ArrayBuffer;
    return { id: req.id, ok: true, purpose: "transmute", outputSize, bytes: output, mime, extension };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "Unknown worker error");
    return { id: req.id, ok: false, error: message };
  }
}

async function dispatch(req: WorkerRequest): Promise<void> {
  const isEstimate = req.purpose === "estimate";
  const isTransmute = req.purpose === "transmute" || req.purpose == null;

  if (isEstimate) {
    if (pendingEstimateId && pendingEstimateId !== req.id) {
      supersedeEstimate(pendingEstimateId);
    }
    pendingEstimateId = req.id;
  }

  if (isTransmute && pendingEstimateId) {
    supersedeEstimate(pendingEstimateId);
    pendingEstimateId = null;
  }

  const response = await handleRequest(req);

  if (isEstimate) {
    if (pendingEstimateId !== req.id) {
      return;
    }
    pendingEstimateId = null;
  }

  postResponse(response);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  pipeline = pipeline.then(() => dispatch(req));
};

Promise.all([ensureJpgWasmInitialized(), ensurePngWasmInitialized()]).catch((err) => {
  console.error("Worker: Wasm initialization failed", err);
});
