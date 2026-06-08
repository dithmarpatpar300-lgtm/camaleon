import type { EncodeSource, OutputExtension, WorkerRequest, WorkerResponse } from "./types";
import { ResultCache } from "./result-cache";

type TransmutarFn = (input: Uint8Array) => Uint8Array;
type TransmutarJpgWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type TransmutarPngWithQuality = (input: Uint8Array, quality: number) => Uint8Array;
type TransmutarPngWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateJpgSizeFn = (input: Uint8Array, compression: number) => number;
type EstimatePngSizeFn = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => number;
type TransmutarWebpWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type EstimateWebpSizeFn = (input: Uint8Array, compression: number) => number;
type TransmutarWebpJpgWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateWebpToJpgSizeFn = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => number;
type EstimatePngToWebpSizeFn = (input: Uint8Array) => number;
type TransmutarGifWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type EstimateGifToPngSizeFn = (input: Uint8Array, compression: number) => number;
type TransmutarGifJpgWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateGifToJpgSizeFn = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => number;
type TransmutarBmpWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type EstimateBmpToPngSizeFn = (input: Uint8Array, compression: number) => number;
type TransmutarBmpJpgWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateBmpToJpgSizeFn = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => number;

let initJpgPromise: Promise<void> | null = null;
let transmutarJpg: TransmutarFn | null = null;
let transmutarJpgWithCompression: TransmutarJpgWithCompression | null = null;
let estimateJpgToPngSize: EstimateJpgSizeFn | null = null;

let initPngPromise: Promise<void> | null = null;
let transmutarPng: TransmutarFn | null = null;
let transmutarPngWithQuality: TransmutarPngWithQuality | null = null;
let transmutarPngWithOptions: TransmutarPngWithOptions | null = null;
let estimatePngToJpgSize: EstimatePngSizeFn | null = null;

let initWebpPromise: Promise<void> | null = null;
let transmutarWebp: TransmutarFn | null = null;
let transmutarWebpWithCompression: TransmutarWebpWithCompression | null = null;
let estimateWebpToPngSize: EstimateWebpSizeFn | null = null;
let transmutarWebpJpgWithOptions: TransmutarWebpJpgWithOptions | null = null;
let estimateWebpToJpgSize: EstimateWebpToJpgSizeFn | null = null;

let initEncodePromise: Promise<void> | null = null;
let transmutarPngToWebp: TransmutarFn | null = null;
let estimatePngToWebpSize: EstimatePngToWebpSizeFn | null = null;
let transmutarJpgToWebp: TransmutarFn | null = null;
let estimateJpgToWebpSize: EstimatePngToWebpSizeFn | null = null;

let initGifPromise: Promise<void> | null = null;
let transmutarGif: TransmutarFn | null = null;
let transmutarGifWithCompression: TransmutarGifWithCompression | null = null;
let estimateGifToPngSize: EstimateGifToPngSizeFn | null = null;
let transmutarGifJpgWithOptions: TransmutarGifJpgWithOptions | null = null;
let estimateGifToJpgSize: EstimateGifToJpgSizeFn | null = null;

let initBmpPromise: Promise<void> | null = null;
let transmutarBmp: TransmutarFn | null = null;
let transmutarBmpWithCompression: TransmutarBmpWithCompression | null = null;
let estimateBmpToPngSize: EstimateBmpToPngSizeFn | null = null;
let transmutarBmpJpgWithOptions: TransmutarBmpJpgWithOptions | null = null;
let estimateBmpToJpgSize: EstimateBmpToJpgSizeFn | null = null;

let pendingEstimateId: string | null = null;
let pipeline: Promise<void> = Promise.resolve();

const resultCache = new ResultCache();

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

async function initWebpWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_webp/transmutador_webp.js");
  await module.default();
  transmutarWebp = module.transmutar_webp_a_png;
  transmutarWebpWithCompression = module.transmutar_webp_a_png_with_compression;
  estimateWebpToPngSize = module.estimate_webp_to_png_size;
  transmutarWebpJpgWithOptions = module.transmutar_webp_a_jpg_with_options;
  estimateWebpToJpgSize = module.estimate_webp_to_jpg_size;
}

