"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TransmutationModule, TransmutationOptions } from "@/workers/types";
import { computeSizeDelta, type SizeDelta } from "@/lib/format/metrics";

type EstimateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions
) => Promise<number>;

type UseFileMetricsArgs = {
  file: File | null;
  module: TransmutationModule;
  options: TransmutationOptions;
  ready: boolean;
  estimate: EstimateFn;
  debounceMs?: number;
};

type FileMetrics = {
  originalSize: number;
  estimatedSize: number | null;
  estimating: boolean;
  estimateDelta: SizeDelta | null;
  finalDelta: SizeDelta | null;
  setFinalSize: (bytes: number) => void;
  resetMetrics: () => void;
};

export function useFileMetrics({
  file,
  module,
  options,
  ready,
  estimate,
  debounceMs = 400,
}: UseFileMetricsArgs): FileMetrics {
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [finalDelta, setFinalDelta] = useState<SizeDelta | null>(null);
  const estimateIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const originalSize = file?.size ?? 0;

  useEffect(() => {
    setEstimatedSize(null);
    setFinalDelta(null);
    estimateIdRef.current++;
  }, [file]);

  const estimateDelta =
    estimatedSize != null
      ? computeSizeDelta(originalSize, estimatedSize)
      : null;

  const runEstimate = useCallback(async () => {
    if (!file || !ready) return;

    estimateIdRef.current++;
    const thisId = estimateIdRef.current;

    setEstimating(true);
    try {
      const buf = await file.arrayBuffer();
      if (thisId !== estimateIdRef.current) return;

      const size = await estimate(module, buf, options);
      if (thisId !== estimateIdRef.current) return;

      setEstimatedSize(size);
    } catch {
      // estimate failed silently — user still sees the real result
    } finally {
      if (thisId === estimateIdRef.current) {
        setEstimating(false);
      }
    }
  }, [file, ready, module, options, estimate]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!file || !ready) return;

    timerRef.current = setTimeout(runEstimate, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [file, ready, options, debounceMs, runEstimate]);

  const setFinalSize = useCallback(
    (bytes: number) => {
      setFinalDelta(computeSizeDelta(originalSize, bytes));
    },
    [originalSize]
  );

  const resetMetrics = useCallback(() => {
    setEstimatedSize(null);
    setEstimating(false);
    setFinalDelta(null);
    estimateIdRef.current++;
  }, []);

  return {
    originalSize,
    estimatedSize,
    estimating,
    estimateDelta,
    finalDelta,
    setFinalSize,
    resetMetrics,
  };
}
