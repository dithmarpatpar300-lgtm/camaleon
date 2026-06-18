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
import type { AlphaAssessment } from "@/lib/semantic-alpha";
import {
  buildFileIdentity,
  buildTransmuteFingerprint,
} from "@/lib/transmutation/fingerprint";
import { SOFT_LIMIT_BYTES } from "@/lib/transmutation/limits";
import {
  computeLimitContext,
  type LimitContext,
} from "@/lib/transmutation/limit-context";
import { localizeError } from "@/lib/i18n/errors";
import { extractWasmError } from "@/lib/wasm/extract-error";
import { getEstimateInputBuffer } from "@/lib/transmutation/estimate-input-cache";
import { useI18n } from "@/providers/I18nProvider";
import type { WorkerRequestMeta } from "@/workers/types";

type UseFileMetricsArgs = {
  file: File | null;
  /** Byte length used for limits (resized buffer when applicable). */
  effectiveFileSize?: number | null;
  /** In-memory bytes for estimate/transmute (resized PNG when applicable). */
  inputBytes?: ArrayBuffer | null;
  module: TransmutationModule;
  outputExtension: OutputExtension;
  encodeSource?: EncodeSource;
  options: TransmutationOptions;
  ready: boolean;
  profile: ResourceProfile;
  deviceMemoryGb?: number;
  oversizeConsented: boolean;
  sourceMeta: SourceImageMeta | null;
  /** Prepare-time semantic alpha (E0.5 estimate hint). */
  alphaAssessment?: AlphaAssessment | null;
  resizeMaxEdge?: number;
  riskModeEnabled?: boolean;
  holdEstimate?: boolean;
};

