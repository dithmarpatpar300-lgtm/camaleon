type OpenedMessage = {
  id: string;
  ok: true;
  type: "opened";
  width: number;
  height: number;
  frameCount: number;
};

type ProgressMessage = {
  id: string;
  ok: true;
  type: "progress";
  current: number;
  total: number;
};

type FrameMessage = {
  id: string;
  ok: true;
  type: "frame";
  index: number;
  rgba: Uint8Array;
  width: number;
  height: number;
};

type ErrorMessage = { id: string; ok: false; error: string };

type WorkerMessage = OpenedMessage | ProgressMessage | FrameMessage | ErrorMessage;

let nextId = 0;

function makeId(): string {
  nextId += 1;
  return `fp-${nextId}`;
}

export type AvifFramePreviewSession = {
  width: number;
  height: number;
  frameCount: number;
  getFrameRgba: (index: number) => Promise<Uint8Array>;
};

export type FramePreviewController = {
  /** Resolves once all frames are decoded and scrubbing is O(1). */
  ready: Promise<AvifFramePreviewSession>;
  /** Terminates the worker immediately, even mid-decode. Idempotent. */
  close: () => void;
};

export type CreateAvifPreviewOptions = {
  /** Transferred to the worker — pass a copy if the caller still needs the buffer. */
  bytes: Uint8Array;
  maxInputBytes?: number;
  onProgress?: (current: number, total: number) => void;
};

export function createAvifFramePreview(
  options: CreateAvifPreviewOptions
): FramePreviewController {
  const worker = new Worker(new URL("../../workers/frame-preview.worker.ts", import.meta.url));
  const openId = makeId();
  let closed = false;

  const pendingFrames = new Map<
    string,
    { resolve: (rgba: Uint8Array) => void; reject: (err: Error) => void; index: number }
  >();

  let resolveReady: ((session: AvifFramePreviewSession) => void) | null = null;
  let rejectReady: ((err: Error) => void) | null = null;

  const ready = new Promise<AvifFramePreviewSession>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const failAll = (err: Error): void => {
    rejectReady?.(err);
    resolveReady = null;
    rejectReady = null;
    for (const pending of pendingFrames.values()) {
      pending.reject(err);
    }
    pendingFrames.clear();
  };

  const close = (): void => {
    if (closed) return;
    closed = true;
    failAll(new Error("Session closed"));
    worker.terminate();
  };

  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const msg = event.data;

    if (msg.id === openId) {
      if (!msg.ok) {
        failAll(new Error(msg.error));
        worker.terminate();
        return;
      }
      if (msg.type === "progress") {
        if (!closed) options.onProgress?.(msg.current, msg.total);
        return;
      }
      if (msg.type === "opened" && resolveReady) {
        const resolve = resolveReady;
        resolveReady = null;
        rejectReady = null;
        resolve({
          width: msg.width,
          height: msg.height,
          frameCount: msg.frameCount,
          getFrameRgba: (index: number) =>
            new Promise<Uint8Array>((res, rej) => {
              if (closed) {
                rej(new Error("Session closed"));
                return;
              }
              const frameId = makeId();
              pendingFrames.set(frameId, { resolve: res, reject: rej, index });
              worker.postMessage({ id: frameId, type: "getFrame", index });
            }),
        });
      }
      return;
    }

    const pending = pendingFrames.get(msg.id);
    if (!pending) return;
    pendingFrames.delete(msg.id);

    if (!msg.ok) {
      pending.reject(new Error(msg.error));
      return;
    }
    if (msg.type === "frame" && msg.index === pending.index) {
      pending.resolve(msg.rgba);
    }
  };

  worker.onerror = () => {
    failAll(new Error("Frame preview worker failed"));
    worker.terminate();
  };

  worker.postMessage(
    {
      id: openId,
      type: "openAvif",
      bytes: options.bytes,
      maxInputBytes: options.maxInputBytes,
    },
    [options.bytes.buffer]
  );

  // Swallow rejection when nobody awaited ready before close().
  ready.catch(() => {});

  return { ready, close };
}
