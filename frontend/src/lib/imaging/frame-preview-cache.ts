import {
  createAvifFramePreview,
  type AvifFramePreviewSession,
  type FramePreviewController,
} from "./frame-preview-client";

type ProgressListener = (current: number, total: number) => void;

type CacheEntry = {
  /** Identity key — the staged file's bytes object (must be referentially stable). */
  key: Uint8Array;
  controller: FramePreviewController;
  refs: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  lastProgress: { current: number; total: number } | null;
  listeners: Set<ProgressListener>;
};

/**
 * Single-entry session cache: decoded frames survive component remounts and
 * slider-driven re-renders, but die on Transmute / file change / idle TTL.
 */
let entry: CacheEntry | null = null;

/** Grace period after the last scrubber unmounts before frames are freed. */
const IDLE_TTL_MS = 45_000;

function destroyEntry(): void {
  if (!entry) return;
  if (entry.idleTimer != null) clearTimeout(entry.idleTimer);
  entry.listeners.clear();
  entry.controller.close();
  entry = null;
}

export type FramePreviewLease = {
  session: Promise<AvifFramePreviewSession>;
  release: () => void;
};

export type AcquireAvifPreviewOptions = {
  maxInputBytes?: number;
  onProgress?: ProgressListener;
};

export function acquireAvifFramePreview(
  key: Uint8Array,
  options: AcquireAvifPreviewOptions = {}
): FramePreviewLease {
  if (entry && entry.key !== key) {
    destroyEntry();
  }

  if (!entry) {
    const created: CacheEntry = {
      key,
      controller: null as unknown as FramePreviewController,
      refs: 0,
      idleTimer: null,
      lastProgress: null,
      listeners: new Set(),
    };
    created.controller = createAvifFramePreview({
      // Copy before transfer — the staged buffer must stay usable for transmute.
      bytes: key.slice(),
      maxInputBytes: options.maxInputBytes,
      onProgress: (current, total) => {
        created.lastProgress = { current, total };
        for (const listener of created.listeners) {
          listener(current, total);
        }
      },
    });
    entry = created;
  }

  const active = entry;
  if (active.idleTimer != null) {
    clearTimeout(active.idleTimer);
    active.idleTimer = null;
  }
  active.refs += 1;

  const listener = options.onProgress;
  if (listener) {
    active.listeners.add(listener);
    // Replay current progress so remounts never reset the counter to zero.
    if (active.lastProgress) {
      listener(active.lastProgress.current, active.lastProgress.total);
    }
  }

  let released = false;
  return {
    session: active.controller.ready,
    release: () => {
      if (released) return;
      released = true;
      if (listener) active.listeners.delete(listener);
      active.refs -= 1;
      if (active.refs <= 0 && entry === active) {
        active.idleTimer = setTimeout(() => {
          if (entry === active && active.refs <= 0) {
            destroyEntry();
          }
        }, IDLE_TTL_MS);
      }
    },
  };
}

/** Immediately frees the decoded frames (Transmute click, reset, route leave). */
export function releaseFramePreviewSessions(): void {
  destroyEntry();
}
