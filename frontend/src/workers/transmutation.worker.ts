import type { WorkerRequest, WorkerResponse } from "./types";

type TransmutarFn = (input: Uint8Array) => Uint8Array;

let initJpgPromise: Promise<void> | null = null;
let transmutarJpg: TransmutarFn | null = null;

let initPngPromise: Promise<void> | null = null;
let transmutarPng: TransmutarFn | null = null;

async function initJpgWasm(): Promise<void> {
  const module = await import(
    /* webpackIgnore: true */
    "/wasm/transmutador_jpg/transmutador_jpg.js"
  );
  await module.default();
  transmutarJpg = module.transmutar_jpg_a_png;
}

async function initPngWasm(): Promise<void> {
  const module = await import(
    /* webpackIgnore: true */
    "/wasm/transmutador_png/transmutador_png.js"
  );
  await module.default();
  transmutarPng = module.transmutar_png_a_jpg;
}

function ensureJpgWasmInitialized(): Promise<void> {
  if (!initJpgPromise) {
    initJpgPromise = initJpgWasm();
  }
  return initJpgPromise;
}

function ensurePngWasmInitialized(): Promise<void> {
  if (!initPngPromise) {
    initPngPromise = initPngWasm();
  }
  return initPngPromise;
}

async function handleRequest(req: WorkerRequest): Promise<WorkerResponse> {
  if (req.module !== "transmutador_jpg" && req.module !== "transmutador_png") {
    return {
      id: req.id,
      ok: false,
      error: `Unknown module: ${req.module}`,
    };
  }

  const isJpg = req.module === "transmutador_jpg";
  const initPromise = isJpg ? ensureJpgWasmInitialized() : ensurePngWasmInitialized();

  try {
    await initPromise;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Wasm initialization failed");
    return { id: req.id, ok: false, error: message };
  }

  const transmutar = isJpg ? transmutarJpg : transmutarPng;

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

    const mime = isJpg ? "image/png" : "image/jpeg";
    const extension = isJpg ? "png" : "jpg";

    return {
      id: req.id,
      ok: true,
      bytes: output,
      mime,
      extension,
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

Promise.all([ensureJpgWasmInitialized(), ensurePngWasmInitialized()]).catch((err) => {
  console.error("Worker: Wasm initialization failed", err);
});
