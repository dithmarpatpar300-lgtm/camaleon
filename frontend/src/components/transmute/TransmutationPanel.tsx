"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ColorOptionSpec, ToolDefinition } from "@/lib/tools/types";
import type { EncodeSource, OutputExtension, TransmutationOptions } from "@/workers/types";
import { fileMatchesExtensions } from "@/lib/tools/extensions";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { useFileMetrics } from "@/hooks/useFileMetrics";
import { useAdaptiveResourceProfile } from "@/hooks/useAdaptiveResourceProfile";
import { downloadResult } from "@/lib/transmutation/download";
import { formatBytes } from "@/lib/format/bytes";
import { prepareFileForTool } from "@/lib/transmutation/prepare/run-prepare";
import {
  prepareSessionInputLimit,
  SOFT_LIMIT_BYTES,
  formatHardLimitLabel,
  getHardLimitBytes,
  getLimitZone,
} from "@/lib/transmutation/limits";
import {
  releasePreparedContext,
  type PreparedFileContext,
  type PreparePhaseId,
} from "@/lib/transmutation/prepare/types";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { usePageFileDrop } from "@/hooks/usePageFileDrop";
import { localizeError } from "@/lib/i18n/errors";
import { extractWasmError } from "@/lib/wasm/extract-error";
import { getOptionSpecStrings, resolveToolFidelityHint } from "@/lib/i18n/tool-copy";
import { downscaleImageBytes } from "@/lib/imaging/downscale";
import { releaseFramePreviewSessions } from "@/lib/imaging/frame-preview-cache";
import { resolvePostResizeWasmConfig, supportsClientResize } from "@/lib/imaging/post-resize-route";
import { computeCostTier } from "@/lib/notices/compute-performance-notices";
import { computeTransmuteDetailKey } from "@/lib/notices/compute-estimate-notices";
import type { ToolNoticeContext } from "@/lib/notices/tool-notice-profiles";
import { mimeTypeForTool } from "@/lib/imaging/supports-client-resize";
import { assessSemanticAlpha, needsSemanticAlpha } from "@/lib/semantic-alpha";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import { icoMetaForEntry } from "@/lib/ico/ico-wasm-client";
import { tiffMetaForPage } from "@/lib/tiff/tiff-wasm-client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Dropzone } from "./Dropzone";
import { PageDropOverlay } from "./PageDropOverlay";
import { FilePrepareGate } from "./FilePrepareGate";
import { buildDefaultOptions } from "@/lib/transmutation/build-default-options";
import {
  isSvgTool,
  svgOptionsWithDimensions,
  svgSourceMetaForScale,
} from "@/lib/svg/svg-prepare";
import { getEffectiveTransmutationDefaults } from "@/lib/prefs/transmutation-defaults";
import { StagedWorkspace } from "./StagedWorkspace";
import { LimitUnlockHint } from "./LimitUnlockHint";
import {
  consumeFileHandoff,
  handoffPayloadToFile,
  resolveHandoffId,
} from "@/lib/transmutation/file-handoff";
import {
  batchHandoffPayloadToFiles,
  consumeBatchHandoff,
  resolveBatchHandoffId,
} from "@/lib/batch/batch-handoff";
import { useRiskMode } from "@/providers/RiskModeProvider";
import type { LimitBlockReason } from "@/lib/transmutation/limit-context";
import { shouldPromptRiskUnlockProceed } from "@/lib/transmutation/risk-unlock";
import { RiskUnlockProceedPanel } from "./RiskUnlockProceedPanel";
import { isBatchEnabledTool } from "@/lib/batch/batch-tool-allowlist";
import { capBatchFiles } from "@/lib/batch/batch-limits";
import { partitionFilesForTool } from "@/lib/batch/partition-for-tool";
import { BatchTransmutationPanel } from "./BatchTransmutationPanel";

type PanelStatus = "idle" | "preparing" | "staged" | "processing" | "success" | "error";

type StagedFile = { file: File; bytes: ArrayBuffer; effectiveSize?: number };
type Result = {
  inputSize: number;
  outputBytes: ArrayBuffer;
  outputSize: number;
  mime: string;
  extension: string;
  fileName: string;
};

type TransmutationPanelProps = { tool: ToolDefinition };

/** Duration that gate and workspace crossfade simultaneously. */
const CROSSFADE_MS = 460;

