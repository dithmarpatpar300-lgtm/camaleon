import { importWasmGlue } from "@/lib/wasm/load-glue";

export type TgaMeta = {
  width: number;
  height: number;
  pixelDepth: number;
  isRle: boolean;
  isColorMapped: boolean;
  hasAlphaChannel: boolean;
  isRgb555: boolean;
  orientation: string;
};

type TgaWasmModule = {
  default: () => Promise<void>;
  inspect_tga_meta: (input: Uint8Array) => TgaMetaHandle;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
};

type TgaMetaHandle = {
  width: number;
  height: number;
  pixel_depth: number;
  is_rle: boolean;
  is_color_mapped: boolean;
  has_alpha_channel: boolean;
  is_rgb555: boolean;
  orientation: string;
};

let initPromise: Promise<TgaWasmModule> | null = null;

async function loadTgaWasm(): Promise<TgaWasmModule> {
  const module = (await importWasmGlue("transmutador_tga")) as TgaWasmModule;
  await module.default();
  return module;
}

export async function ensureTgaWasm(): Promise<TgaWasmModule> {
  if (!initPromise) initPromise = loadTgaWasm();
  return initPromise;
}

export async function inspectTgaMeta(bytes: Uint8Array): Promise<TgaMeta> {
  const wasm = await ensureTgaWasm();
  const meta = wasm.inspect_tga_meta(bytes);
  return {
    width: meta.width,
    height: meta.height,
    pixelDepth: meta.pixel_depth,
    isRle: meta.is_rle,
    isColorMapped: meta.is_color_mapped,
    hasAlphaChannel: meta.has_alpha_channel,
    isRgb555: meta.is_rgb555,
    orientation: meta.orientation,
  };
}

export function formatTgaBitDepthLabel(meta: TgaMeta): string {
  const base = meta.isRgb555 ? "16-bit RGB" : `${meta.pixelDepth}-bit`;
  return meta.isRle ? `${base} · RLE` : base;
}

export async function setTgaSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureTgaWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetTgaSessionInputLimit(): Promise<void> {
  const wasm = await ensureTgaWasm();
  wasm.reset_session_input_limit?.();
}
