import { importWasmGlue } from "@/lib/wasm/load-glue";

export type BmpMeta = {
  width: number;
  height: number;
  bitCount: number;
  compression: number;
  hasMeaningfulAlpha: boolean;
};

type BmpWasmModule = {
  default: () => Promise<void>;
  inspect_bmp_meta: (input: Uint8Array) => BmpMetaHandle;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
};

type BmpMetaHandle = {
  width: number;
  height: number;
  bit_count: number;
  compression: number;
  has_meaningful_alpha: boolean;
};

let initPromise: Promise<BmpWasmModule> | null = null;

async function loadBmpWasm(): Promise<BmpWasmModule> {
  const module = (await importWasmGlue("transmutador_bmp")) as BmpWasmModule;
  await module.default();
  return module;
}

export async function ensureBmpWasm(): Promise<BmpWasmModule> {
  if (!initPromise) initPromise = loadBmpWasm();
  return initPromise;
}

export async function inspectBmpMeta(bytes: Uint8Array): Promise<BmpMeta> {
  const wasm = await ensureBmpWasm();
  const meta = wasm.inspect_bmp_meta(bytes);
  return {
    width: meta.width,
    height: meta.height,
    bitCount: meta.bit_count,
    compression: meta.compression,
    hasMeaningfulAlpha: meta.has_meaningful_alpha,
  };
}

export function formatBmpMetaLine(meta: BmpMeta): string {
  return `${meta.width} × ${meta.height} · ${meta.bitCount}-bit`;
}

export async function setBmpSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureBmpWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetBmpSessionInputLimit(): Promise<void> {
  const wasm = await ensureBmpWasm();
  wasm.reset_session_input_limit?.();
}
