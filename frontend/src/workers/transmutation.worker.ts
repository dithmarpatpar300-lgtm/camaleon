import type {
  EncodeSource,
  OutputExtension,
  WorkerAlphaHint,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import { SOFT_LIMIT_BYTES } from "@/lib/transmutation/limits";
import { importWasmGlue, wasmExport, initWasmModule, type WasmGlueModule } from "@/lib/wasm/load-glue";
import type { WasmLoadHints } from "@/lib/device/device-capability";
import { ResultCache } from "./result-cache";

type TransmutarFn = (input: Uint8Array) => Uint8Array;
type TransmutarJpgWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type TransmutarPngWithQuality = (input: Uint8Array, quality: number) => Uint8Array;
type TransmutarPngWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateJpgSizeFn = (input: Uint8Array, compression: number) => number;
type EstimatePngSizeFn = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarWebpWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type EstimateWebpSizeFn = (
  input: Uint8Array,
  compression: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarWebpJpgWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateWebpToJpgSizeFn = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type EstimatePngToWebpSizeFn = (input: Uint8Array) => number;
type TransmutarGifWithCompression = (input: Uint8Array, compression: number, frame_index: number) => Uint8Array;
type EstimateGifToPngSizeFn = (input: Uint8Array, compression: number, frame_index: number) => number;
type TransmutarGifJpgWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number, frame_index: number) => Uint8Array;
type EstimateGifToJpgSizeFn = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number, frame_index: number) => number;
type TransmutarBmpWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type EstimateBmpToPngSizeFn = (
  input: Uint8Array,
  compression: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarBmpJpgWithOptions = (input: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number) => Uint8Array;
type EstimateBmpToJpgSizeFn = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarTiffWithCompression = (
  input: Uint8Array,
  compression: number,
  page_index: number
) => Uint8Array;
type EstimateTiffToPngSizeFn = (
  input: Uint8Array,
  compression: number,
  page_index: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarTiffJpgWithOptions = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  page_index: number
) => Uint8Array;
type EstimateTiffToJpgSizeFn = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  page_index: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarIcoWithCompression = (
  input: Uint8Array,
  compression: number,
  entry_index: number
) => Uint8Array;
type EstimateIcoToPngSizeFn = (
  input: Uint8Array,
  compression: number,
  entry_index: number
) => number;
type TransmutarPngToIcoFn = (input: Uint8Array, target_size: number) => Uint8Array;
type EstimatePngToIcoSizeFn = (input: Uint8Array, target_size: number) => number;
type TransmutarTgaWithCompression = (input: Uint8Array, compression: number) => Uint8Array;
type EstimateTgaToPngSizeFn = (input: Uint8Array, compression: number) => number;
type TransmutarAvifWithCompression = (
  input: Uint8Array,
  compression: number,
  frame_index: number
) => Uint8Array;
type EstimateAvifToPngSizeFn = (
  input: Uint8Array,
  compression: number,
  frame_index: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarAvifJpgWithOptions = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  frame_index: number
) => Uint8Array;
type EstimateAvifToJpgSizeFn = (
  input: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number,
  frame_index: number,
  alpha_confidence: number,
  alpha_meaningful: number
) => number;
type TransmutarPngToAvifWithOptions = (
  input: Uint8Array,
  quality: number,
  speed: number
) => Uint8Array;
type EstimatePngToAvifSizeFn = (
  input: Uint8Array,
  quality: number,
  speed: number
) => number;
type TransmutarJpgToAvifWithOptions = (
  input: Uint8Array,
  quality: number,
  speed: number
) => Uint8Array;
type EstimateJpgToAvifSizeFn = (
  input: Uint8Array,
  quality: number,
  speed: number
) => number;
type TransmutarSvgToPngFn = (
  input: Uint8Array,
  out_w: number,
  out_h: number,
  compression: number
) => Uint8Array;
type EstimateSvgToPngSizeFn = (
  input: Uint8Array,
  out_w: number,
  out_h: number,
  compression: number
) => number;
type TransmutarSvgToJpgFn = (
  input: Uint8Array,
  out_w: number,
  out_h: number,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number
) => Uint8Array;
type EstimateSvgToJpgSizeFn = (
  input: Uint8Array,
  out_w: number,
  out_h: number,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number
) => number;

type RecompressPngFn = (input: Uint8Array, compression: number) => Uint8Array;
type RecompressPngOptimizedFn = (input: Uint8Array, compression: number, opt_level: number) => Uint8Array;
type RecompressPngLossyFn = (input: Uint8Array, colors: number, dither: boolean) => Uint8Array;
type RecompressJpegFn = (input: Uint8Array, quality: number) => Uint8Array;
type RecompressJpegWithOptionsFn = (input: Uint8Array, quality: number, chroma_code: number) => Uint8Array;
type RecompressJpegProgressiveFn = (input: Uint8Array, quality: number, chroma_code: number) => Uint8Array;
type ResizePngFn = (input: Uint8Array, resize_percent: number) => Uint8Array;
type ResizeJpegFn = (input: Uint8Array, resize_percent: number) => Uint8Array;
type ResizePngWithFilterFn = (input: Uint8Array, resize_percent: number, filter_code: number) => Uint8Array;
type ResizeJpegWithFilterFn = (input: Uint8Array, resize_percent: number, filter_code: number) => Uint8Array;
type ResizeJpegWithFilterAndQualityFn = (input: Uint8Array, resize_percent: number, filter_code: number, quality: number) => Uint8Array;
type EstimatePngRecompressSizeFn = (input: Uint8Array, compression: number) => number;
type EstimatePngRecompressOptimizedFn = (input: Uint8Array, compression: number, opt_level: number) => number;
type EstimatePngRecompressLossyFn = (input: Uint8Array, colors: number, dither: boolean) => number;
type EstimateJpegRecompressSizeFn = (input: Uint8Array, quality: number) => number;
type EstimateJpegRecompressWithOptionsFn = (input: Uint8Array, quality: number, chroma_code: number) => number;
type EstimateJpegRecompressProgressiveFn = (input: Uint8Array, quality: number, chroma_code: number) => number;
type EstimateResizePngSizeFn = (input: Uint8Array, resize_percent: number, filter_code: number) => number;
type EstimateResizeJpegSizeFn = (input: Uint8Array, resize_percent: number, filter_code: number, quality: number) => number;

type SessionLimitFn = (maxBytes: number) => void;
type RiskModeFn = (enabled: boolean) => void;

function pickRiskMode(mod: WasmGlueModule): RiskModeFn | null {
  const fn = mod.set_risk_mode;
  return typeof fn === "function" ? (fn as RiskModeFn) : null;
}

const WASM_ALPHA_HINT_NONE = 255;

const ALPHA_CONFIDENCE_CODE: Record<WorkerAlphaHint["confidence"], number> = {
  none: 0,
  structural: 1,
  sampled: 2,
  full: 3,
};

let activeEngineHints: WasmLoadHints | undefined;

/** Maps prepare-time alpha assessment to Wasm estimate hint bytes (E0.5). */
function wasmAlphaParams(hint?: WorkerAlphaHint | null): [number, number] {
  if (!hint || hint.confidence === "structural") {
    return [WASM_ALPHA_HINT_NONE, 0];
  }
  return [
    ALPHA_CONFIDENCE_CODE[hint.confidence] ?? WASM_ALPHA_HINT_NONE,
    hint.hasMeaningfulAlpha ? 1 : 0,
  ];
}

function pickSessionLimit(mod: WasmGlueModule): SessionLimitFn | null {
  const fn = mod.set_session_input_limit;
  return typeof fn === "function" ? (fn as SessionLimitFn) : null;
}

let setJpgSessionLimit: SessionLimitFn | null = null;
let setJpgRiskMode: RiskModeFn | null = null;
let transmutarJpg: TransmutarFn | null = null;
let transmutarJpgWithCompression: TransmutarJpgWithCompression | null = null;
let estimateJpgToPngSize: EstimateJpgSizeFn | null = null;

let setPngSessionLimit: SessionLimitFn | null = null;
let setPngRiskMode: RiskModeFn | null = null;
let transmutarPng: TransmutarFn | null = null;
let transmutarPngWithQuality: TransmutarPngWithQuality | null = null;
let transmutarPngWithOptions: TransmutarPngWithOptions | null = null;
let estimatePngToJpgSize: EstimatePngSizeFn | null = null;

let setWebpSessionLimit: SessionLimitFn | null = null;
let setWebpRiskMode: RiskModeFn | null = null;
let transmutarWebp: TransmutarFn | null = null;
let transmutarWebpWithCompression: TransmutarWebpWithCompression | null = null;
let estimateWebpToPngSize: EstimateWebpSizeFn | null = null;
let transmutarWebpJpgWithOptions: TransmutarWebpJpgWithOptions | null = null;
let estimateWebpToJpgSize: EstimateWebpToJpgSizeFn | null = null;

let setEncodeSessionLimit: SessionLimitFn | null = null;
let setEncodeRiskMode: RiskModeFn | null = null;
let transmutarPngToWebp: TransmutarFn | null = null;
let estimatePngToWebpSize: EstimatePngToWebpSizeFn | null = null;
let transmutarJpgToWebp: TransmutarFn | null = null;
let estimateJpgToWebpSize: EstimatePngToWebpSizeFn | null = null;

let setGifSessionLimit: SessionLimitFn | null = null;
let setGifRiskMode: RiskModeFn | null = null;
let transmutarGif: TransmutarFn | null = null;
let transmutarGifWithCompression: TransmutarGifWithCompression | null = null;
let estimateGifToPngSize: EstimateGifToPngSizeFn | null = null;
let transmutarGifJpgWithOptions: TransmutarGifJpgWithOptions | null = null;
let estimateGifToJpgSize: EstimateGifToJpgSizeFn | null = null;

let setBmpSessionLimit: SessionLimitFn | null = null;
let setBmpRiskMode: RiskModeFn | null = null;
let transmutarBmp: TransmutarFn | null = null;
let transmutarBmpWithCompression: TransmutarBmpWithCompression | null = null;
let estimateBmpToPngSize: EstimateBmpToPngSizeFn | null = null;
let transmutarBmpJpgWithOptions: TransmutarBmpJpgWithOptions | null = null;
let estimateBmpToJpgSize: EstimateBmpToJpgSizeFn | null = null;

let setTiffSessionLimit: SessionLimitFn | null = null;
let setTiffRiskMode: RiskModeFn | null = null;
let transmutarTiff: ((input: Uint8Array, page_index: number) => Uint8Array) | null = null;
let transmutarTiffWithCompression: TransmutarTiffWithCompression | null = null;
let estimateTiffToPngSize: EstimateTiffToPngSizeFn | null = null;
let transmutarTiffJpgWithOptions: TransmutarTiffJpgWithOptions | null = null;
let estimateTiffToJpgSize: EstimateTiffToJpgSizeFn | null = null;

let setIcoSessionLimit: SessionLimitFn | null = null;
let setIcoRiskMode: RiskModeFn | null = null;
let setTgaSessionLimit: SessionLimitFn | null = null;
let setTgaRiskMode: RiskModeFn | null = null;
let transmutarIco: ((input: Uint8Array, entry_index: number) => Uint8Array) | null = null;
let transmutarIcoWithCompression: TransmutarIcoWithCompression | null = null;
let estimateIcoToPngSize: EstimateIcoToPngSizeFn | null = null;
let transmutarPngToIco: TransmutarPngToIcoFn | null = null;
let estimatePngToIcoSize: EstimatePngToIcoSizeFn | null = null;
let transmutarTgaWithCompression: TransmutarTgaWithCompression | null = null;
let estimateTgaToPngSize: EstimateTgaToPngSizeFn | null = null;

let setAvifSessionLimit: SessionLimitFn | null = null;
let setAvifRiskMode: RiskModeFn | null = null;
let transmutarAvifWithCompression: TransmutarAvifWithCompression | null = null;
let estimateAvifToPngSize: EstimateAvifToPngSizeFn | null = null;
let transmutarAvifJpgWithOptions: TransmutarAvifJpgWithOptions | null = null;
let estimateAvifToJpgSize: EstimateAvifToJpgSizeFn | null = null;

let setAvifEncodeSessionLimit: SessionLimitFn | null = null;
let setAvifEncodeRiskMode: RiskModeFn | null = null;
let transmutarPngToAvifWithOptions: TransmutarPngToAvifWithOptions | null = null;
let estimatePngToAvifSize: EstimatePngToAvifSizeFn | null = null;
let transmutarJpgToAvifWithOptions: TransmutarJpgToAvifWithOptions | null = null;
let estimateJpgToAvifSize: EstimateJpgToAvifSizeFn | null = null;

let setSvgSessionLimit: SessionLimitFn | null = null;
let setSvgRiskMode: RiskModeFn | null = null;
let transmutarSvgToPng: TransmutarSvgToPngFn | null = null;
let estimateSvgToPngSize: EstimateSvgToPngSizeFn | null = null;
let transmutarSvgToJpg: TransmutarSvgToJpgFn | null = null;
let estimateSvgToJpgSize: EstimateSvgToJpgSizeFn | null = null;

let setOptimizeSessionLimit: SessionLimitFn | null = null;
let setOptimizeRiskMode: RiskModeFn | null = null;
let recompressPng: RecompressPngFn | null = null;
let recompressPngOptimized: RecompressPngOptimizedFn | null = null;
let recompressPngLossy: RecompressPngLossyFn | null = null;
let recompressJpeg: RecompressJpegFn | null = null;
let recompressJpegWithOptions: RecompressJpegWithOptionsFn | null = null;
let recompressJpegProgressive: RecompressJpegProgressiveFn | null = null;
let resizePng: ResizePngFn | null = null;
let resizeJpeg: ResizeJpegFn | null = null;
let resizePngWithFilter: ResizePngWithFilterFn | null = null;
let resizeJpegWithFilter: ResizeJpegWithFilterFn | null = null;
let resizeJpegWithFilterAndQuality: ResizeJpegWithFilterAndQualityFn | null = null;
let estimatePngRecompressSize: EstimatePngRecompressSizeFn | null = null;
let estimatePngRecompressOptimized: EstimatePngRecompressOptimizedFn | null = null;
let estimatePngRecompressLossy: EstimatePngRecompressLossyFn | null = null;
let estimateJpegRecompressSize: EstimateJpegRecompressSizeFn | null = null;
let estimateJpegRecompressWithOptions: EstimateJpegRecompressWithOptionsFn | null = null;
let estimateJpegRecompressProgressive: EstimateJpegRecompressProgressiveFn | null = null;
let estimateResizePngSize: EstimateResizePngSizeFn | null = null;
let estimateResizeJpegSize: EstimateResizeJpegSizeFn | null = null;

let pendingEstimateId: string | null = null;
let pipeline: Promise<void> = Promise.resolve();

const resultCache = new ResultCache();

let initJpgPromise: Promise<void> | null = null;
let initPngPromise: Promise<void> | null = null;
let initWebpPromise: Promise<void> | null = null;
let initEncodePromise: Promise<void> | null = null;
let initGifPromise: Promise<void> | null = null;
let initBmpPromise: Promise<void> | null = null;
let initTiffPromise: Promise<void> | null = null;
let initIcoPromise: Promise<void> | null = null;
let initTgaPromise: Promise<void> | null = null;
let initAvifPromise: Promise<void> | null = null;
let initAvifEncodePromise: Promise<void> | null = null;
let initSvgPromise: Promise<void> | null = null;
let initOptimizePromise: Promise<void> | null = null;

async function initJpgWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_jpg");
  await initWasmModule(module, "transmutador_jpg", activeEngineHints);
  transmutarJpg = wasmExport<TransmutarFn>(module, "transmutar_jpg_a_png");
  transmutarJpgWithCompression = wasmExport<TransmutarJpgWithCompression>(
    module,
    "transmutar_jpg_a_png_with_compression"
  );
  estimateJpgToPngSize = wasmExport<EstimateJpgSizeFn>(module, "estimate_jpg_to_png_size");
  setJpgSessionLimit = pickSessionLimit(module);
  setJpgRiskMode = pickRiskMode(module);
}

