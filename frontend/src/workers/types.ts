export type TransmutationModule = "transmutador_jpg" | "transmutador_png" | "transmutador_webp";

export type RgbColor = { r: number; g: number; b: number };

export type TransmutationOptions = {
  quality?: number;
  compression?: number;
  background?: RgbColor;
};

export type WorkerPurpose = "transmute" | "estimate";

export type WorkerRequestMeta = {
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
};

export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
  purpose?: WorkerPurpose;
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
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
