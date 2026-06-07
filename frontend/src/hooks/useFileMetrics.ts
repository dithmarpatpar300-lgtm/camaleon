"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TransmutationModule, TransmutationOptions } from "@/workers/types";
import { computeSizeDelta, type SizeDelta } from "@/lib/format/metrics";
import type { ResourceProfile } from "@/lib/device/resource-profile";

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
  profile: ResourceProfile;
};

type FileMetrics = {
  originalSize: number;
  estimatedSize: number | null;
  estimating: boolean;
  estimateDelta: SizeDelta | null;
  finalDelta: SizeDelta | null;
  setFinalSize: (bytes: number) => void;
  resetMetrics: () => void;
  requestEstimate: () => void;
};

const estimateInputCache = new WeakMap<File, ArrayBuffer>();

async function getEstimateBuffer(file: File): Promise<ArrayBuffer> {
  const cached = estimateInputCache.get(file);
  if (cached) return cached.slice(0);
  const buf = await file.arrayBuffer();
  estimateInputCache.set(file, buf);
  return buf.slice(0);
}

export function useFileMetrics({
  file, module, options, ready, estimate, profile,
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
    if (typeof document !== "undefined" && document.hidden) return;

    estimateIdRef.current++;
    const thisId = estimateIdRef.current;
    setEstimating(true);
    try {
      const buf = await getEstimateBuffer(file);
      if (thisId !== estimateIdRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;

      const size = await estimate(module, buf, options);
      if (thisId !== estimateIdRef.current) return;

      setEstimatedSize(size);
    } catch (err) {
      if (err instanceof Error && err.message === "superseded") return;
    } finally {
      if (thisId === estimateIdRef.current) {
        setEstimating(false);
      }
    }
  }, [file, ready, module, options, estimate]);

  const requestEstimate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runEstimate();
  }, [runEstimate]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!file || !ready) return;
    if (!profile.autoEstimate) return;
    if (typeof document !== "undefined" && document.hidden) return;

    timerRef.current = setTimeout(runEstimate, profile.debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [file, ready, options, runEstimate, profile.debounceMs, profile.autoEstimate]);

  useEffect(() => {
    if (!file || !ready || !profile.autoEstimate) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runEstimate, profile.debounceMs);
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [file, ready, profile.autoEstimate, profile.debounceMs, runEstimate]);

  const setFinalSize = useCallback(
    (bytes: number) => setFinalDelta(computeSizeDelta(originalSize, bytes)),
    [originalSize]
  );

  const resetMetrics = useCallback(() => {
    setEstimatedSize(null);
    setEstimating(false);
    setFinalDelta(null);
    estimateIdRef.current++;
  }, []);

  return {
    originalSize, estimatedSize, estimating, estimateDelta, finalDelta,
    setFinalSize, resetMetrics, requestEstimate,
  };
}