async function initPngWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_png");
  await initWasmModule(module, "transmutador_png", activeEngineHints);
  transmutarPng = wasmExport<TransmutarFn>(module, "transmutar_png_a_jpg");
  transmutarPngWithQuality = wasmExport<TransmutarPngWithQuality>(
    module,
    "transmutar_png_a_jpg_with_quality"
  );
  transmutarPngWithOptions = wasmExport<TransmutarPngWithOptions>(
    module,
    "transmutar_png_a_jpg_with_options"
  );
  estimatePngToJpgSize = wasmExport<EstimatePngSizeFn>(module, "estimate_png_to_jpg_size");
  setPngSessionLimit = pickSessionLimit(module);
  setPngRiskMode = pickRiskMode(module);
}

async function initWebpWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_webp");
  await initWasmModule(module, "transmutador_webp", activeEngineHints);
  transmutarWebp = wasmExport<TransmutarFn>(module, "transmutar_webp_a_png");
  transmutarWebpWithCompression = wasmExport<TransmutarWebpWithCompression>(
    module,
    "transmutar_webp_a_png_with_compression"
  );
  estimateWebpToPngSize = wasmExport<EstimateWebpSizeFn>(module, "estimate_webp_to_png_size");
  transmutarWebpJpgWithOptions = wasmExport<TransmutarWebpJpgWithOptions>(
    module,
    "transmutar_webp_a_jpg_with_options"
  );
  estimateWebpToJpgSize = wasmExport<EstimateWebpToJpgSizeFn>(module, "estimate_webp_to_jpg_size");
  setWebpSessionLimit = pickSessionLimit(module);
  setWebpRiskMode = pickRiskMode(module);
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
  const module = await importWasmGlue("transmutador_encode");
  await initWasmModule(module, "transmutador_encode", activeEngineHints);
  transmutarPngToWebp = wasmExport<TransmutarFn>(module, "transmutar_png_a_webp");
  estimatePngToWebpSize = wasmExport<EstimatePngToWebpSizeFn>(module, "estimate_png_to_webp_size");
  transmutarJpgToWebp = wasmExport<TransmutarFn>(module, "transmutar_jpg_a_webp");
  estimateJpgToWebpSize = wasmExport<EstimatePngToWebpSizeFn>(module, "estimate_jpg_to_webp_size");
  setEncodeSessionLimit = pickSessionLimit(module);
  setEncodeRiskMode = pickRiskMode(module);
}

