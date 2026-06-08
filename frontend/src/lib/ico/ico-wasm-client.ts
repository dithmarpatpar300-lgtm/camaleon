import { importWasmGlue } from "@/lib/wasm/load-glue";

export type IcoMeta = {
  entryCount: number;
  defaultEntryIndex: number;
  isCursor: boolean;
  entryWidth: (entryIndex: number) => number;
  entryHeight: (entryIndex: number) => number;
  entryBitsPerPixel: (entryIndex: number) => number;
  entryIsPng: (entryIndex: number) => boolean;
  entryHasAlpha: (entryIndex: number) => boolean;
};

type IcoMetaHandle = {
  entry_count: number;
  default_entry_index: number;
  is_cursor: boolean;
  entry_width: (entryIndex: number) => number;
  entry_height: (entryIndex: number) => number;
  entry_bits_per_pixel: (entryIndex: number) => number;
  entry_is_png: (entryIndex: number) => boolean;
  entry_has_alpha: (entryIndex: number) => boolean;
};

type IcoWasmModule = {
  default: () => Promise<void>;
  inspect_ico_meta: (input: Uint8Array) => IcoMetaHandle;
  render_ico_entry_preview_png: (input: Uint8Array, entryIndex: number) => Uint8Array;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
};

let initPromise: Promise<IcoWasmModule> | null = null;

async function loadIcoWasm(): Promise<IcoWasmModule> {
  const module = (await importWasmGlue("transmutador_ico")) as IcoWasmModule;
  await module.default();
  return module;
}

export async function ensureIcoWasm(): Promise<IcoWasmModule> {
  if (!initPromise) initPromise = loadIcoWasm();
  return initPromise;
}

function wrapIcoMeta(handle: IcoMetaHandle): IcoMeta {
  return {
    entryCount: handle.entry_count,
    defaultEntryIndex: handle.default_entry_index,
    isCursor: handle.is_cursor,
    entryWidth: (entryIndex) => handle.entry_width(entryIndex),
    entryHeight: (entryIndex) => handle.entry_height(entryIndex),
    entryBitsPerPixel: (entryIndex) => handle.entry_bits_per_pixel(entryIndex),
    entryIsPng: (entryIndex) => handle.entry_is_png(entryIndex),
    entryHasAlpha: (entryIndex) => handle.entry_has_alpha(entryIndex),
  };
}

export async function inspectIcoMeta(bytes: Uint8Array): Promise<IcoMeta> {
  const wasm = await ensureIcoWasm();
  return wrapIcoMeta(wasm.inspect_ico_meta(bytes));
}

export async function renderIcoEntryPreviewPng(
  bytes: Uint8Array,
  entryIndex: number
): Promise<Uint8Array> {
  const wasm = await ensureIcoWasm();
  return wasm.render_ico_entry_preview_png(bytes, entryIndex);
}

export async function setIcoSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureIcoWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetIcoSessionInputLimit(): Promise<void> {
  const wasm = await ensureIcoWasm();
  wasm.reset_session_input_limit?.();
}

export function icoMetaForEntry(meta: IcoMeta, entryIndex: number) {
  const bpp = meta.entryBitsPerPixel(entryIndex);
  return {
    width: meta.entryWidth(entryIndex),
    height: meta.entryHeight(entryIndex),
    bitDepthLabel: bpp > 0 ? `${bpp}-bit` : "8-bit",
    entryCount: meta.entryCount,
  };
}
