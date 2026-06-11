"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { drawRgbaToCanvas } from "@/lib/gif/gif-wasm-client";
import {
  createCachedFrameFetcher,
  type FrameRgbaFetcher,
} from "./frame-rgba-cache";

export type { FrameRgbaFetcher };

type CoalescedPaintOptions = {
  /** LRU size for RGBA buffers already fetched this session (0 = disabled). */
  cacheSize?: number;
};

/**
 * Paints RGBA frames on a canvas without blocking rapid slider input.
 * Coalesces scrub events, skips stale paints, and never toggles loading UI.
 */
export function useCoalescedFramePaint(
  getFrameRgba: FrameRgbaFetcher,
  width: number,
  height: number,
  options: CoalescedPaintOptions = {}
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintGenRef = useRef(0);
  const pendingIndexRef = useRef<number | null>(null);
  const pumpRunningRef = useRef(false);

  const cacheSize = options.cacheSize ?? 16;
  const cachedFetch = useMemo(
    () =>
      cacheSize > 0
        ? createCachedFrameFetcher(getFrameRgba, cacheSize)
        : getFrameRgba,
    [getFrameRgba, cacheSize]
  );

  const paintOnce = useCallback(
    async (index: number, gen: number) => {
      try {
        const rgba = await cachedFetch(index);
        if (gen !== paintGenRef.current) return;

        const canvas = canvasRef.current;
        if (canvas) {
          drawRgbaToCanvas(canvas, rgba, width, height);
        }
      } catch {
        // stale index / teardown
      }
    },
    [cachedFetch, height, width]
  );

  const drainPaintQueue = useCallback(async () => {
    if (pumpRunningRef.current) return;
    pumpRunningRef.current = true;

    while (pendingIndexRef.current != null) {
      const index = pendingIndexRef.current;
      pendingIndexRef.current = null;
      const gen = ++paintGenRef.current;
      await paintOnce(index, gen);
    }

    pumpRunningRef.current = false;
  }, [paintOnce]);

  const schedulePaint = useCallback(
    (index: number) => {
      pendingIndexRef.current = index;
      void drainPaintQueue();
    },
    [drainPaintQueue]
  );

  useEffect(() => {
    return () => {
      paintGenRef.current += 1;
      pendingIndexRef.current = null;
    };
  }, []);

  return { canvasRef, schedulePaint };
}
