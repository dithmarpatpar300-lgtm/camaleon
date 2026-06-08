import { importWasmGlue } from "@/lib/wasm/load-glue";

export type GifMeta = {
  frameCount: number;
  width: number;
  height: number;
  isAnimated: boolean;
};

type AlphaAssessmentHandle = {
  has_alpha_channel: boolean;
  has_meaningful_alpha: boolean;
  confidence: number;
};

type GifWasmModule = {
  default: () => Promise<void>;
  inspect_gif_meta: (input: Uint8Array) => GifMetaHandle;
  open_gif_session: (input: Uint8Array) => GifSessionHandle;
  open_gif_session_with_progress: (
    input: Uint8Array,
    onProgress: (current: number, total: number) => void
  ) => GifSessionHandle;
  render_gif_frame_preview_png: (input: Uint8Array, frameIndex: number) => Uint8Array;
  assess_alpha: (input: Uint8Array) => AlphaAssessmentHandle;
  set_session_input_limit?: (maxBytes: number) => void;
  reset_session_input_limit?: () => void;
};

type GifMetaHandle = {
  frame_count: number;
  width: number;
  height: number;
  is_animated: boolean;
};

export type GifSessionHandle = {
  frame_count: number;
  width: number;
  height: number;
  is_animated: boolean;
  frame_rgba: (frameIndex: number) => Uint8Array;
  free: () => void;
};

let initPromise: Promise<GifWasmModule> | null = null;

async function loadGifWasm(): Promise<GifWasmModule> {
  const module = (await importWasmGlue("transmutador_gif")) as GifWasmModule;
  await module.default();
  return module;
}

export async function ensureGifWasm(): Promise<GifWasmModule> {
  if (!initPromise) initPromise = loadGifWasm();
  return initPromise;
}

export async function inspectGifMeta(bytes: Uint8Array): Promise<GifMeta> {
  const wasm = await ensureGifWasm();
  const meta = wasm.inspect_gif_meta(bytes);
  return {
    frameCount: meta.frame_count,
    width: meta.width,
    height: meta.height,
    isAnimated: meta.is_animated,
  };
}

export async function openGifSession(bytes: Uint8Array): Promise<GifSessionHandle> {
  const wasm = await ensureGifWasm();
  return wasm.open_gif_session(bytes);
}

export async function openGifSessionWithProgress(
  bytes: Uint8Array,
  onFrame: (current: number) => void
): Promise<GifSessionHandle> {
  const wasm = await ensureGifWasm();
  return wasm.open_gif_session_with_progress(bytes, (current) => {
    onFrame(current);
  });
}

export function drawRgbaToCanvas(
  canvas: HTMLCanvasElement,
  rgba: Uint8Array,
  width: number,
  height: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pixels = new Uint8ClampedArray(rgba.length);
  pixels.set(rgba);
  const imageData = new ImageData(pixels, width, height);
  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(imageData, 0, 0);
}

export async function renderGifFramePreviewPng(
  bytes: Uint8Array,
  frameIndex: number
): Promise<Uint8Array> {
  const wasm = await ensureGifWasm();
  return wasm.render_gif_frame_preview_png(bytes, frameIndex);
}

export async function setGifSessionInputLimit(maxBytes: number): Promise<void> {
  const wasm = await ensureGifWasm();
  wasm.set_session_input_limit?.(maxBytes);
}

export async function resetGifSessionInputLimit(): Promise<void> {
  const wasm = await ensureGifWasm();
  wasm.reset_session_input_limit?.();
}