function ensureJpgWasmInitialized(): Promise<void> {
  if (!initJpgPromise) initJpgPromise = initJpgWasm();
  return initJpgPromise;
}

function ensurePngWasmInitialized(): Promise<void> {
  if (!initPngPromise) initPngPromise = initPngWasm();
  return initPngPromise;
}

function ensureWebpWasmInitialized(): Promise<void> {
  if (!initWebpPromise) initWebpPromise = initWebpWasm();
  return initWebpPromise;
}

async function initEncodeWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_encode/transmutador_encode.js");
  await module.default();
  transmutarPngToWebp = module.transmutar_png_a_webp;
  estimatePngToWebpSize = module.estimate_png_to_webp_size;
  transmutarJpgToWebp = module.transmutar_jpg_a_webp;
  estimateJpgToWebpSize = module.estimate_jpg_to_webp_size;
}

function ensureEncodeWasmInitialized(): Promise<void> {
  if (!initEncodePromise) initEncodePromise = initEncodeWasm();
  return initEncodePromise;
}

async function initGifWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_gif/transmutador_gif.js");
  await module.default();
  transmutarGif = module.transmutar_gif_a_png;
  transmutarGifWithCompression = module.transmutar_gif_a_png_with_compression;
  estimateGifToPngSize = module.estimate_gif_to_png_size;
  transmutarGifJpgWithOptions = module.transmutar_gif_a_jpg_with_options;
  estimateGifToJpgSize = module.estimate_gif_to_jpg_size;
}

function ensureGifWasmInitialized(): Promise<void> {
  if (!initGifPromise) initGifPromise = initGifWasm();
  return initGifPromise;
}

async function initBmpWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_bmp/transmutador_bmp.js");
  await module.default();
  transmutarBmp = module.transmutar_bmp_a_png;
  transmutarBmpWithCompression = module.transmutar_bmp_a_png_with_compression;
  estimateBmpToPngSize = module.estimate_bmp_to_png_size;
  transmutarBmpJpgWithOptions = module.transmutar_bmp_a_jpg_with_options;
  estimateBmpToJpgSize = module.estimate_bmp_to_jpg_size;
}

