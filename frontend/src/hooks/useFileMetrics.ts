"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import type {
  EncodeSource,
  OutputExtension,
  TransmutationModule,
  TransmutationOptions,
} from "@/workers/types";
import { computeSizeDelta, type SizeDelta } from "@/lib/format/metrics";
import type { ResourceProfile } from "@/lib/device/resource-profile";
import {
  buildFileIdentity,
  buildTransmuteFingerprint,
} from "@/lib/transmutation/fingerprint";
import type { WorkerRequestMeta } from "@/workers/types";

type UseFileMetricsArgs = {
  file: File | null;
  module: TransmutationModule;
  outputExtension: OutputExtension;
  encodeSource?: EncodeSource;
  options: TransmutationOptions;
  ready: boolean;
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
  cacheWarm: boolean;
  transmuteMeta: WorkerRequestMeta | undefined;
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
  file, module, outputExtension, encodeSource, options, ready, profile,
}: UseFileMetricsArgs): FileMetrics {
  const { estimate } = useTransmutationWorker();
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [finalDelta, setFinalDelta] = useState<SizeDelta | null>(null);
  const [cachedFingerprint, setCachedFingerprint] = useState<string | null>(null);
  const estimateIdRef = useRef(0);
  const estimateInFlightRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const originalSize = file?.size ?? 0;

  const fingerprint = useMemo(
    () =>
      file
        ? buildTransmuteFingerprint(module, file, options, outputExtension, encodeSource)
        : null,
    [file, module, options, outputExtension, encodeSource]
  );

  const cacheWarm =
    fingerprint !== null && cachedFingerprint === fingerprint;

  const fileIdentity = useMemo(
    () => (file ? buildFileIdentity(file) : null),
    [file]
  );

  const transmuteMeta = useMemo((): WorkerRequestMeta | undefined => {
    if (!file || !fingerprint || !fileIdentity) return undefined;
    return {
      fingerprint,
      fileIdentity,
      enableResultCache: profile.enableResultCache,
      cacheMaxOutputBytes: profile.cacheMaxOutputBytes,
    };
  }, [
    file,
    fingerprint,
    fileIdentity,
    profile.enableResultCache,
    profile.cacheMaxOutputBytes,
  ]);

  useEffect(() => {
    setEstimatedSize(null);
    setFinalDelta(null);
    setCachedFingerprint(null);
    estimateIdRef.current++;
  }, [file]);

  const estimateDelta =
    estimatedSize != null
      ? computeSizeDelta(originalSize, estimatedSize)
      : null;

  const runEstimate = useCallback(async () => {
    if (!file || !ready || !transmuteMeta) return;
    if (typeof document !== "undefined" && document.hidden) return;

    estimateIdRef.current++;
    const thisId = estimateIdRef.current;
    estimateInFlightRef.current++;
    setEstimating(true);
    try {
      const buf = await getEstimateBuffer(file);
      if (thisId !== estimateIdRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;

      const result = await estimate(
        module,
        buf,
        options,
        transmuteMeta,
        outputExtension,
        encodeSource
      );
      if (thisId !== estimateIdRef.current) return;

      setEstimatedSize((prev) =>
        prev === result.outputSize ? prev : result.outputSize
      );
      if (result.cacheStored === true && fingerprint) {
        setCachedFingerprint((prev) =>
          prev === fingerprint ? prev : fingerprint
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message === "superseded") return;
    } finally {
      estimateInFlightRef.current = Math.max(0, estimateInFlightRef.current - 1);
      if (estimateInFlightRef.current === 0) {
        setEstimating(false);
      }
    }
  }, [file, ready, module, outputExtension, encodeSource, options, estimate, transmuteMeta, fingerprint]);

  const runEstimateRef = useRef(runEstimate);
  runEstimateRef.current = runEstimate;

  const requestEstimate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void runEstimateRef.current();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!file || !ready || !fingerprint) return;
    if (!profile.autoEstimate) return;
    if (typeof document !== "undefined" && document.hidden) return;

    estimateIdRef.current++;

    timerRef.current = setTimeout(() => {
      void runEstimateRef.current();
    }, profile.debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [file, ready, fingerprint, profile.debounceMs, profile.autoEstimate]);

  useEffect(() => {
    if (!file || !ready || !profile.autoEstimate) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void runEstimateRef.current();
      }, profile.debounceMs);
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [file, ready, profile.autoEstimate, profile.debounceMs]);

  const setFinalSize = useCallback(
    (bytes: number) => setFinalDelta(computeSizeDelta(originalSize, bytes)),
    [originalSize]
  );

  const resetMetrics = useCallback(() => {
    setEstimatedSize(null);
    setEstimating(false);
    setFinalDelta(null);
    setCachedFingerprint(null);
    estimateIdRef.current++;
  }, []);

  return {
    originalSize, estimatedSize, estimating, estimateDelta, finalDelta,
    setFinalSize, resetMetrics, requestEstimate, cacheWarm, transmuteMeta,
  };
}
