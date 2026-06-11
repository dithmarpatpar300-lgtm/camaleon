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