function ensureBmpWasmInitialized(): Promise<void> {
  if (!initBmpPromise) initBmpPromise = initBmpWasm();
  return initBmpPromise;
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

type RouteFlags = {
  isJpg: boolean;
  isPng: boolean;
  isWebpToPng: boolean;
  isWebpToJpg: boolean;
  isGifToPng: boolean;
  isGifToJpg: boolean;
  isBmpToPng: boolean;
  isBmpToJpg: boolean;
  isEncode: boolean;
  encodeSource?: EncodeSource;
};

function resolveRoute(req: WorkerRequest): RouteFlags {
  const isJpg = req.module === "transmutador_jpg";
  const isPng = req.module === "transmutador_png";
  const isEncode = req.module === "transmutador_encode";
  const isWebpToPng =
    req.module === "transmutador_webp" && (req.outputExtension ?? "png") === "png";
  const isWebpToJpg =
    req.module === "transmutador_webp" && req.outputExtension === "jpg";
  const isGifToPng =
    req.module === "transmutador_gif" && (req.outputExtension ?? "png") === "png";
  const isGifToJpg =
    req.module === "transmutador_gif" && req.outputExtension === "jpg";
  const isBmpToPng =
    req.module === "transmutador_bmp" && (req.outputExtension ?? "png") === "png";
  const isBmpToJpg =
    req.module === "transmutador_bmp" && req.outputExtension === "jpg";
  return {
    isJpg,
    isPng,
    isWebpToPng,
    isWebpToJpg,
    isGifToPng,
    isGifToJpg,
    isBmpToPng,
    isBmpToJpg,
    isEncode,
    encodeSource: isEncode ? req.encodeSource : undefined,
  };
}

function resolveMimeExtension(route: RouteFlags): { mime: string; extension: OutputExtension } {
  if (route.isEncode) {
    return { mime: "image/webp", extension: "webp" };
  }
  if (
    route.isWebpToJpg ||
    route.isPng ||
    route.isGifToJpg ||
    route.isBmpToJpg
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  return { mime: "image/png", extension: "png" };
}

function runFullEncode(
  route: RouteFlags,
  input: Uint8Array,
  opts: WorkerRequest["options"]
): Uint8Array {
  if (route.isEncode) {
    if (!route.encodeSource) {
      throw new Error("encodeSource is required for transmutador_encode");
    }
    if (route.encodeSource === "jpeg") {
      if (!transmutarJpgToWebp) throw new Error("Wasm module not initialized");
      return transmutarJpgToWebp(input);
    }
    if (!transmutarPngToWebp) throw new Error("Wasm module not initialized");
    return transmutarPngToWebp(input);
  }
  if (route.isWebpToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!transmutarWebpJpgWithOptions) throw new Error("Wasm module not initialized");
    return transmutarWebpJpgWithOptions(input, quality, bg.r, bg.g, bg.b);
  }
  if (route.isWebpToPng) {
    if (opts?.compression != null && transmutarWebpWithCompression) {
      return transmutarWebpWithCompression(input, opts.compression);
    }
    if (transmutarWebp) return transmutarWebp(input);
    throw new Error("Wasm module not initialized");
  }
  if (route.isGifToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!transmutarGifJpgWithOptions) throw new Error("Wasm module not initialized");
    return transmutarGifJpgWithOptions(input, quality, bg.r, bg.g, bg.b);
  }
  if (route.isGifToPng) {
    if (opts?.compression != null && transmutarGifWithCompression) {
      return transmutarGifWithCompression(input, opts.compression);
    }
    if (transmutarGif) return transmutarGif(input);
    throw new Error("Wasm module not initialized");
  }
  if (route.isBmpToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!transmutarBmpJpgWithOptions) throw new Error("Wasm module not initialized");
    return transmutarBmpJpgWithOptions(input, quality, bg.r, bg.g, bg.b);
  }
  if (route.isBmpToPng) {
    if (opts?.compression != null && transmutarBmpWithCompression) {
      return transmutarBmpWithCompression(input, opts.compression);
    }
    if (transmutarBmp) return transmutarBmp(input);
    throw new Error("Wasm module not initialized");
  }
  if (route.isJpg) {
    if (opts?.compression != null && transmutarJpgWithCompression) {
      return transmutarJpgWithCompression(input, opts.compression);
    }
    if (transmutarJpg) return transmutarJpg(input);
    throw new Error("Wasm module not initialized");
  }

  if (opts?.background != null && transmutarPngWithOptions) {
    const bg = opts.background;
    return transmutarPngWithOptions(input, opts.quality ?? 85, bg.r, bg.g, bg.b);
  }
  if (opts?.quality != null && transmutarPngWithQuality) {
    return transmutarPngWithQuality(input, opts.quality);
  }
  if (transmutarPng) return transmutarPng(input);
  throw new Error("Wasm module not initialized");
}