function ensureEncodeWasmInitialized(): Promise<void> {
  if (!initEncodePromise) initEncodePromise = initEncodeWasm();
  return initEncodePromise;
}

async function initGifWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_gif");
  await initWasmModule(module, "transmutador_gif", activeEngineHints);
  transmutarGif = wasmExport<TransmutarFn>(module, "transmutar_gif_a_png");
  transmutarGifWithCompression = wasmExport<TransmutarGifWithCompression>(
    module,
    "transmutar_gif_a_png_with_compression"
  );
  estimateGifToPngSize = wasmExport<EstimateGifToPngSizeFn>(module, "estimate_gif_to_png_size");
  transmutarGifJpgWithOptions = wasmExport<TransmutarGifJpgWithOptions>(
    module,
    "transmutar_gif_a_jpg_with_options"
  );
  estimateGifToJpgSize = wasmExport<EstimateGifToJpgSizeFn>(module, "estimate_gif_to_jpg_size");
  setGifSessionLimit = pickSessionLimit(module);
  setGifRiskMode = pickRiskMode(module);
}

function ensureGifWasmInitialized(): Promise<void> {
  if (!initGifPromise) initGifPromise = initGifWasm();
  return initGifPromise;
}

async function initBmpWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_bmp");
  await initWasmModule(module, "transmutador_bmp", activeEngineHints);
  transmutarBmp = wasmExport<TransmutarFn>(module, "transmutar_bmp_a_png");
  transmutarBmpWithCompression = wasmExport<TransmutarBmpWithCompression>(
    module,
    "transmutar_bmp_a_png_with_compression"
  );
  estimateBmpToPngSize = wasmExport<EstimateBmpToPngSizeFn>(module, "estimate_bmp_to_png_size");
  transmutarBmpJpgWithOptions = wasmExport<TransmutarBmpJpgWithOptions>(
    module,
    "transmutar_bmp_a_jpg_with_options"
  );
  estimateBmpToJpgSize = wasmExport<EstimateBmpToJpgSizeFn>(module, "estimate_bmp_to_jpg_size");
  setBmpSessionLimit = pickSessionLimit(module);
  setBmpRiskMode = pickRiskMode(module);
}

function ensureBmpWasmInitialized(): Promise<void> {
  if (!initBmpPromise) initBmpPromise = initBmpWasm();
  return initBmpPromise;
}

