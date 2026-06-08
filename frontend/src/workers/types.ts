export type TransmutationModule =
  | "transmutador_jpg"
  | "transmutador_png"
  | "transmutador_webp"
  | "transmutador_encode"
  | "transmutador_gif"
  | "transmutador_bmp";

export type OutputExtension = "png" | "jpg" | "webp";

/** Discriminates PNG vs JPEG source when module is `transmutador_encode`. */
export type EncodeSource = "png" | "jpeg";

export type RgbColor = { r: number; g: number; b: number };

export type TransmutationOptions = {
  quality?: number;
  compression?: number;
  background?: RgbColor;
  /** Composited GIF frame to export (0-based). */
  frameIndex?: number;
};

export type WorkerPurpose = "transmute" | "estimate";

export type WorkerRequestMeta = {
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
  effectiveMaxInputBytes?: number;
  userConsentedOversize?: boolean;
};

export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
  /** Required when module is transmutador_webp (png vs jpg). */
  outputExtension?: OutputExtension;
  /** Required when module is transmutador_encode — which encode export to call. */
  encodeSource?: EncodeSource;
  purpose?: WorkerPurpose;
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
  effectiveMaxInputBytes?: number;
  userConsentedOversize?: boolean;
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