type FileMetrics = {
  originalSize: number;
  estimatedSize: number | null;
  estimating: boolean;
  estimateDelta: SizeDelta | null;
  estimateError: string | null;
  limitContext: LimitContext;
  needsOversizeConsent: boolean;
  finalDelta: SizeDelta | null;
  setFinalSize: (bytes: number) => void;
  resetMetrics: () => void;
  requestEstimate: () => void;
  cacheWarm: boolean;
  transmuteMeta: WorkerRequestMeta | undefined;
};

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
  sourceMeta,
  alphaAssessment,
  effectiveFileSize,
  inputBytes,
  resizeMaxEdge,
  holdEstimate = false,
  riskModeEnabled = false,
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
  const manualEstimateRef = useRef(false);
  const prevFingerprintRef = useRef<string | null>(null);
  const prevRiskModeRef = useRef(riskModeEnabled);
  const estimatedSizeRef = useRef<number | null>(null);
  const cachedFingerprintRef = useRef<string | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  const uploadSize = file?.size ?? 0;
  const limitFileSize = effectiveFileSize ?? uploadSize;
  const originalSize = limitFileSize;

  const limitContext = useMemo(
    () =>
      computeLimitContext({
        fileSize: limitFileSize,
        sourceMeta,
        deviceMemoryGb,
        oversizeConsented: oversizeConsented || riskModeEnabled,
        estimatedOutputSize: estimatedSize,
        workerReady: ready,
        riskModeEnabled,
      }),
    [
      limitFileSize,
      sourceMeta,
      deviceMemoryGb,
      oversizeConsented,
      riskModeEnabled,
      estimatedSize,
      ready,
    ]
  );

  const fingerprint = useMemo(
    () =>
      file
        ? buildTransmuteFingerprint(
            module,
            file,
            options,
            outputExtension,
            encodeSource,
            resizeMaxEdge
          )
        : null,
    [file, module, options, outputExtension, encodeSource, resizeMaxEdge]
  );

  const cacheWarm =
    fingerprint !== null && cachedFingerprint === fingerprint;

  estimatedSizeRef.current = estimatedSize;
  cachedFingerprintRef.current = cachedFingerprint;
  fingerprintRef.current = fingerprint;

  const fileIdentity = useMemo(
    () => (file ? buildFileIdentity(file) : null),
    [file]
  );

  const transmuteMeta = useMemo((): WorkerRequestMeta | undefined => {
    if (!file || !fingerprint || !fileIdentity) return undefined;
    const largeInput = limitFileSize > SOFT_LIMIT_BYTES;
    const alphaHint =
      alphaAssessment && alphaAssessment.confidence !== "structural"
        ? {
            hasMeaningfulAlpha: alphaAssessment.hasMeaningfulAlpha,
            confidence: alphaAssessment.confidence,
          }
        : undefined;

    return {
      fingerprint,
      fileIdentity,
      enableResultCache: profile.enableResultCache && !largeInput,
      cacheMaxOutputBytes: profile.cacheMaxOutputBytes,
      cacheMaxEntries: profile.cacheMaxEntries,
      effectiveMaxInputBytes: limitContext.sessionInputLimitBytes,
      userConsentedOversize: oversizeConsented || riskModeEnabled,
      riskModeEnabled,
      alphaHint,
    };
  }, [
    file,
    fingerprint,
    fileIdentity,
    profile.enableResultCache,
    profile.cacheMaxOutputBytes,
    profile.cacheMaxEntries,
    limitContext.sessionInputLimitBytes,
    oversizeConsented,
    riskModeEnabled,
    limitFileSize,
    alphaAssessment,
  ]);

  useEffect(() => {
    setEstimatedSize(null);
    setFinalDelta(null);
    setCachedFingerprint(null);
    setEstimateError(null);
    estimateIdRef.current++;
    prevFingerprintRef.current = null;
  }, [file]);

  const estimateDelta =
    estimatedSize != null
      ? computeSizeDelta(originalSize, estimatedSize)
      : null;

  const runEstimate = useCallback(
    async (opts?: { manual?: boolean }) => {
      if (!file || !ready || !transmuteMeta) return;
      if (!limitContext.canEstimate) {
        setEstimateError(null);
        if (limitContext.blockReason === "consent") {
          setEstimateError(t("panel.metrics.consentRequired"));
        } else if (limitContext.blockReason === "pixels") {
          setEstimateError(t("panel.metrics.pixelsBlocked"));
        }
        return;
      }
      if (typeof document !== "undefined" && document.hidden) return;

      const manual = opts?.manual === true;
      manualEstimateRef.current = manual;

      estimateIdRef.current++;
      const thisId = estimateIdRef.current;
      estimateInFlightRef.current++;
      setEstimating(true);
      setEstimateError(null);
      try {
        const buf = inputBytes
          ? inputBytes.slice(0)
          : await getEstimateInputBuffer(file);
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
        if (
          err instanceof Error &&
          (err.message === "superseded" || err.message === "worker-recycled")
        ) {
          if (manualEstimateRef.current) {
            setEstimateError(t("panel.metrics.estimateInterrupted"));
          }
          return;
        }
        const raw = extractWasmError(err, t("panel.unexpectedError"));
        setEstimateError(localizeError(raw, t));
      } finally {
        estimateInFlightRef.current = Math.max(0, estimateInFlightRef.current - 1);
        if (estimateInFlightRef.current === 0) {
          setEstimating(false);
          manualEstimateRef.current = false;
        }
      }
    },
    [
      file,
      inputBytes,
      ready,
      limitContext.canEstimate,
      limitContext.blockReason,
      module,
      outputExtension,
      encodeSource,
      options,
      estimate,
      transmuteMeta,
      fingerprint,
      t,
    ]
  );

  const runEstimateRef = useRef(runEstimate);
  runEstimateRef.current = runEstimate;

  const requestEstimate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void runEstimateRef.current({ manual: true });
  }, []);

  // Re-sync estimates when Risk mode toggles (session ceiling + consent gates change).
  useEffect(() => {
    if (prevRiskModeRef.current === riskModeEnabled) return;
    prevRiskModeRef.current = riskModeEnabled;
    setEstimateError(null);
    setEstimatedSize(null);
    setCachedFingerprint(null);
    estimateIdRef.current++;
    if (!file || !ready) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runEstimateRef.current({ manual: true });
    }, 50);
  }, [riskModeEnabled, file, ready]);

  // Auto-estimate debounce — only when profile allows; never cancels manual runs via fingerprint churn.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!file || !ready || !fingerprint) return;
    if (!profile.autoEstimate) return;
    if (!limitContext.canEstimate) return;
    if (holdEstimate) return;
    if (typeof document !== "undefined" && document.hidden) return;

    timerRef.current = setTimeout(() => {
      void runEstimateRef.current({ manual: false });
    }, profile.debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    file,
    ready,
    fingerprint,
    profile.debounceMs,
    profile.autoEstimate,
    limitContext.canEstimate,
    holdEstimate,
  ]);

  useEffect(() => {
    if (!file || !ready || !profile.autoEstimate || !limitContext.canEstimate) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Tab refocus: keep existing estimate when options/fingerprint unchanged.
      if (
        estimatedSizeRef.current != null &&
        cachedFingerprintRef.current === fingerprintRef.current
      ) {
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void runEstimateRef.current({ manual: false });
      }, profile.debounceMs);
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [file, ready, profile.autoEstimate, profile.debounceMs, limitContext.canEstimate]);

  // After oversize consent, run one manual estimate (even when autoEstimate is off for large files).
  const prevConsentedRef = useRef(false);
  useEffect(() => {
    const justConsented = oversizeConsented && !prevConsentedRef.current;
    prevConsentedRef.current = oversizeConsented;
    if (!justConsented || !file || !ready) return;
    if (!limitContext.canEstimate) return;
    void runEstimateRef.current({ manual: true });
  }, [oversizeConsented, file, ready, limitContext.canEstimate]);

  // Large files: re-estimate when options change (quality, compression, etc.).
  useEffect(() => {
    if (!file || !ready || !fingerprint) return;
    if (profile.autoEstimate) return;
    if (!limitContext.canEstimate) return;
    if (holdEstimate) return;
    if (typeof document !== "undefined" && document.hidden) return;

    const prev = prevFingerprintRef.current;
    prevFingerprintRef.current = fingerprint;

    if (prev === null || prev === fingerprint) return;
    if (estimatedSize === null && !oversizeConsented && !riskModeEnabled) return;

    setEstimatedSize(null);
    setEstimateError(null);

    if (timerRef.current) clearTimeout(timerRef.current);
    const debounceMs = Math.max(profile.debounceMs, 800);

    timerRef.current = setTimeout(() => {
      void runEstimateRef.current({ manual: false });
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    file,
    ready,
    fingerprint,
    profile.autoEstimate,
    profile.debounceMs,
    limitContext.canEstimate,
    holdEstimate,
    estimatedSize,
    oversizeConsented,
    riskModeEnabled,
  ]);

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
    limitContext,
    needsOversizeConsent: limitContext.needsInputConsent,
    finalDelta,
    setFinalSize,
    resetMetrics,
    requestEstimate,
    cacheWarm,
    transmuteMeta,
  };
}
