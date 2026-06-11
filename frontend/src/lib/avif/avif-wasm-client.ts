import { importWasmGlue } from "@/lib/wasm/load-glue";

export type AvifMeta = {
  width: number;
  height: number;
  bitDepth: number;
  hasAlphaChannel: boolean;
  isSequence: boolean;
  frameCount: number;
  lossless: boolean;
};

type AvifWasmModule = {
  default: () => Promise<void>;
  inspect_avif_meta: (input: Uint8Array) => AvifMetaHandle;
  open_avif_session: (input: Uint8Array) => AvifSessionHandle;
  open_avif_session_with_progress: (
    input: Uint8Array,
    onProgress: (current: number, total: number) => void
  ) => AvifSessionHandle;
  decode_avif_preview_png: (input: Uint8Array, frameIndex: number) => Uint8Array;
  transmutar_avif_a_png_with_compression: (
    input: Uint8Array,
    compression: number,
    frameIndex: number
  ) => Uint8Array;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
};

type AvifMetaHandle = {
  width: number;
  height: number;
  bit_depth: number;
  has_alpha_channel: boolean;
  is_sequence: boolean;
  frame_count: number;
  lossless: boolean;
};

export type AvifSessionHandle = {
  frame_count: number;
  width: number;
  height: number;
  is_animated: boolean;
  frame_rgba: (frameIndex: number) => Uint8Array;
  free: () => void;
};

let initPromise: Promise<AvifWasmModule> | null = null;

async function loadAvifWasm(): Promise<AvifWasmModule> {
  const module = (await importWasmGlue("transmutador_avif")) as AvifWasmModule;
  await module.default();
  return module;
}

export async function ensureAvifWasm(): Promise<AvifWasmModule> {
  if (!initPromise) initPromise = loadAvifWasm();
  return initPromise;
}

export async function inspectAvifMeta(bytes: Uint8Array): Promise<AvifMeta> {
  const wasm = await ensureAvifWasm();
  const meta = wasm.inspect_avif_meta(bytes);
  return {
    width: meta.width,
    height: meta.height,
    bitDepth: meta.bit_depth,
    hasAlphaChannel: meta.has_alpha_channel,
    isSequence: meta.is_sequence,
    frameCount: meta.frame_count,
    lossless: meta.lossless,
  };
}

export async function openAvifSession(bytes: Uint8Array): Promise<AvifSessionHandle> {
  const wasm = await ensureAvifWasm();
  return wasm.open_avif_session(bytes);
}

export async function openAvifSessionWithProgress(
  bytes: Uint8Array,
  onFrame: (current: number, total: number) => void
): Promise<AvifSessionHandle> {
  const wasm = await ensureAvifWasm();
  return wasm.open_avif_session_with_progress(bytes, (current, total) => {
    onFrame(current, total);
  });
}

export function formatAvifBitDepthLabel(meta: AvifMeta): string {
  const base = `${meta.bitDepth}-bit`;
  return meta.lossless ? `${base} · lossless AVIF` : base;
}

export async function setAvifSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureAvifWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetAvifSessionInputLimit(): Promise<void> {
  const wasm = await ensureAvifWasm();
  wasm.reset_session_input_limit?.();
}