async function initTiffWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_tiff");
  await initWasmModule(module, "transmutador_tiff", activeEngineHints);
  transmutarTiff = wasmExport<(input: Uint8Array, page_index: number) => Uint8Array>(
    module,
    "transmutar_tiff_a_png"
  );
  transmutarTiffWithCompression = wasmExport<TransmutarTiffWithCompression>(
    module,
    "transmutar_tiff_a_png_with_compression"
  );
  estimateTiffToPngSize = wasmExport<EstimateTiffToPngSizeFn>(
    module,
    "estimate_tiff_to_png_size"
  );
  transmutarTiffJpgWithOptions = wasmExport<TransmutarTiffJpgWithOptions>(
    module,
    "transmutar_tiff_a_jpg_with_options"
  );
  estimateTiffToJpgSize = wasmExport<EstimateTiffToJpgSizeFn>(
    module,
    "estimate_tiff_to_jpg_size"
  );
  setTiffSessionLimit = pickSessionLimit(module);
  setTiffRiskMode = pickRiskMode(module);
}

function ensureTiffWasmInitialized(): Promise<void> {
  if (!initTiffPromise) initTiffPromise = initTiffWasm();
  return initTiffPromise;
}

async function initIcoWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_ico");
  await initWasmModule(module, "transmutador_ico", activeEngineHints);
  transmutarIco = wasmExport<(input: Uint8Array, entry_index: number) => Uint8Array>(
    module,
    "transmutar_ico_a_png"
  );
  transmutarIcoWithCompression = wasmExport<TransmutarIcoWithCompression>(
    module,
    "transmutar_ico_a_png_with_compression"
  );
  estimateIcoToPngSize = wasmExport<EstimateIcoToPngSizeFn>(
    module,
    "estimate_ico_to_png_size"
  );
  transmutarPngToIco = wasmExport<TransmutarPngToIcoFn>(module, "transmutar_png_a_ico");
  estimatePngToIcoSize = wasmExport<EstimatePngToIcoSizeFn>(
    module,
    "estimate_png_to_ico_size"
  );
  setIcoSessionLimit = pickSessionLimit(module);
  setIcoRiskMode = pickRiskMode(module);
}

function ensureIcoWasmInitialized(): Promise<void> {
  if (!initIcoPromise) initIcoPromise = initIcoWasm();
  return initIcoPromise;
}

async function initTgaWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_tga");
  await initWasmModule(module, "transmutador_tga", activeEngineHints);
  transmutarTgaWithCompression = wasmExport<TransmutarTgaWithCompression>(
    module,
    "transmutar_tga_a_png_with_compression"
  );
  estimateTgaToPngSize = wasmExport<EstimateTgaToPngSizeFn>(
    module,
    "estimate_tga_to_png_size"
  );
  setTgaSessionLimit = pickSessionLimit(module);
  setTgaRiskMode = pickRiskMode(module);
}

function ensureTgaWasmInitialized(): Promise<void> {
  if (!initTgaPromise) initTgaPromise = initTgaWasm();
  return initTgaPromise;
}

async function initOptimizeWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_optimize");
  await initWasmModule(module, "transmutador_optimize", activeEngineHints);
  recompressPng = wasmExport<RecompressPngFn>(module, "recompress_png");
  recompressPngOptimized = wasmExport<RecompressPngOptimizedFn>(module, "recompress_png_optimized");
  recompressPngLossy = wasmExport<RecompressPngLossyFn>(module, "recompress_png_lossy");
  recompressJpeg = wasmExport<RecompressJpegFn>(module, "recompress_jpeg");
  recompressJpegWithOptions = wasmExport<RecompressJpegWithOptionsFn>(module, "recompress_jpeg_with_options");
  recompressJpegProgressive = wasmExport<RecompressJpegProgressiveFn>(module, "recompress_jpeg_progressive");
  resizePng = wasmExport<ResizePngFn>(module, "resize_png");
  resizeJpeg = wasmExport<ResizeJpegFn>(module, "resize_jpeg");
  resizePngWithFilter = wasmExport<ResizePngWithFilterFn>(module, "resize_png_with_filter");
  resizeJpegWithFilter = wasmExport<ResizeJpegWithFilterFn>(module, "resize_jpeg_with_filter");
  resizeJpegWithFilterAndQuality = wasmExport<ResizeJpegWithFilterAndQualityFn>(module, "resize_jpeg_with_filter_and_quality");
  estimatePngRecompressSize = wasmExport<EstimatePngRecompressSizeFn>(
    module,
    "estimate_png_recompress_size"
  );
  estimatePngRecompressOptimized = wasmExport<EstimatePngRecompressOptimizedFn>(
    module,
    "estimate_png_recompress_optimized"
  );
  estimatePngRecompressLossy = wasmExport<EstimatePngRecompressLossyFn>(
    module,
    "estimate_png_recompress_lossy"
  );
  estimateJpegRecompressSize = wasmExport<EstimateJpegRecompressSizeFn>(
    module,
    "estimate_jpeg_recompress_size"
  );
  estimateJpegRecompressWithOptions = wasmExport<EstimateJpegRecompressWithOptionsFn>(
    module,
    "estimate_jpeg_recompress_with_options"
  );
  estimateJpegRecompressProgressive = wasmExport<EstimateJpegRecompressProgressiveFn>(
    module,
    "estimate_jpeg_recompress_progressive"
  );
  estimateResizePngSize = wasmExport<EstimateResizePngSizeFn>(module, "estimate_resize_png_size");
  estimateResizeJpegSize = wasmExport<EstimateResizeJpegSizeFn>(module, "estimate_resize_jpeg_size");
  setOptimizeSessionLimit = pickSessionLimit(module);
  setOptimizeRiskMode = pickRiskMode(module);
}

function ensureOptimizeWasmInitialized(): Promise<void> {
  if (!initOptimizePromise) initOptimizePromise = initOptimizeWasm();
  return initOptimizePromise;
}

async function initAvifWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_avif");
  await initWasmModule(module, "transmutador_avif", activeEngineHints);
  transmutarAvifWithCompression = wasmExport<TransmutarAvifWithCompression>(
    module,
    "transmutar_avif_a_png_with_compression"
  );
  estimateAvifToPngSize = wasmExport<EstimateAvifToPngSizeFn>(
    module,
    "estimate_avif_to_png_size"
  );
  transmutarAvifJpgWithOptions = wasmExport<TransmutarAvifJpgWithOptions>(
    module,
    "transmutar_avif_a_jpg_with_options"
  );
  estimateAvifToJpgSize = wasmExport<EstimateAvifToJpgSizeFn>(
    module,
    "estimate_avif_to_jpg_size"
  );
  setAvifSessionLimit = pickSessionLimit(module);
  setAvifRiskMode = pickRiskMode(module);
}

function ensureAvifWasmInitialized(): Promise<void> {
  if (!initAvifPromise) initAvifPromise = initAvifWasm();
  return initAvifPromise;
}

