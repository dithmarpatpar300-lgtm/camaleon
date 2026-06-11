/// <reference lib="webworker" />

import { importWasmGlue, wasmExport, type WasmGlueModule } from "@/lib/wasm/load-glue";

type AvifSessionHandle = {
  frame_count: number;
  width: number;
  height: number;
  frame_rgba: (frameIndex: number) => Uint8Array;
  free?: () => void;
};

type OpenAvifRequest = {
  id: string;
  type: "openAvif";
  bytes: Uint8Array;
  maxInputBytes?: number;
};

type GetFrameRequest = {
  id: string;
  type: "getFrame";
  index: number;
};

type CloseRequest = {
  id: string;
  type: "close";
};

type WorkerRequest = OpenAvifRequest | GetFrameRequest | CloseRequest;

type WorkerResponse =
  | { id: string; ok: true; type: "opened"; width: number; height: number; frameCount: number }
  | { id: string; ok: true; type: "progress"; current: number; total: number }
  | {
      id: string;
      ok: true;
      type: "frame";
      index: number;
      rgba: Uint8Array;
      width: number;
      height: number;
    }
  | { id: string; ok: false; error: string };

let avifModule: WasmGlueModule | null = null;
let avifSession: AvifSessionHandle | null = null;
let sessionWidth = 0;
let sessionHeight = 0;

let pendingFrame: {
  id: string;
  index: number;
} | null = null;
let framePumpRunning = false;

async function ensureAvifModule(): Promise<WasmGlueModule> {
  if (avifModule) return avifModule;
  const module = await importWasmGlue("transmutador_avif");
  await module.default();
  avifModule = module;
  return module;
}

function closeSession(): void {
  avifSession?.free?.();
  avifSession = null;
  sessionWidth = 0;
  sessionHeight = 0;
  pendingFrame = null;
}

async function handleOpenAvif(req: OpenAvifRequest): Promise<WorkerResponse> {
  closeSession();
  const module = await ensureAvifModule();
  const setLimit = module.set_session_input_limit as ((n: number) => void) | undefined;
  if (req.maxInputBytes != null && req.maxInputBytes > 0) {
    setLimit?.(req.maxInputBytes);
  }

  const openWithProgress = wasmExport<
    (
      input: Uint8Array,
      onProgress: (current: number, total: number) => void
    ) => AvifSessionHandle
  >(module, "open_avif_session_with_progress");

  avifSession = openWithProgress(req.bytes, (current, total) => {
    const progress: WorkerResponse = {
      id: req.id,
      ok: true,
      type: "progress",
      current,
      total,
    };
    self.postMessage(progress);
  });

  sessionWidth = avifSession.width;
  sessionHeight = avifSession.height;

  return {
    id: req.id,
    ok: true,
    type: "opened",
    width: sessionWidth,
    height: sessionHeight,
    frameCount: avifSession.frame_count,
  };
}

function pumpFrameQueue(): void {
  if (framePumpRunning || !avifSession || !pendingFrame) return;
  framePumpRunning = true;

  const { id, index } = pendingFrame;
  pendingFrame = null;

  try {
    const rgba = avifSession.frame_rgba(index);
    const response: WorkerResponse = {
      id,
      ok: true,
      type: "frame",
      index,
      rgba,
      width: sessionWidth,
      height: sessionHeight,
    };
    self.postMessage(response, { transfer: [rgba.buffer] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "Frame decode failed");
    self.postMessage({ id, ok: false, error: message } satisfies WorkerResponse);
  } finally {
    framePumpRunning = false;
    if (pendingFrame) pumpFrameQueue();
  }
}

function handleGetFrame(req: GetFrameRequest): void {
  if (!avifSession) {
    self.postMessage({
      id: req.id,
      ok: false,
      error: "AVIF preview session not ready",
    } satisfies WorkerResponse);
    return;
  }
  pendingFrame = { id: req.id, index: req.index };
  pumpFrameQueue();
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (req.type === "close") {
    closeSession();
    return;
  }

  if (req.type === "getFrame") {
    handleGetFrame(req);
    return;
  }

  void (async () => {
    try {
      const response = await handleOpenAvif(req);
      self.postMessage(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? "Open failed");
      self.postMessage({ id: req.id, ok: false, error: message } satisfies WorkerResponse);
    }
  })();
};

export {};
