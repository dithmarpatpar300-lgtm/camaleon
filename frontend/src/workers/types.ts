import type { WasmLoadHints } from "@/lib/device/device-capability";

export type TransmutationModule =
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

export type OutputExtension = "png" | "jpg" | "webp" | "ico" | "avif";

/** Discriminates PNG vs JPEG source when module is `transmutador_encode`. */
export type EncodeSource = "png" | "jpeg";

export type RgbColor = { r: number; g: number; b: number };

export type TransmutationOptions = {
  quality?: number;
  compression?: number;
  background?: RgbColor;
  /** Composited GIF frame to export (0-based). */
  frameIndex?: number;
  /** TIFF IFD page to export (0-based). */
  pageIndex?: number;
  /** ICO/CUR directory entry to export (0-based). */
  entryIndex?: number;
  /** PNG → ICO target edge length (16, 32, 48, or 256). */
  iconSize?: number;
  /** AVIF encode speed (ravif 1–10; higher = faster). */
  speed?: number;
  /** SVG raster export scale preset (percent or max-edge px). */
  outputScale?: number;
  /** Tier 4a resize — output scale as percent of source dimensions (10–100). */
  resizePercent?: number;
  /** Tier 4a resize — interpolation filter code (0=Nearest, 1=Triangle, 2=CatmullRom, 3=Gaussian, 4=Lanczos3). */
  resizeFilter?: number;
  /** Tier 4a compress — JPEG chroma subsampling (0=Auto/4:2:0, 1=4:4:4, 2=4:2:2). */
  subsampling?: number;
  /** Computed SVG raster width (sent to Wasm). */
  outputWidth?: number;
  /** Computed SVG raster height (sent to Wasm). */
  outputHeight?: number;
};

export type WorkerPurpose = "transmute" | "estimate" | "purge";

/** Prepare-time semantic alpha passed into estimate to skip redundant raster scans (E0.5). */
export type WorkerAlphaHint = {
  hasMeaningfulAlpha: boolean;
  confidence: "none" | "structural" | "sampled" | "full";
};

export type WorkerRequestMeta = {
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
  cacheMaxEntries?: number;
  effectiveMaxInputBytes?: number;
  userConsentedOversize?: boolean;
  alphaHint?: WorkerAlphaHint | null;
  riskModeEnabled?: boolean;
  engineLoadHints?: WasmLoadHints;
};

export type WorkerRequest = {
  id: string;
  module?: TransmutationModule;
  bytes?: ArrayBuffer;
  options?: TransmutationOptions;
  /** Required when module is transmutador_webp (png vs jpg). */
  outputExtension?: OutputExtension;
  /** Required when module is `transmutador_encode` or `transmutador_avif_encode`. */
  encodeSource?: EncodeSource;
  purpose?: WorkerPurpose;
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
  cacheMaxEntries?: number;
  effectiveMaxInputBytes?: number;
  userConsentedOversize?: boolean;
  alphaHint?: WorkerAlphaHint | null;
  riskModeEnabled?: boolean;
  engineLoadHints?: WasmLoadHints;
};

export type WorkerResponseSuccess = {
  id: string;
  ok: true;
  purpose: WorkerPurpose;
  outputSize: number;
  bytes?: ArrayBuffer;
  mime?: string;
  extension?: string;
  cacheStored?: boolean;
  cacheHit?: boolean;
};

export type WorkerResponseError = {
  id: string;
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerResponseSuccess | WorkerResponseError;