async function initAvifEncodeWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_avif_encode");
  await initWasmModule(module, "transmutador_avif_encode", activeEngineHints);
  transmutarPngToAvifWithOptions = wasmExport<TransmutarPngToAvifWithOptions>(
    module,
    "transmutar_png_a_avif_with_options"
  );
  estimatePngToAvifSize = wasmExport<EstimatePngToAvifSizeFn>(
    module,
    "estimate_png_to_avif_size"
  );
  transmutarJpgToAvifWithOptions = wasmExport<TransmutarJpgToAvifWithOptions>(
    module,
    "transmutar_jpg_a_avif_with_options"
  );
  estimateJpgToAvifSize = wasmExport<EstimateJpgToAvifSizeFn>(
    module,
    "estimate_jpg_to_avif_size"
  );
  setAvifEncodeSessionLimit = pickSessionLimit(module);
  setAvifEncodeRiskMode = pickRiskMode(module);
}

function ensureAvifEncodeWasmInitialized(): Promise<void> {
  if (!initAvifEncodePromise) initAvifEncodePromise = initAvifEncodeWasm();
  return initAvifEncodePromise;
}

async function initSvgWasm(): Promise<void> {
  const module = await importWasmGlue("transmutador_svg");
  await initWasmModule(module, "transmutador_svg", activeEngineHints);
  transmutarSvgToPng = wasmExport<TransmutarSvgToPngFn>(module, "transmutar_svg_a_png");
  estimateSvgToPngSize = wasmExport<EstimateSvgToPngSizeFn>(
    module,
    "estimate_svg_to_png_size"
  );
  transmutarSvgToJpg = wasmExport<TransmutarSvgToJpgFn>(
    module,
    "transmutar_svg_a_jpg_with_options"
  );
  estimateSvgToJpgSize = wasmExport<EstimateSvgToJpgSizeFn>(
    module,
    "estimate_svg_to_jpg_size"
  );
  setSvgSessionLimit = pickSessionLimit(module);
  setSvgRiskMode = pickRiskMode(module);
}

function ensureSvgWasmInitialized(): Promise<void> {
  if (!initSvgPromise) initSvgPromise = initSvgWasm();
  return initSvgPromise;
}

