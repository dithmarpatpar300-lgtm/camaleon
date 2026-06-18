import { importWasmGlue } from "@/lib/wasm/load-glue";

export type SvgMeta = {
  intrinsicWidth: number;
  intrinsicHeight: number;
  hasViewBox: boolean;
  hasText: boolean;
  hasFilters: boolean;
  hasExternalRefs: boolean;
  embeddedRasterCount: number;
};

type SvgMetaHandle = {
  intrinsic_width: number;
  intrinsic_height: number;
  has_view_box: boolean;
  has_text: boolean;
  has_filters: boolean;
  has_external_refs: boolean;
  embedded_raster_count: number;
};

type SvgWasmModule = {
  default: () => Promise<void>;
  inspect_svg_meta: (input: Uint8Array) => SvgMetaHandle;
  transmutar_svg_a_png: (
    input: Uint8Array,
    out_w: number,
    out_h: number,
    compression: number
  ) => Uint8Array;
  estimate_svg_to_png_size: (
    input: Uint8Array,
    out_w: number,
    out_h: number,
    compression: number
  ) => number;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
  assess_svg_meaningful_alpha: (input: Uint8Array) => boolean;
};

let initPromise: Promise<SvgWasmModule> | null = null;

async function loadSvgWasm(): Promise<SvgWasmModule> {
  const module = (await importWasmGlue("transmutador_svg")) as SvgWasmModule;
  await module.default();
  return module;
}

export async function ensureSvgWasm(): Promise<SvgWasmModule> {
  if (!initPromise) initPromise = loadSvgWasm();
  return initPromise;
}

function mapSvgMeta(meta: SvgMetaHandle): SvgMeta {
  return {
    intrinsicWidth: meta.intrinsic_width,
    intrinsicHeight: meta.intrinsic_height,
    hasViewBox: meta.has_view_box,
    hasText: meta.has_text,
    hasFilters: meta.has_filters,
    hasExternalRefs: meta.has_external_refs,
    embeddedRasterCount: meta.embedded_raster_count,
  };
}

export async function inspectSvgMeta(bytes: Uint8Array): Promise<SvgMeta> {
  const wasm = await ensureSvgWasm();
  return mapSvgMeta(wasm.inspect_svg_meta(bytes));
}

export function formatSvgBitDepthLabel(meta: SvgMeta): string {
  const w = Math.round(meta.intrinsicWidth);
  const h = Math.round(meta.intrinsicHeight);
  return `vector · ${w}×${h}`;
}

export async function setSvgSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureSvgWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetSvgSessionInputLimit(): Promise<void> {
  const wasm = await ensureSvgWasm();
  wasm.reset_session_input_limit?.();
}