export function TransmutationPanel({ tool }: TransmutationPanelProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [pendingFile, setPendingFile] = useState<StagedFile | null>(null);
  const [prepared, setPrepared] = useState<PreparedFileContext | null>(null);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [preparePhase, setPreparePhase] = useState<PreparePhaseId>("reading");
  const [preparePhaseLabelKey, setPreparePhaseLabelKey] = useState<string | undefined>();
  const [prepareDetailLabel, setPrepareDetailLabel] = useState<string | undefined>();
  const [prepareIndeterminate, setPrepareIndeterminate] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0.1);
  /**
   * When true, both gate (exiting) and workspace (entering) are rendered
   * simultaneously so they can crossfade. Cleared after CROSSFADE_MS.
   */
  const [crossfading, setCrossfading] = useState(false);
  const [options, setOptions] = useState<TransmutationOptions>(() =>
    buildDefaultOptions(tool.optionSpecs, tool)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hardLimitBlocked, setHardLimitBlocked] = useState(false);
  const [hardLimitPendingFile, setHardLimitPendingFile] = useState<File | null>(null);
  const [riskUnlockAwaitingConfirm, setRiskUnlockAwaitingConfirm] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAlpha, setHasAlpha] = useState(false);
  const [oversizeConsented, setOversizeConsented] = useState(false);
  const [astroResizeMode, setAstroResizeMode] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [showRiskDeactivatedNotice, setShowRiskDeactivatedNotice] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [batchEntrySource, setBatchEntrySource] = useState<"handoff" | "inline" | null>(
    null
  );

  const deviceMemoryGb =
    typeof navigator !== "undefined"
      ? (navigator as { deviceMemory?: number }).deviceMemory
      : undefined;
  const { riskModeEnabled } = useRiskMode();
  const prevRiskModeRef = useRef(riskModeEnabled);
  const prevLimitBlockWhileRiskOffRef = useRef<LimitBlockReason>(null);
  const hardLimit = getHardLimitBytes(deviceMemoryGb, riskModeEnabled);

  const prepareIdRef = useRef(0);
  const preparedRef = useRef(prepared);
  preparedRef.current = prepared;

  useEffect(() => {
    return () => {
      releasePreparedContext(preparedRef.current);
      preparedRef.current = null;
      releaseFramePreviewSessions();
    };
  }, []);

  /**
   * Stable view over the staged bytes — scrubbers key their preview sessions
   * on this identity, so it must NOT be recreated on every render.
   */
  const stagedFileBytes = useMemo(
    () => (staged ? new Uint8Array(staged.bytes) : null),
    [staged]
  );

  const { transmutate, ready } = useTransmutationWorker();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const handleFileSelectRef = useRef<(file: File) => Promise<void>>(async () => {});
  const handleIncomingFilesRef = useRef<(files: File[]) => void>(() => {});
  const batchEnabled = isBatchEnabledTool(tool.slug);
  const stagedByteSize =
    staged?.effectiveSize ?? staged?.file.size ?? pendingFile?.file.size ?? 0;
  const profile = useAdaptiveResourceProfile(stagedByteSize);
  const wasResized = prepared?.resizeMaxEdge != null;
  const postResizeWasm = wasResized ? resolvePostResizeWasmConfig(tool) : null;
  const effectiveModule = postResizeWasm?.module ?? tool.module;
  const effectiveOutputExtension = (postResizeWasm?.outputExtension ??
    tool.outputExtension) as OutputExtension;
  const encodeSource: EncodeSource | undefined = postResizeWasm?.encodeSource
    ? postResizeWasm.encodeSource
    : tool.module === "transmutador_encode" || tool.module === "transmutador_avif_encode"
      ? tool.fromFormat === "PNG"
        ? "png"
        : "jpeg"
      : undefined;
  const canClientResize = supportsClientResize(tool);
  const metrics = useFileMetrics({
    file: staged?.file ?? null,
    effectiveFileSize: staged?.effectiveSize ?? null,
    inputBytes: staged?.bytes ?? null,
    module: effectiveModule,
    outputExtension: effectiveOutputExtension,
    encodeSource,
    options,
    ready,
    profile,
    deviceMemoryGb,
    oversizeConsented,
    sourceMeta: prepared?.sourceMeta ?? null,
    alphaAssessment: prepared?.alphaAssessment ?? null,
    resizeMaxEdge: prepared?.resizeMaxEdge,
    holdEstimate: crossfading || resizing,
    riskModeEnabled,
  });
  const accept = tool.acceptExtensions.join(",");

  useEffect(() => {
    if (!riskModeEnabled && staged) {
      prevLimitBlockWhileRiskOffRef.current = metrics.limitContext.blockReason;
    }
  }, [riskModeEnabled, staged, metrics.limitContext.blockReason]);

  useEffect(() => {
    const wasRisk = prevRiskModeRef.current;
    const riskJustEnabled = !wasRisk && riskModeEnabled;
    const riskJustDisabled = wasRisk && !riskModeEnabled;

    if (riskJustEnabled) {
      setShowRiskDeactivatedNotice(false);
      if (
        shouldPromptRiskUnlockProceed(true, true, {
          hardLimitPendingFile,
          stagedFileSize: staged?.effectiveSize ?? staged?.file.size ?? null,
          prevBlockReasonWhileRiskOff: prevLimitBlockWhileRiskOffRef.current,
          deviceMemoryGb,
        })
      ) {
        setRiskUnlockAwaitingConfirm(true);
        setHardLimitBlocked(false);
        setErrorMessage(null);
      }
    }

    if (riskJustDisabled) {
      setRiskUnlockAwaitingConfirm(false);
      if (hardLimitPendingFile && hardLimitPendingFile.size > hardLimit) {
        setStatus("error");
        setHardLimitBlocked(true);
        setErrorMessage(
          t("panel.hardLimit.body", {
            limit: formatHardLimitLabel(hardLimit, false),
          })
        );
      }
      if (staged) {
        setShowRiskDeactivatedNotice(true);
        setAstroResizeMode(false);
      }
    } else if (riskModeEnabled) {
      setShowRiskDeactivatedNotice(false);
    }

    prevRiskModeRef.current = riskModeEnabled;
  }, [
    riskModeEnabled,
    staged,
    hardLimitPendingFile,
    deviceMemoryGb,
    hardLimit,
    t,
  ]);

  const handleOptionsChange = useCallback(
    (next: TransmutationOptions) => {
      if (isSvgTool(tool.id) && prepared?.svgMeta) {
        const withDims = svgOptionsWithDimensions(next, prepared.svgMeta);
        if (
          next.outputScale != null &&
          next.outputScale !== options.outputScale
        ) {
          setPrepared({
            ...prepared,
            sourceMeta: svgSourceMetaForScale(
              prepared.svgMeta,
              withDims.outputScale ?? 100
            ),
          });
        }
        setOptions(withDims);
        return;
      }

      setOptions(next);
      if (
        (tool.id === "tiff-to-png" || tool.id === "tiff-to-jpg") &&
        prepared?.tiffMeta &&
        next.pageIndex != null &&
        next.pageIndex !== options.pageIndex
      ) {
        const page = tiffMetaForPage(prepared.tiffMeta, next.pageIndex);
        setPrepared({
          ...prepared,
          sourceMeta: {
            width: page.width,
            height: page.height,
            bitDepthLabel: page.bitDepthLabel,
            pageCount: page.pageCount > 1 ? page.pageCount : undefined,
          },
        });
        if (tool.id === "tiff-to-jpg" && staged?.bytes) {
          void (async () => {
            const assessment = await assessSemanticAlpha(tool, staged.bytes, {
              pageIndex: next.pageIndex,
            });
            setPrepared((current) =>
              current
                ? {
                    ...current,
                    hasAlpha: assessment.hasMeaningfulAlpha,
                    alphaAssessment: assessment,
                    sourceMeta: current.sourceMeta
                      ? {
                          ...current.sourceMeta,
                          hasMeaningfulAlpha: assessment.hasMeaningfulAlpha,
                        }
                      : current.sourceMeta,
                  }
                : current
            );
            setHasAlpha(assessment.hasMeaningfulAlpha);
          })();
        }
      }
      if (
        tool.id === "ico-to-png" &&
        prepared?.icoMeta &&
        next.entryIndex != null &&
        next.entryIndex !== options.entryIndex
      ) {
        const entry = icoMetaForEntry(prepared.icoMeta, next.entryIndex);
        setPrepared({
          ...prepared,
          sourceMeta: {
            width: entry.width,
            height: entry.height,
            bitDepthLabel: entry.bitDepthLabel,
            entryCount: entry.entryCount > 1 ? entry.entryCount : undefined,
          },
        });
      }
    },
    [tool, prepared, staged?.bytes, options.pageIndex, options.entryIndex, options.outputScale]
  );

  const handleFileSelect = useCallback(async (file: File) => {
    if (!fileMatchesExtensions(file.name, tool.acceptExtensions)) {
      setStatus("error");
      setErrorMessage(t("panel.fmtError", { formats: tool.acceptExtensions.join(", ") }));
      return;
    }

    if (file.size > hardLimit) {
      setHardLimitPendingFile(file);
      setStatus("error");
      setHardLimitBlocked(true);
      setErrorMessage(
        t("panel.hardLimit.body", {
          limit: formatHardLimitLabel(hardLimit, riskModeEnabled),
        })
      );
      return;
    }

    setHardLimitPendingFile(null);

    const prepareId = ++prepareIdRef.current;
    releasePreparedContext(preparedRef.current);
    setPrepared(null);
    setStaged(null);
    setResult(null);
    setCrossfading(false);
    setOversizeConsented(false);
    setAstroResizeMode(false);
    setResizing(false);
    setHardLimitBlocked(false);
    setRiskUnlockAwaitingConfirm(false);
    setErrorMessage(null);

    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      setStatus("error");
      setErrorMessage(t("panel.unexpectedError"));
      return;
    }

    const limitZone = getLimitZone(file.size, hardLimit);
    const sessionLimit = prepareSessionInputLimit(limitZone, hardLimit, riskModeEnabled);

    const pending = { file, bytes };
    setPendingFile(pending);
    setStatus("preparing");
    setPrepareProgress(0);
    setPreparePhase("reading");
    setPreparePhaseLabelKey(undefined);
    setPrepareDetailLabel(undefined);

    try {
      const ctx = await prepareFileForTool(
        tool,
        bytes,
        (p) => {
          if (prepareId !== prepareIdRef.current) return;
          setPrepareProgress(p.progress);
          setPreparePhase(p.phase);
          setPreparePhaseLabelKey(p.phaseLabelKey);
          setPrepareIndeterminate(p.indeterminate ?? false);
          if (p.detailLabelKey) {
            setPrepareDetailLabel(t(p.detailLabelKey, p.detailParams ?? {}));
          } else {
            setPrepareDetailLabel(undefined);
          }
        },
        { sessionInputLimitBytes: sessionLimit, riskModeEnabled }
      );

      if (prepareId !== prepareIdRef.current) {
        releasePreparedContext(ctx);
        return;
      }

      // Transition: simultaneously crossfade gate out and workspace in — no dead gap.
      setPrepared(ctx);
      setHasAlpha(ctx.hasAlpha);
      setStaged(pending);
      setPendingFile(null);
      const defaults = buildDefaultOptions(tool.optionSpecs, tool);
      const baseOptions = {
        ...defaults,
        frameIndex: 0,
        pageIndex: 0,
        entryIndex: ctx.icoMeta?.defaultEntryIndex ?? 0,
      };
      if (ctx.svgMeta && isSvgTool(tool.id)) {
        setOptions(svgOptionsWithDimensions(baseOptions, ctx.svgMeta));
      } else {
        setOptions(baseOptions);
      }
      setStatus("staged");
      setCrossfading(true);
      setTimeout(() => setCrossfading(false), CROSSFADE_MS);
    } catch (err) {
      if (prepareId !== prepareIdRef.current) return;
      setPendingFile(null);
      setStatus("error");
      const raw = extractWasmError(err, t("panel.prepareFailed"));
      setErrorMessage(localizeError(raw, t));
    }
  }, [tool, t, hardLimit, riskModeEnabled]);

  const enterBatchMode = useCallback(
    (files: File[], source: "handoff" | "inline" = "inline") => {
      prepareIdRef.current += 1;
      releasePreparedContext(preparedRef.current);
      preparedRef.current = null;
      releaseFramePreviewSessions();
      setPrepared(null);
      setPendingFile(null);
      setStaged(null);
      setResult(null);
      setStatus("idle");
      setErrorMessage(null);
      setBatchEntrySource(source);
      setBatchFiles(files);
    },
    []
  );

  const handleIncomingFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;
      if (status === "processing" || status === "preparing") return;

      const { accepted, rejected } = partitionFilesForTool(incoming, tool);

      if (rejected.length > 0) {
        const names = rejected.map((f) => f.name).join(", ");
        toast({
          message: t("panel.batch.skippedIncompatible", {
            count: rejected.length,
            names,
          }),
          variant: "info",
        });
      }

      if (accepted.length === 0) {
        setBatchFiles(null);
        setStatus("error");
        setErrorMessage(
          rejected.length > 0
            ? t("panel.batch.noneCompatible", {
                formats: tool.acceptExtensions.join(", "),
              })
            : t("panel.fmtError", { formats: tool.acceptExtensions.join(", ") })
        );
        return;
      }

      if (accepted.length === 1) {
        setBatchFiles(null);
        void handleFileSelect(accepted[0]);
        return;
      }

      if (!batchEnabled) {
        toast({ message: t("panel.batch.notSupported"), variant: "info" });
        setBatchFiles(null);
        void handleFileSelect(accepted[0]);
        return;
      }

      const capped = capBatchFiles(accepted, deviceMemoryGb);
      if (capped.length < accepted.length) {
        toast({
          message: t("panel.batch.capped", { max: capped.length }),
          variant: "info",
        });
      }

      enterBatchMode(capped);
    },
    [
      status,
      tool,
      toast,
      t,
      batchEnabled,
      deviceMemoryGb,
      handleFileSelect,
      enterBatchMode,
    ]
  );

  handleFileSelectRef.current = handleFileSelect;
  handleIncomingFilesRef.current = handleIncomingFiles;

  const prevToolSlugRef = useRef(tool.slug);
  useEffect(() => {
    if (prevToolSlugRef.current !== tool.slug) {
      prepareIdRef.current += 1;
      prevToolSlugRef.current = tool.slug;
      setBatchFiles(null);
      setBatchEntrySource(null);
    }
  }, [tool.slug]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryBatch = params.get("batch");
    const batchId = resolveBatchHandoffId(queryBatch);

    if (batchId) {
      let cancelled = false;
      const timer = window.setTimeout(() => {
        if (cancelled) return;

        const payload = consumeBatchHandoff(batchId);
        if (queryBatch) {
          router.replace(pathname, { scroll: false });
        }
        if (!payload) {
          toast({ message: t("panel.handoffExpired"), variant: "info" });
          return;
        }
        if (payload.toolSlug !== tool.slug) {
          toast({ message: t("panel.batchHandoffToolMismatch"), variant: "info" });
          return;
        }

        const files = batchHandoffPayloadToFiles(payload);
        enterBatchMode(files, "handoff");
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const queryHandoff = params.get("handoff");
    const handoffId = resolveHandoffId(queryHandoff);
    if (!handoffId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const payload = consumeFileHandoff(handoffId);
      if (queryHandoff) {
        router.replace(pathname, { scroll: false });
      }
      if (!payload) {
        toast({ message: t("panel.handoffExpired"), variant: "info" });
        return;
      }
      void handleFileSelectRef.current(handoffPayloadToFile(payload));
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tool.slug, pathname, router, t, toast]);

  const handleStartResize = useCallback(() => {
    setAstroResizeMode(true);
  }, []);

  const handleCancelResize = useCallback(() => {
    setAstroResizeMode(false);
  }, []);

  const handleApplyResize = useCallback(
    async (maxEdge: number) => {
      if (!staged || !prepared?.sourceMeta) return;

      setResizing(true);
      setStatus("preparing");
      setPrepareProgress(0);
      setPreparePhase("resizing");
      setPreparePhaseLabelKey("prepare.phases.resizing");
      setPrepareIndeterminate(false);
      setPrepareDetailLabel(undefined);
      setErrorMessage(null);

      try {
        const result = await downscaleImageBytes(
          staged.bytes,
          mimeTypeForTool(tool),
          maxEdge,
          (p) => setPrepareProgress(p)
        );

        const originalMeta = prepared.originalSourceMeta ?? prepared.sourceMeta;
        const newSourceMeta: SourceImageMeta = {
          width: result.width,
          height: result.height,
          bitDepthLabel: "8-bit",
        };

        const resizedOutput = resolvePostResizeWasmConfig(tool)?.outputExtension;
        const alphaAssessment =
          needsSemanticAlpha(tool) && resizedOutput === "jpg"
            ? await assessSemanticAlpha(tool, result.bytes, { deviceMemoryGb })
            : prepared.alphaAssessment;

        setPrepared({
          ...prepared,
          hasAlpha: alphaAssessment?.hasMeaningfulAlpha ?? false,
          alphaAssessment,
          tiffMeta: tool.fromFormat === "TIFF" ? null : prepared.tiffMeta,
          sourceMeta: newSourceMeta,
          originalSourceMeta: originalMeta,
          resizeMaxEdge: maxEdge,
        });
        setHasAlpha(alphaAssessment?.hasMeaningfulAlpha ?? false);
        setStaged({
          file: staged.file,
          bytes: result.bytes,
          effectiveSize: result.bytes.byteLength,
        });
        setAstroResizeMode(false);
        // Astro resize is explicit consent for elevated byte zone (wave2 astro roadmap).
        setOversizeConsented(result.bytes.byteLength > SOFT_LIMIT_BYTES);
        metrics.resetMetrics();
        setStatus("staged");
      } catch (err) {
        setStatus("staged");
        setAstroResizeMode(true);
        const raw = extractWasmError(err, t("panel.unexpectedError"));
        toast({ message: localizeError(raw, t), variant: "info" });
      } finally {
        setResizing(false);
      }
    },
    [staged, prepared, tool, metrics, t, toast, deviceMemoryGb]
  );

  const handleTransmutar = useCallback(async () => {
    if (
      !staged ||
      !ready ||
      !metrics.limitContext.canTransmute ||
      metrics.estimateError ||
      !prepared?.sourceMeta ||
      (metrics.limitContext.needsInputConsent && !oversizeConsented) ||
      (metrics.estimating &&
        !metrics.cacheWarm &&
        metrics.estimateDelta != null)
    ) {
      return;
    }
    setProcessingProgress(0.08);
    setStatus("processing");
    setErrorMessage(null);
    // Free decoded preview frames — the Wasm transmute path re-reads the
    // original bytes, so the scrub cache is dead weight from here on.
    releaseFramePreviewSessions();
    try {
      const response = await transmutate(
        effectiveModule,
        staged.bytes,
        options,
        metrics.transmuteMeta,
        effectiveOutputExtension,
        encodeSource
      );
      if (response.ok) {
        metrics.setFinalSize(response.outputSize);
        setResult({
          inputSize: staged.effectiveSize ?? staged.file.size,
          outputBytes: response.bytes!,
          outputSize: response.outputSize,
          mime: response.mime!,
          extension: response.extension!,
          fileName: staged.file.name,
        });
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(localizeError(response.error, t));
      }
    } catch (err) {
      setStatus("error");
      const raw = extractWasmError(err, t("panel.unexpectedError"));
      setErrorMessage(localizeError(raw, t));
    }
  }, [
    staged,
    ready,
    effectiveModule,
    effectiveOutputExtension,
    encodeSource,
    options,
    transmutate,
    metrics.setFinalSize,
    metrics.transmuteMeta,
    metrics.limitContext.canTransmute,
    metrics.limitContext.needsInputConsent,
    metrics.estimateError,
    metrics.estimating,
    metrics.cacheWarm,
    metrics.estimateDelta,
    oversizeConsented,
    prepared?.sourceMeta,
    t,
  ]);

  const handleOversizeConsent = useCallback(() => {
    setOversizeConsented(true);
  }, []);

  const handleAdjustAndRetry = useCallback(async () => {
    if (staged?.file) {
      try {
        const bytes = await staged.file.arrayBuffer();
        setStaged({ file: staged.file, bytes });
        if (prepared?.originalSourceMeta) {
          const pageIndex = options.pageIndex ?? 0;
          const alphaAssessment = needsSemanticAlpha(tool)
            ? await assessSemanticAlpha(tool, bytes, { pageIndex })
            : prepared.alphaAssessment;
          const hasMeaningfulAlpha = alphaAssessment?.hasMeaningfulAlpha ?? false;
          setPrepared({
            ...prepared,
            sourceMeta: {
              ...prepared.originalSourceMeta,
              hasMeaningfulAlpha: alphaAssessment?.hasMeaningfulAlpha,
            },
            originalSourceMeta: undefined,
            resizeMaxEdge: undefined,
            alphaAssessment,
            hasAlpha: hasMeaningfulAlpha,
          });
          setHasAlpha(hasMeaningfulAlpha);
        }
      } catch {
        setErrorMessage(t("panel.unexpectedError"));
        return;
      }
    }
    setAstroResizeMode(false);
    metrics.resetMetrics();
    setStatus("staged");
    setErrorMessage(null);
  }, [staged, prepared, tool, options.pageIndex, metrics, t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadResult(result.outputBytes, result.fileName, result.mime, result.extension);
    toast({ message: t("toast.downloadStarted"), variant: "success" });
  }, [result, toast, t]);

  const handleRiskUnlockContinue = useCallback(() => {
    setRiskUnlockAwaitingConfirm(false);
    const pending = hardLimitPendingFile;
    if (pending) {
      setHardLimitPendingFile(null);
      setStatus("idle");
      setErrorMessage(null);
      setHardLimitBlocked(false);
      void handleFileSelect(pending);
      return;
    }
  }, [hardLimitPendingFile, handleFileSelect]);

  const handleReset = useCallback(() => {
    if (batchEntrySource === "handoff" && batchFiles != null) {
      prepareIdRef.current++;
      router.replace("/");
      return;
    }

    prepareIdRef.current++;
    releasePreparedContext(prepared);
    releaseFramePreviewSessions();
    setPrepared(null);
    setPendingFile(null);
    setStaged(null);
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setHardLimitBlocked(false);
    setHardLimitPendingFile(null);
    setRiskUnlockAwaitingConfirm(false);
    setHasAlpha(false);
    setPreviewUrl(null);
    setCrossfading(false);
    setOversizeConsented(false);
    setAstroResizeMode(false);
    setResizing(false);
    setOptions(buildDefaultOptions(tool.optionSpecs, tool));
    metrics.resetMetrics();
    setBatchFiles(null);
    setBatchEntrySource(null);
  }, [tool, metrics, prepared, batchEntrySource, batchFiles, router]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (status === "processing" || status === "preparing") return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleIncomingFiles(files);
  }, [status, handleIncomingFiles]);

  useEffect(() => {
    if (status !== "processing") return;
    setProcessingProgress(0.08);
    const interval = setInterval(() => {
      setProcessingProgress((p) => Math.min(0.92, p + 0.025));
    }, 200);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!result) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(
      new Blob([result.outputBytes], { type: result.mime })
    );
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const panelOptionSpecs = useMemo(() => {
    if (!tool.optionSpecs) return [];
    return tool.optionSpecs.filter((spec) => spec.key !== "background");
  }, [tool.optionSpecs]);

  const hasOptions = panelOptionSpecs.length > 0;

  const { active: dropOverlayActive } = usePageFileDrop({
    enabled: (status === "idle" || status === "staged") && !batchFiles,
    onFiles: handleIncomingFiles,
    acceptExtensions: tool.acceptExtensions,
  });

  const backgroundSpec = tool.optionSpecs?.find(
    (s): s is ColorOptionSpec => s.kind === "color" && s.key === "background"
  );
  const currentBackground =
    options.background ??
    (backgroundSpec ? getEffectiveTransmutationDefaults().alphaBackground : { r: 255, g: 255, b: 255 });
  const backgroundSwatches = backgroundSpec
    ? getOptionSpecStrings(tool.id, backgroundSpec, t).swatches
    : [];

  const activeFile = pendingFile ?? staged;

  const transmuteNoticeContext: ToolNoticeContext = useMemo(
    () => ({
      sourceMeta: prepared?.sourceMeta ?? null,
      animatedFrameCount:
        prepared?.gifSession?.is_animated
          ? prepared.gifSession.frame_count
          : undefined,
    }),
    [prepared]
  );

  const transmuteDetailLabel = useMemo(() => {
    if (status !== "processing" || !prepared) return undefined;
    const tier = computeCostTier({
      toolId: tool.id,
      sourceMeta: prepared.sourceMeta,
      options,
      zone: metrics.limitContext.zone,
      resourceProfile: profile,
      noticeContext: transmuteNoticeContext,
    });
    const key = computeTransmuteDetailKey(tier);
    return key ? t(key) : undefined;
  }, [
    status,
    prepared,
    tool.id,
    options,
    metrics.limitContext.zone,
    profile,
    transmuteNoticeContext,
    t,
  ]);

  if (batchFiles && batchFiles.length >= 2) {
    return (
      <div className="space-y-6">
        <BatchTransmutationPanel
          tool={tool}
          files={batchFiles}
          onReset={handleReset}
          batchFromHandoff={batchEntrySource === "handoff"}
        />
        <PageDropOverlay active={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status === "idle" && (
        <Dropzone accept={accept} status="idle" dragging={dragging} sourceFileName={null}
          multiple={batchEnabled}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          onFilesSelect={handleIncomingFiles}
          idleLabel={batchEnabled ? t("dropzone.idleLabelBatch") : t("dropzone.idleLabel")}
          processingLabel={t("dropzone.processingLabel")}
        />
      )}

      {/*
       * Single shell: workspace sizes the card in normal flow; gate overlays on top
       * during crossfade (absolute) so both never stack vertically in the document.
       */}
      {(status === "preparing" || status === "staged") && activeFile && (
        <div
          className={cn(
            "transmute-shell relative",
            status === "preparing" && "min-h-[22rem]"
          )}
        >
          {status === "staged" && staged && prepared && (
            <div className={cn(crossfading && "workspace-crossfade-in")}>
              <StagedWorkspace
                tool={tool}
                fileName={staged.file.name}
                fileSize={staged.effectiveSize ?? staged.file.size}
                options={options}
                onOptionsChange={handleOptionsChange}
                hasAlpha={hasAlpha}
                gifSession={prepared.gifSession}
                avifMeta={prepared.avifMeta}
                tiffMeta={prepared.tiffMeta}
                icoMeta={prepared.icoMeta}
                svgMeta={prepared.svgMeta}
                fileBytes={stagedFileBytes}
                sourceMeta={prepared.sourceMeta}
                originalSourceMeta={prepared.originalSourceMeta}
                limitContext={metrics.limitContext}
                canClientResize={canClientResize}
                astroResizeMode={astroResizeMode}
                resizing={resizing}
                deviceMemoryGb={deviceMemoryGb}
                onStartResize={handleStartResize}
                onApplyResize={(edge) => void handleApplyResize(edge)}
                onCancelResize={handleCancelResize}
                panelOptionSpecs={panelOptionSpecs}
                hasOptions={hasOptions}
                backgroundSpec={backgroundSpec}
                backgroundSwatches={backgroundSwatches}
                currentBackground={currentBackground}
                metrics={{
                  originalSize: metrics.originalSize,
                  estimateDelta: metrics.estimateDelta,
                  estimating: metrics.estimating,
                  estimateError: metrics.estimateError,
                  cacheWarm: metrics.cacheWarm,
                }}
                profile={profile}
                ready={ready}
                onRequestEstimate={metrics.requestEstimate}
                onOversizeConsent={handleOversizeConsent}
                onTransmutar={handleTransmutar}
                onReset={handleReset}
                showRiskDeactivatedNotice={showRiskDeactivatedNotice}
                riskUnlockAwaitingConfirm={riskUnlockAwaitingConfirm}
                onRiskUnlockContinue={handleRiskUnlockContinue}
              />
            </div>
          )}

          {(status === "preparing" || crossfading || resizing) && (
            <div
              className={cn(
                "bg-bg-surface",
                status === "preparing"
                  ? "relative"
                  : "absolute inset-0 z-10 flex items-center justify-center",
                crossfading && "gate-crossfade-out pointer-events-none"
              )}
            >
              <FilePrepareGate
                fileName={activeFile.file.name}
                fileSize={activeFile.file.size}
                progress={prepareProgress}
                phase={preparePhase}
                phaseLabelKey={preparePhaseLabelKey}
                indeterminate={prepareIndeterminate}
                detailLabel={prepareDetailLabel}
              />
            </div>
          )}
        </div>
      )}

      {status === "processing" && staged && (
        <div className="transmute-shell overflow-hidden">
          <FilePrepareGate
            fileName={staged.file.name}
            fileSize={staged.file.size}
            progress={processingProgress}
            phase="transmuting"
            phaseLabelKey="prepare.phases.transmuting"
            detailLabel={transmuteDetailLabel}
          />
        </div>
      )}

      {status === "success" && result && (
        <div className="transmute-shell space-y-4 p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-bg-base">
            {previewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt={t("panel.previewAlt", { fileName: result.fileName })}
                className="mx-auto max-h-80 object-contain"
              />
            )}
          </div>
          <div className="rounded-xl border border-border/60 bg-bg-elevated/50 px-4 py-2 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-text-muted">{t("panel.metrics.original")}</span>
              <span className="font-mono tabular-nums text-text-secondary">
                {formatBytes(result.inputSize)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-text-muted">{t("panel.result.final")}</span>
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-text-secondary">
                <span>{formatBytes(result.outputSize)}</span>
                {metrics.finalDelta && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums leading-none",
                      metrics.finalDelta.deltaPct > 0
                        ? "bg-error/15 text-error"
                        : "bg-accent/15 text-accent"
                    )}
                  >
                    {metrics.finalDelta.deltaLabel}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownload} className="flex-1">{t("panel.download")}</Button>
            <Button variant="ghost" onClick={handleReset}>{t("panel.transmuteAnother")}</Button>
          </div>
        </div>
      )}

      {riskUnlockAwaitingConfirm && hardLimitPendingFile && status === "error" && (
        <RiskUnlockProceedPanel
          fileName={hardLimitPendingFile.name}
          fileSize={hardLimitPendingFile.size}
          onContinue={handleRiskUnlockContinue}
          onStartOver={handleReset}
        />
      )}

      {status === "error" && errorMessage && !riskUnlockAwaitingConfirm && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <p className="font-semibold">
            {hardLimitBlocked ? t("panel.hardLimit.title") : t("panel.errorTitle")}
          </p>
          <p className="mt-1">{errorMessage}</p>
          {hardLimitBlocked && <LimitUnlockHint variant="error" />}
          <div className="mt-3 flex gap-2">
            {staged && (
              <Button variant="subtle" size="sm" onClick={() => void handleAdjustAndRetry()}>
                {t("panel.adjustAndRetry")}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset}>{t("panel.startOver")}</Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-text-muted">
        {t("panel.engineLabel", { status: ready ? t("panel.engineReady") : t("panel.engineInit") })}
      </p>

      <PageDropOverlay active={dropOverlayActive} />
    </div>
  );
}