function svgOutputDimensions(opts: WorkerRequest["options"]): { w: number; h: number } {
  const w = opts?.outputWidth ?? 0;
  const h = opts?.outputHeight ?? 0;
  if (w <= 0 || h <= 0) {
    throw new Error("SVG output dimensions are required (outputWidth × outputHeight)");
  }
  return { w, h };
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

function resetAllSessionLimits(): void {
  setJpgSessionLimit?.(SOFT_LIMIT_BYTES);
  setPngSessionLimit?.(SOFT_LIMIT_BYTES);
  setWebpSessionLimit?.(SOFT_LIMIT_BYTES);
  setEncodeSessionLimit?.(SOFT_LIMIT_BYTES);
  setGifSessionLimit?.(SOFT_LIMIT_BYTES);
  setBmpSessionLimit?.(SOFT_LIMIT_BYTES);
  setTiffSessionLimit?.(SOFT_LIMIT_BYTES);
  setIcoSessionLimit?.(SOFT_LIMIT_BYTES);
  setTgaSessionLimit?.(SOFT_LIMIT_BYTES);
  setAvifSessionLimit?.(SOFT_LIMIT_BYTES);
  setAvifEncodeSessionLimit?.(SOFT_LIMIT_BYTES);
  setSvgSessionLimit?.(SOFT_LIMIT_BYTES);
}

function purgeWorkerState(id: string): WorkerResponse {
  resultCache.clear();
  if (pendingEstimateId) {
    supersedeEstimate(pendingEstimateId);
    pendingEstimateId = null;
  }
  resetAllSessionLimits();
  return { id, ok: true, purpose: "purge", outputSize: 0 };
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
  isTiffToPng: boolean;
  isTiffToJpg: boolean;
  isIcoToPng: boolean;
  isPngToIco: boolean;
  isTgaToPng: boolean;
  isAvifToPng: boolean;
  isAvifToJpg: boolean;
  isAvifEncode: boolean;
  isSvgToPng: boolean;
  isSvgToJpg: boolean;
  isEncode: boolean;
  isOptimize: boolean;
  isOptimizePng: boolean;
  isOptimizeJpg: boolean;
  isOptimizeResize: boolean;
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
  const isTiffToPng =
    req.module === "transmutador_tiff" && (req.outputExtension ?? "png") === "png";
  const isTiffToJpg =
    req.module === "transmutador_tiff" && req.outputExtension === "jpg";
  const isIcoToPng =
    req.module === "transmutador_ico" && (req.outputExtension ?? "png") === "png";
  const isPngToIco =
    req.module === "transmutador_ico" && req.outputExtension === "ico";
  const isTgaToPng = req.module === "transmutador_tga";
  const isAvifToPng =
    req.module === "transmutador_avif" && (req.outputExtension ?? "png") === "png";
  const isAvifToJpg =
    req.module === "transmutador_avif" && req.outputExtension === "jpg";
  const isAvifEncode = req.module === "transmutador_avif_encode";
  const isSvgToPng =
    req.module === "transmutador_svg" && (req.outputExtension ?? "png") === "png";
  const isSvgToJpg =
    req.module === "transmutador_svg" && req.outputExtension === "jpg";
  const isOptimize = req.module === "transmutador_optimize";
  const isOptimizePng = isOptimize && (req.outputExtension ?? "png") === "png";
  const isOptimizeJpg = isOptimize && req.outputExtension === "jpg";
  const isOptimizeResize = isOptimize && req.options?.resizePercent != null;
  const encodeSource =
    isEncode || isAvifEncode ? req.encodeSource : undefined;
  return {
    isJpg,
    isPng,
    isWebpToPng,
    isWebpToJpg,
    isGifToPng,
    isGifToJpg,
    isBmpToPng,
    isBmpToJpg,
    isTiffToPng,
    isTiffToJpg,
    isIcoToPng,
    isPngToIco,
    isTgaToPng,
    isAvifToPng,
    isAvifToJpg,
    isAvifEncode,
    isSvgToPng,
    isSvgToJpg,
    isEncode,
    isOptimize,
    isOptimizePng,
    isOptimizeJpg,
    isOptimizeResize,
    encodeSource,
  };
}

function resolveMimeExtension(route: RouteFlags): { mime: string; extension: OutputExtension } {
  if (route.isEncode) {
    return { mime: "image/webp", extension: "webp" };
  }
  if (route.isAvifEncode) {
    return { mime: "image/avif", extension: "avif" };
  }
  if (route.isOptimize && route.isOptimizeJpg) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (route.isOptimize && route.isOptimizePng) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    route.isWebpToJpg ||
    route.isAvifToJpg ||
    route.isPng ||
    route.isGifToJpg ||
    route.isBmpToJpg ||
    route.isTiffToJpg ||
    route.isSvgToJpg
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (route.isPngToIco) {
    return { mime: "image/x-icon", extension: "ico" };
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
    const frameIndex = opts?.frameIndex ?? 0;
    if (!transmutarGifJpgWithOptions) throw new Error("Wasm module not initialized");
    return transmutarGifJpgWithOptions(input, quality, bg.r, bg.g, bg.b, frameIndex);
  }
  if (route.isGifToPng) {
    const compression = opts?.compression ?? 6;
    const frameIndex = opts?.frameIndex ?? 0;
    if (!transmutarGifWithCompression) throw new Error("Wasm module not initialized");
    return transmutarGifWithCompression(input, compression, frameIndex);
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
  if (route.isTiffToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const pageIndex = opts?.pageIndex ?? 0;
    if (!transmutarTiffJpgWithOptions) throw new Error("Wasm module not initialized");
    return transmutarTiffJpgWithOptions(input, quality, bg.r, bg.g, bg.b, pageIndex);
  }
  if (route.isTiffToPng) {
    const pageIndex = opts?.pageIndex ?? 0;
    const compression = opts?.compression ?? 6;
    if (transmutarTiffWithCompression) {
      return transmutarTiffWithCompression(input, compression, pageIndex);
    }
    if (transmutarTiff) return transmutarTiff(input, pageIndex);
    throw new Error("Wasm module not initialized");
  }
  if (route.isIcoToPng) {
    const entryIndex = opts?.entryIndex ?? 0;
    const compression = opts?.compression ?? 6;
    if (transmutarIcoWithCompression) {
      return transmutarIcoWithCompression(input, compression, entryIndex);
    }
    if (transmutarIco) return transmutarIco(input, entryIndex);
    throw new Error("Wasm module not initialized");
  }
  if (route.isPngToIco) {
    const iconSize = opts?.iconSize ?? 256;
    if (!transmutarPngToIco) throw new Error("Wasm module not initialized");
    return transmutarPngToIco(input, iconSize);
  }
  if (route.isTgaToPng) {
    const compression = opts?.compression ?? 6;
    if (!transmutarTgaWithCompression) throw new Error("Wasm module not initialized");
    return transmutarTgaWithCompression(input, compression);
  }
  if (route.isAvifToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const frameIndex = opts?.frameIndex ?? 0;
    if (!transmutarAvifJpgWithOptions) throw new Error("Wasm module not initialized");
    return transmutarAvifJpgWithOptions(input, quality, bg.r, bg.g, bg.b, frameIndex);
  }
  if (route.isAvifToPng) {
    const compression = opts?.compression ?? 6;
    const frameIndex = opts?.frameIndex ?? 0;
    if (!transmutarAvifWithCompression) throw new Error("Wasm module not initialized");
    return transmutarAvifWithCompression(input, compression, frameIndex);
  }
  if (route.isSvgToPng) {
    const compression = opts?.compression ?? 6;
    const { w, h } = svgOutputDimensions(opts);
    if (!transmutarSvgToPng) throw new Error("Wasm module not initialized");
    return transmutarSvgToPng(input, w, h, compression);
  }
  if (route.isSvgToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const { w, h } = svgOutputDimensions(opts);
    if (!transmutarSvgToJpg) throw new Error("Wasm module not initialized");
    return transmutarSvgToJpg(input, w, h, quality, bg.r, bg.g, bg.b);
  }
  if (route.isAvifEncode) {
    if (!route.encodeSource) {
      throw new Error("encodeSource is required for transmutador_avif_encode");
    }
    const quality = opts?.quality ?? 60;
    const speed = opts?.speed ?? 6;
    if (route.encodeSource === "jpeg") {
      if (!transmutarJpgToAvifWithOptions) throw new Error("Wasm module not initialized");
      return transmutarJpgToAvifWithOptions(input, quality, speed);
    }
    if (!transmutarPngToAvifWithOptions) throw new Error("Wasm module not initialized");
    return transmutarPngToAvifWithOptions(input, quality, speed);
  }
  if (route.isOptimize) {
    const resizePercent = opts?.resizePercent;
    const resizeFilter = opts?.resizeFilter;
    if (route.isOptimizeResize && resizePercent != null) {
      if (route.isOptimizePng) {
        if (resizeFilter != null && resizeFilter !== 2 && resizePngWithFilter) {
          return resizePngWithFilter(input, resizePercent, resizeFilter);
        }
        if (!resizePng) throw new Error("Wasm module not initialized");
        return resizePng(input, resizePercent);
      }
      if (route.isOptimizeJpg) {
        const quality = opts?.quality;
        const hasQuality = quality != null && quality !== 85;
        const hasFilter = resizeFilter != null && resizeFilter !== 2;
        if (hasQuality && resizeJpegWithFilterAndQuality) {
          return resizeJpegWithFilterAndQuality(input, resizePercent, resizeFilter ?? 2, quality);
        }
        if (hasFilter && resizeJpegWithFilter) {
          return resizeJpegWithFilter(input, resizePercent, resizeFilter);
        }
        if (hasQuality && resizeJpegWithFilterAndQuality) {
          return resizeJpegWithFilterAndQuality(input, resizePercent, 2, quality);
        }
        if (!resizeJpeg) throw new Error("Wasm module not initialized");
        return resizeJpeg(input, resizePercent);
      }
      if (!resizeJpeg) throw new Error("Wasm module not initialized");
      return resizeJpeg(input, resizePercent);
    }
    if (route.isOptimizePng) {
      const compression = opts?.compression ?? 9;
      const optLevel = opts?.optimizationLevel ?? 0;
      const lossyMode = opts?.lossyMode ?? 0;
      if (lossyMode > 0 && recompressPngLossy) {
        const colors = opts?.lossyColors ?? 256;
        return recompressPngLossy(input, colors, true);
      }
      if (optLevel > 0 && recompressPngOptimized) {
        return recompressPngOptimized(input, compression, optLevel);
      }
      if (!recompressPng) throw new Error("Wasm module not initialized");
      return recompressPng(input, compression);
    }
    const quality = opts?.quality ?? 75;
    const subsampling = opts?.subsampling ?? 0;
    const progressive = opts?.progressive ?? 0;
    if (progressive > 0 && recompressJpegProgressive) {
      return recompressJpegProgressive(input, quality, subsampling);
    }
    if (subsampling > 0 && recompressJpegWithOptions) {
      return recompressJpegWithOptions(input, quality, subsampling);
    }
    if (!recompressJpeg) throw new Error("Wasm module not initialized");
    return recompressJpeg(input, quality);
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
  opts: WorkerRequest["options"],
  alphaHint?: WorkerAlphaHint | null
): number {
  const [alphaConfidence, alphaMeaningful] = wasmAlphaParams(alphaHint);
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
    return estimateWebpToJpgSize(
      input,
      quality,
      bg.r,
      bg.g,
      bg.b,
      alphaConfidence,
      alphaMeaningful
    );
  }
  if (route.isWebpToPng) {
    const compression = opts?.compression ?? 6;
    if (!estimateWebpToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateWebpToPngSize(input, compression, alphaConfidence, alphaMeaningful);
  }
  if (route.isGifToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const frameIndex = opts?.frameIndex ?? 0;
    if (!estimateGifToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateGifToJpgSize(input, quality, bg.r, bg.g, bg.b, frameIndex);
  }
  if (route.isGifToPng) {
    const compression = opts?.compression ?? 6;
    const frameIndex = opts?.frameIndex ?? 0;
    if (!estimateGifToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateGifToPngSize(input, compression, frameIndex);
  }
  if (route.isBmpToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    if (!estimateBmpToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateBmpToJpgSize(
      input,
      quality,
      bg.r,
      bg.g,
      bg.b,
      alphaConfidence,
      alphaMeaningful
    );
  }
  if (route.isBmpToPng) {
    const compression = opts?.compression ?? 6;
    if (!estimateBmpToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateBmpToPngSize(input, compression, alphaConfidence, alphaMeaningful);
  }
  if (route.isTiffToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const pageIndex = opts?.pageIndex ?? 0;
    if (!estimateTiffToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateTiffToJpgSize(
      input,
      quality,
      bg.r,
      bg.g,
      bg.b,
      pageIndex,
      alphaConfidence,
      alphaMeaningful
    );
  }
  if (route.isTiffToPng) {
    const compression = opts?.compression ?? 6;
    const pageIndex = opts?.pageIndex ?? 0;
    if (!estimateTiffToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateTiffToPngSize(
      input,
      compression,
      pageIndex,
      alphaConfidence,
      alphaMeaningful
    );
  }
  if (route.isIcoToPng) {
    const compression = opts?.compression ?? 6;
    const entryIndex = opts?.entryIndex ?? 0;
    if (!estimateIcoToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateIcoToPngSize(input, compression, entryIndex);
  }
  if (route.isPngToIco) {
    const iconSize = opts?.iconSize ?? 256;
    if (!estimatePngToIcoSize) throw new Error("Wasm estimate export not initialized");
    return estimatePngToIcoSize(input, iconSize);
  }
  if (route.isTgaToPng) {
    const compression = opts?.compression ?? 6;
    if (!estimateTgaToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateTgaToPngSize(input, compression);
  }
  if (route.isAvifToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const frameIndex = opts?.frameIndex ?? 0;
    if (!estimateAvifToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateAvifToJpgSize(
      input,
      quality,
      bg.r,
      bg.g,
      bg.b,
      frameIndex,
      alphaConfidence,
      alphaMeaningful
    );
  }
  if (route.isAvifToPng) {
    const compression = opts?.compression ?? 6;
    const frameIndex = opts?.frameIndex ?? 0;
    if (!estimateAvifToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateAvifToPngSize(
      input,
      compression,
      frameIndex,
      alphaConfidence,
      alphaMeaningful
    );
  }
  if (route.isSvgToPng) {
    const compression = opts?.compression ?? 6;
    const { w, h } = svgOutputDimensions(opts);
    if (!estimateSvgToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateSvgToPngSize(input, w, h, compression);
  }
  if (route.isSvgToJpg) {
    const quality = opts?.quality ?? 85;
    const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
    const { w, h } = svgOutputDimensions(opts);
    if (!estimateSvgToJpgSize) throw new Error("Wasm estimate export not initialized");
    return estimateSvgToJpgSize(input, w, h, quality, bg.r, bg.g, bg.b);
  }
  if (route.isAvifEncode) {
    if (!route.encodeSource) {
      throw new Error("encodeSource is required for transmutador_avif_encode");
    }
    const quality = opts?.quality ?? 60;
    const speed = opts?.speed ?? 6;
    if (route.encodeSource === "jpeg") {
      if (!estimateJpgToAvifSize) throw new Error("Wasm estimate export not initialized");
      return estimateJpgToAvifSize(input, quality, speed);
    }
    if (!estimatePngToAvifSize) throw new Error("Wasm estimate export not initialized");
    return estimatePngToAvifSize(input, quality, speed);
  }
  if (route.isOptimize) {
    const resizePercent = opts?.resizePercent;
    const resizeFilter = opts?.resizeFilter;
    if (route.isOptimizeResize && resizePercent != null) {
      if (route.isOptimizePng) {
        if (estimateResizePngSize) {
          return estimateResizePngSize(input, resizePercent, resizeFilter ?? 2);
        }
        if (resizeFilter != null && resizeFilter !== 2 && resizePngWithFilter) {
          return resizePngWithFilter(input, resizePercent, resizeFilter).byteLength;
        }
        if (!resizePng) throw new Error("Wasm estimate export not initialized");
        return resizePng(input, resizePercent).byteLength;
      }
      if (route.isOptimizeJpg) {
        const quality = opts?.quality ?? 85;
        if (estimateResizeJpegSize) {
          return estimateResizeJpegSize(input, resizePercent, resizeFilter ?? 2, quality);
        }
        if (resizeJpegWithFilterAndQuality) {
          return resizeJpegWithFilterAndQuality(input, resizePercent, resizeFilter ?? 2, quality).byteLength;
        }
        if (resizeFilter != null && resizeFilter !== 2 && resizeJpegWithFilter) {
          return resizeJpegWithFilter(input, resizePercent, resizeFilter).byteLength;
        }
        if (!resizeJpeg) throw new Error("Wasm estimate export not initialized");
        return resizeJpeg(input, resizePercent).byteLength;
      }
      if (!resizeJpeg) throw new Error("Wasm estimate export not initialized");
      return resizeJpeg(input, resizePercent).byteLength;
    }
    if (route.isOptimizePng) {
      const compression = opts?.compression ?? 9;
      const optLevel = opts?.optimizationLevel ?? 0;
      const lossyMode = opts?.lossyMode ?? 0;
      if (lossyMode > 0 && estimatePngRecompressLossy) {
        const colors = opts?.lossyColors ?? 256;
        return estimatePngRecompressLossy(input, colors, true);
      }
      if (optLevel > 0 && estimatePngRecompressOptimized) {
        return estimatePngRecompressOptimized(input, compression, optLevel);
      }
      if (!estimatePngRecompressSize) throw new Error("Wasm estimate export not initialized");
      return estimatePngRecompressSize(input, compression);
    }
    const quality = opts?.quality ?? 75;
    const subsampling = opts?.subsampling ?? 0;
    const progressive = opts?.progressive ?? 0;
    if (progressive > 0 && estimateJpegRecompressProgressive) {
      return estimateJpegRecompressProgressive(input, quality, subsampling);
    }
    if (subsampling > 0 && estimateJpegRecompressWithOptions) {
      return estimateJpegRecompressWithOptions(input, quality, subsampling);
    }
    if (!estimateJpegRecompressSize) throw new Error("Wasm estimate export not initialized");
    return estimateJpegRecompressSize(input, quality);
  }
  if (route.isJpg) {
    const compression = opts?.compression ?? 6;
    if (!estimateJpgToPngSize) throw new Error("Wasm estimate export not initialized");
    return estimateJpgToPngSize(input, compression);
  }

  const quality = opts?.quality ?? 85;
  const bg = opts?.background ?? { r: 255, g: 255, b: 255 };
  if (!estimatePngToJpgSize) throw new Error("Wasm estimate export not initialized");
  return estimatePngToJpgSize(
    input,
    quality,
    bg.r,
    bg.g,
    bg.b,
    alphaConfidence,
    alphaMeaningful
  );
}

function applySessionInputLimit(route: RouteFlags, maxBytes: number): void {
  if (route.isJpg) {
    setJpgSessionLimit?.(maxBytes);
    return;
  }
  if (route.isWebpToPng || route.isWebpToJpg) {
    setWebpSessionLimit?.(maxBytes);
    return;
  }
  if (route.isGifToPng || route.isGifToJpg) {
    setGifSessionLimit?.(maxBytes);
    return;
  }
  if (route.isBmpToPng || route.isBmpToJpg) {
    setBmpSessionLimit?.(maxBytes);
    return;
  }
  if (route.isTiffToPng || route.isTiffToJpg) {
    setTiffSessionLimit?.(maxBytes);
    return;
  }
  if (route.isIcoToPng || route.isPngToIco) {
    setIcoSessionLimit?.(maxBytes);
    return;
  }
  if (route.isTgaToPng) {
    setTgaSessionLimit?.(maxBytes);
    return;
  }
  if (route.isAvifToPng || route.isAvifToJpg) {
    setAvifSessionLimit?.(maxBytes);
    return;
  }
  if (route.isAvifEncode) {
    setAvifEncodeSessionLimit?.(maxBytes);
    return;
  }
  if (route.isSvgToPng || route.isSvgToJpg) {
    setSvgSessionLimit?.(maxBytes);
    return;
  }
  if (route.isEncode) {
    setEncodeSessionLimit?.(maxBytes);
    return;
  }
  if (route.isOptimize) {
    setOptimizeSessionLimit?.(maxBytes);
    return;
  }
  setPngSessionLimit?.(maxBytes);
}

function applyRiskMode(route: RouteFlags, enabled: boolean): void {
  if (route.isJpg) {
    setJpgRiskMode?.(enabled);
    return;
  }
  if (route.isWebpToPng || route.isWebpToJpg) {
    setWebpRiskMode?.(enabled);
    return;
  }
  if (route.isGifToPng || route.isGifToJpg) {
    setGifRiskMode?.(enabled);
    return;
  }
  if (route.isBmpToPng || route.isBmpToJpg) {
    setBmpRiskMode?.(enabled);
    return;
  }
  if (route.isTiffToPng || route.isTiffToJpg) {
    setTiffRiskMode?.(enabled);
    return;
  }
  if (route.isIcoToPng || route.isPngToIco) {
    setIcoRiskMode?.(enabled);
    return;
  }
  if (route.isTgaToPng) {
    setTgaRiskMode?.(enabled);
    return;
  }
  if (route.isAvifToPng || route.isAvifToJpg) {
    setAvifRiskMode?.(enabled);
    return;
  }
  if (route.isAvifEncode) {
    setAvifEncodeRiskMode?.(enabled);
    return;
  }
  if (route.isSvgToPng || route.isSvgToJpg) {
    setSvgRiskMode?.(enabled);
    return;
  }
  if (route.isEncode) {
    setEncodeRiskMode?.(enabled);
    return;
  }
  if (route.isOptimize) {
    setOptimizeRiskMode?.(enabled);
    return;
  }
  setPngRiskMode?.(enabled);
}

async function handleRequest(req: WorkerRequest): Promise<WorkerResponse> {
  const knownModules = [
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
  if (!req.module || !knownModules.includes(req.module)) {
    return { id: req.id, ok: false, error: `Unknown module: ${req.module ?? "none"}` };
  }

  if (!req.bytes) {
    return { id: req.id, ok: false, error: "Missing input bytes" };
  }

  const isEstimate = req.purpose === "estimate";
  const isTransmute = req.purpose === "transmute" || req.purpose == null;
  const route = resolveRoute(req);
  const { mime, extension } = resolveMimeExtension(route);

  try {
    activeEngineHints = req.engineLoadHints;
    if (route.isJpg) {
      await ensureJpgWasmInitialized();
    } else if (route.isWebpToPng || route.isWebpToJpg) {
      await ensureWebpWasmInitialized();
    } else if (route.isGifToPng || route.isGifToJpg) {
      await ensureGifWasmInitialized();
    } else if (route.isBmpToPng || route.isBmpToJpg) {
      await ensureBmpWasmInitialized();
    } else if (route.isTiffToPng || route.isTiffToJpg) {
      await ensureTiffWasmInitialized();
    } else if (route.isIcoToPng || route.isPngToIco) {
      await ensureIcoWasmInitialized();
    } else if (route.isTgaToPng) {
      await ensureTgaWasmInitialized();
    } else if (route.isAvifToPng || route.isAvifToJpg) {
      await ensureAvifWasmInitialized();
    } else if (route.isAvifEncode) {
      await ensureAvifEncodeWasmInitialized();
    } else if (route.isSvgToPng || route.isSvgToJpg) {
      await ensureSvgWasmInitialized();
    } else if (route.isOptimize) {
      await ensureOptimizeWasmInitialized();
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

  const sessionLimit =
    req.effectiveMaxInputBytes != null && req.effectiveMaxInputBytes > 0
      ? req.effectiveMaxInputBytes
      : SOFT_LIMIT_BYTES;
  applyRiskMode(route, req.riskModeEnabled === true);
  applySessionInputLimit(route, sessionLimit);

  if (req.enableResultCache && (req.cacheMaxEntries ?? 0) > 0) {
    resultCache.configure({ maxEntries: req.cacheMaxEntries });
  }

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

      const outputSize = runSizeEstimate(route, input, opts, req.alphaHint);
      return { id: req.id, ok: true, purpose: "estimate", outputSize, cacheStored: false };
    }

    const result = runFullEncode(route, input, opts);
    const outputSize = result.byteLength;
    const output = result.buffer.slice(
      result.byteOffset,
      result.byteOffset + outputSize
    ) as ArrayBuffer;

    if (
      isTransmute &&
      req.enableResultCache &&
      req.fingerprint &&
      (req.cacheMaxOutputBytes ?? 0) > 0 &&
      (req.cacheMaxEntries ?? 0) > 0
    ) {
      resultCache.set(
        {
          fingerprint: req.fingerprint,
          bytes: output,
          outputSize,
          mime,
          extension,
          createdAt: Date.now(),
        },
        req.cacheMaxOutputBytes ?? 0
      );
    }

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
  } finally {
    applyRiskMode(route, false);
    applySessionInputLimit(route, SOFT_LIMIT_BYTES);
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
  if (req.purpose === "purge") {
    pipeline = pipeline.then(() => {
      postResponse(purgeWorkerState(req.id));
    });
    return;
  }
  pipeline = pipeline.then(() => dispatch(req));
};

self.addEventListener("pagehide", () => {
  resultCache.clear();
});

Promise.all([ensureJpgWasmInitialized(), ensurePngWasmInitialized()]).catch((err) => {
  console.error("Worker: Wasm initialization failed", err);
});
