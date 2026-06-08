import { importWasmGlue } from "@/lib/wasm/load-glue";

export type TiffMeta = {
  pageCount: number;
  pageWidth: (pageIndex: number) => number;
  pageHeight: (pageIndex: number) => number;
  pageBitDepth: (pageIndex: number) => number;
  pageHasAlpha: (pageIndex: number) => boolean;
};

type TiffMetaHandle = {
  page_count: number;
  page_width: (pageIndex: number) => number;
  page_height: (pageIndex: number) => number;
  page_bit_depth: (pageIndex: number) => number;
  page_has_alpha: (pageIndex: number) => boolean;
};

type TiffWasmModule = {
  default: () => Promise<void>;
  inspect_tiff_meta: (input: Uint8Array) => TiffMetaHandle;
  render_tiff_page_preview_png: (input: Uint8Array, pageIndex: number) => Uint8Array;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
};

let initPromise: Promise<TiffWasmModule> | null = null;

async function loadTiffWasm(): Promise<TiffWasmModule> {
  const module = (await importWasmGlue("transmutador_tiff")) as TiffWasmModule;
  await module.default();
  return module;
}

export async function ensureTiffWasm(): Promise<TiffWasmModule> {
  if (!initPromise) initPromise = loadTiffWasm();
  return initPromise;
}

function wrapTiffMeta(handle: TiffMetaHandle): TiffMeta {
  return {
    pageCount: handle.page_count,
    pageWidth: (pageIndex) => handle.page_width(pageIndex),
    pageHeight: (pageIndex) => handle.page_height(pageIndex),
    pageBitDepth: (pageIndex) => handle.page_bit_depth(pageIndex),
    pageHasAlpha: (pageIndex) => handle.page_has_alpha(pageIndex),
  };
}

export async function inspectTiffMeta(bytes: Uint8Array): Promise<TiffMeta> {
  const wasm = await ensureTiffWasm();
  return wrapTiffMeta(wasm.inspect_tiff_meta(bytes));
}

export async function renderTiffPagePreviewPng(
  bytes: Uint8Array,
  pageIndex: number
): Promise<Uint8Array> {
  const wasm = await ensureTiffWasm();
  return wasm.render_tiff_page_preview_png(bytes, pageIndex);
}

export async function setTiffSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureTiffWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetTiffSessionInputLimit(): Promise<void> {
  const wasm = await ensureTiffWasm();
  wasm.reset_session_input_limit?.();
}

export function tiffMetaForPage(meta: TiffMeta, pageIndex: number) {
  return {
    width: meta.pageWidth(pageIndex),
    height: meta.pageHeight(pageIndex),
    bitDepthLabel: `${meta.pageBitDepth(pageIndex)}-bit`,
    pageCount: meta.pageCount,
  };
}