function runSizeEstimate(
  route: RouteFlags,
  input: Uint8Array,
  opts: WorkerRequest["options"]
): number {
  if (route.isEncode) {
    if (!route.encodeSource) {
      throw new Error("encodeSource is required for transmutador_encode");
    }
    if (route.encodeSource === "jpeg") {
      if (!estimateJpgToWebpSize) throw new Error("Wasm estimate export not initialized");
      return estimateJpgToWebpSize(input);
    }
    if (!estimatePngToWebpSize) throw new Error("Wasm estimate export not initialized");
    return estimatePngToWebpSize(input);
  }
  if (route.isWebpToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!estimateWebpToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateWebpToJpgSize(input, quality, bg.r, bg.g, bg.b);
  }
  if (route.isWebpToPng) {
    const compression = opts?.compression ?? 6;
    if (!estimateWebpToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateWebpToPngSize(input, compression);
  }
  if (route.isGifToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!estimateGifToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateGifToJpgSize(input, quality, bg.r, bg.g, bg.b);
  }
  if (route.isGifToPng) {
    const compression = opts?.compression ?? 6;
    if (!estimateGifToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateGifToPngSize(input, compression);
  }
  if (route.isBmpToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!estimateBmpToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateBmpToJpgSize(input, quality, bg.r, bg.g, bg.b);
  }
  if (route.isBmpToPng) {
    const compression = opts?.compression ?? 6;
    if (!estimateBmpToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateBmpToPngSize(input, compression);
  }
  if (route.isJpg) {
    const compression = opts?.compression ?? 6;
    if (!estimateJpgToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateJpgToPngSize(input, compression);
  }

  const quality = opts?.quality ?? 85;
  const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
  if (!estimatePngToJpgSize) throw new Error("Wasm estimate export not initialized");
  return estimatePngToJpgSize(input, quality, bg.r, bg.g, bg.b);
}

async function handleRequest(req: WorkerRequest): Promise<WorkerResponse> {
  const knownModules = [
    "transmutador_jpg",
    "transmutador_png",
    "transmutador_webp",
    "transmutador_encode",
    "transmutador_gif",
    "transmutador_bmp",
  ];
  if (!knownModules.includes(req.module)) {
    return { id: req.id, ok: false, error: `Unknown module: ${req.module}` };
  }

  const isEstimate = req.purpose === "estimate";
  const isTransmute = req.purpose === "transmute" || req.purpose == null;
  const route = resolveRoute(req);
  const { mime, extension } = resolveMimeExtension(route);

  try {
    if (route.isJpg) {
      await ensureJpgWasmInitialized();
    } else if (route.isWebpToPng || route.isWebpToJpg) {
      await ensureWebpWasmInitialized();
    } else if (route.isGifToPng || route.isGifToJpg) {
      await ensureGifWasmInitialized();
    } else if (route.isBmpToPng || route.isBmpToJpg) {
      await ensureBmpWasmInitialized();
    } else if (route.isEncode) {
      await ensureEncodeWasmInitialized();
    } else {
      await ensurePngWasmInitialized();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "Wasm initialization failed");
    return { id: req.id, ok: false, error: message };
  }

  const input = new Uint8Array(req.bytes);
  const opts = req.options;

  try {
    if (isTransmute && req.fingerprint) {
      const cached = resultCache.get(req.fingerprint);
      if (cached) {
        return {
          id: req.id,
          ok: true,
          purpose: "transmute",
          outputSize: cached.outputSize,
          bytes: cached.bytes,
          mime: cached.mime,
          extension: cached.extension,
          cacheHit: true,
        };
      }
    }

    if (isEstimate) {
      const useCache =
        req.enableResultCache &&
        !!req.fingerprint &&
        !!req.fileIdentity &&
        (req.cacheMaxOutputBytes ?? 0) > 0;

      if (useCache) {
        const result = runFullEncode(route, input, opts);
        const outputSize = result.byteLength;
        const output = result.buffer.slice(
          result.byteOffset,
          result.byteOffset + outputSize
        ) as ArrayBuffer;

        const cacheStored = resultCache.set(
          {
            fingerprint: req.fingerprint!,
            bytes: output,
            outputSize,
            mime,
            extension,
            createdAt: Date.now(),
          },
          req.cacheMaxOutputBytes ?? 0
        );

        return {
          id: req.id,
          ok: true,
          purpose: "estimate",
          outputSize,
          cacheStored,
        };
      }

      const outputSize = runSizeEstimate(route, input, opts);
      return { id: req.id, ok: true, purpose: "estimate", outputSize, cacheStored: false };
    }

    const result = runFullEncode(route, input, opts);
    const outputSize = result.byteLength;
    const output = result.buffer.slice(
      result.byteOffset,
      result.byteOffset + outputSize
    ) as ArrayBuffer;

    return {
      id: req.id,
      ok: true,
      purpose: "transmute",
      outputSize,
      bytes: output,
      mime,
      extension,
    };
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
    if (pendingEstimateId !== req.id) return;
    pendingEstimateId = null;
  }

  postResponse(response);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  pipeline = pipeline.then(() => dispatch(req));
};

self.addEventListener("pagehide", () => {
  resultCache.clear();
});

Promise.all([ensureJpgWasmInitialized(), ensurePngWasmInitialized()]).catch((err) => {
  console.error("Worker: Wasm initialization failed", err);
});
