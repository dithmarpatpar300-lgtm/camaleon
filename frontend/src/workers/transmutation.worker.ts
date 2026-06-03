import type { WorkerRequest, WorkerResponse } from "./types";

let initPromise: Promise<void> | null = null;
let transmutar: ((input: Uint8Array) => Uint8Array) | null = null;

async function initWasm(): Promise<void> {
  const module = await import(
    /* webpackIgnore: true */
    "/wasm/transmutador_jpg/transmutador_jpg.js"
  );

  await module.default();
  transmutar = module.transmutar_jpg_a_png;
}

function ensureWasmInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initWasm();
  }
  return initPromise;
}

async function handleRequest(req: WorkerRequest): Promise<WorkerResponse> {
  if (req.module !== "transmutador_jpg") {
    if (req.module === "transmutador_png") {
      return { id: req.id, ok: false, error: "Module not yet available" };
    }
    return {
      id: req.id,
      ok: false,
      error: `Unknown module: ${req.module}`,
    };
  }

  try {
    await ensureWasmInitialized();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Wasm initialization failed");
    return { id: req.id, ok: false, error: message };
  }

  if (!transmutar) {
    return { id: req.id, ok: false, error: "Wasm module not initialized" };
  }

  try {
    const input = new Uint8Array(req.bytes);
    const result = transmutar(input);

    const output = result.buffer.slice(
      result.byteOffset,
      result.byteOffset + result.byteLength
    ) as ArrayBuffer;

    return {
      id: req.id,
      ok: true,
      bytes: output,
      mime: "image/png",
      extension: "png",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown worker error");
    return { id: req.id, ok: false, error: message };
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const response = await handleRequest(e.data);
  if (response.ok) {
    self.postMessage(response, { transfer: [response.bytes] });
  } else {
    self.postMessage(response);
  }
};

ensureWasmInitialized().catch((err) => {
  console.error("Worker: Wasm initialization failed", err);
});
