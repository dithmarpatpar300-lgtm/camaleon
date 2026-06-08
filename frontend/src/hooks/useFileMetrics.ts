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
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import {
  buildFileIdentity,
  buildTransmuteFingerprint,
} from "@/lib/transmutation/fingerprint";
import {
  effectiveSessionInputLimit,
  getHardLimitBytes,
  getLimitZone,
  needsOversizeConsent,
} from "@/lib/transmutation/limits";
import { localizeError } from "@/lib/i18n/errors";
import { useI18n } from "@/providers/I18nProvider";
import type { WorkerRequestMeta } from "@/workers/types";

type UseFileMetricsArgs = {
  file: File | null;
  module: TransmutationModule;
  outputExtension: OutputExtension;
  encodeSource?: EncodeSource;
  options: TransmutationOptions;
  ready: boolean;
  profile: ResourceProfile;
  deviceMemoryGb?: number;
  oversizeConsented: boolean;
  sourceMeta: SourceImageMeta | null;
  /** When true, suppresses the auto-estimate debounce (e.g. during entry animation). */
  holdEstimate?: boolean;
};

type FileMetrics = {
  originalSize: number;
  estimatedSize: number | null;
  estimating: boolean;
  estimateDelta: SizeDelta | null;
  estimateError: string | null;
  needsOversizeConsent: boolean;
  limitZone: ReturnType<typeof getLimitZone>;
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
  file,
  module,
  outputExtension,
  encodeSource,
  options,
  ready,
  profile,
  deviceMemoryGb,
  oversizeConsented,
  sourceMeta: _sourceMeta,
  holdEstimate = false,
}: UseFileMetricsArgs): FileMetrics {
  const { t } = useI18n();
  const { estimate } = useTransmutationWorker();
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [finalDelta, setFinalDelta] = useState<SizeDelta | null>(null);
  const [cachedFingerprint, setCachedFingerprint] = useState<string | null>(null);
  const estimateIdRef = useRef(0);
  const estimateInFlightRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const originalSize = file?.size ?? 0;
  const hardLimit = getHardLimitBytes(deviceMemoryGb);
  const limitZone = file ? getLimitZone(file.size, hardLimit) : "normal";
  const blockedByConsent = needsOversizeConsent(limitZone, oversizeConsented);

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
      effectiveMaxInputBytes: effectiveSessionInputLimit(limitZone, hardLimit),
      userConsentedOversize: oversizeConsented,
    };
  }, [
    file,
    fingerprint,
    fileIdentity,
    profile.enableResultCache,
    profile.cacheMaxOutputBytes,
    limitZone,
    hardLimit,
    oversizeConsented,
  ]);

  useEffect(() => {
    setEstimatedSize(null);
    setFinalDelta(null);
    setCachedFingerprint(null);
    setEstimateError(null);
    estimateIdRef.current++;
  }, [file]);

  const estimateDelta =
    estimatedSize != null
      ? computeSizeDelta(originalSize, estimatedSize)
      : null;

  const runEstimate = useCallback(async () => {
    if (!file || !ready || !transmuteMeta) return;
    if (blockedByConsent) {
      setEstimateError(t("panel.metrics.estimateUnavailable"));
      return;
    }
    if (typeof document !== "undefined" && document.hidden) return;

    estimateIdRef.current++;
    const thisId = estimateIdRef.current;
    estimateInFlightRef.current++;
    setEstimating(true);
    setEstimateError(null);
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
      const raw = err instanceof Error ? err.message : t("panel.unexpectedError");
      setEstimateError(localizeError(raw, t));
    } finally {
      estimateInFlightRef.current = Math.max(0, estimateInFlightRef.current - 1);
      if (estimateInFlightRef.current === 0) {
        setEstimating(false);
      }
    }
  }, [
    file,
    ready,
    blockedByConsent,
    module,
    outputExtension,
    encodeSource,
    options,
    estimate,
    transmuteMeta,
    fingerprint,
    t,
  ]);

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
    if (blockedByConsent) return;
    if (holdEstimate) return;
    if (typeof document !== "undefined" && document.hidden) return;

    estimateIdRef.current++;

    timerRef.current = setTimeout(() => {
      void runEstimateRef.current();
    }, profile.debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [file, ready, fingerprint, profile.debounceMs, profile.autoEstimate, blockedByConsent, holdEstimate]);

  useEffect(() => {
    if (!file || !ready || !profile.autoEstimate || blockedByConsent) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void runEstimateRef.current();
      }, profile.debounceMs);
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [file, ready, profile.autoEstimate, profile.debounceMs, blockedByConsent]);

  useEffect(() => {
    if (!oversizeConsented || blockedByConsent) return;
    if (!file || !ready || !profile.autoEstimate) return;
    void runEstimateRef.current();
  }, [oversizeConsented, blockedByConsent, file, ready, profile.autoEstimate]);

  const setFinalSize = useCallback(
    (bytes: number) => setFinalDelta(computeSizeDelta(originalSize, bytes)),
    [originalSize]
  );

  const resetMetrics = useCallback(() => {
    setEstimatedSize(null);
    setEstimating(false);
    setEstimateError(null);
    setFinalDelta(null);
    setCachedFingerprint(null);
    estimateIdRef.current++;
  }, []);

  return {
    originalSize,
    estimatedSize,
    estimating,
    estimateDelta,
    estimateError,
    needsOversizeConsent: blockedByConsent,
    limitZone,
    finalDelta,
    setFinalSize,
    resetMetrics,
    requestEstimate,
    cacheWarm,
    transmuteMeta,
  };
}
