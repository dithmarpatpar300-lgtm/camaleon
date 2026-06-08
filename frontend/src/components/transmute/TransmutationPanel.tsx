"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  effectiveSessionInputLimit,
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
import { getOptionSpecStrings, resolveToolFidelityHint } from "@/lib/i18n/tool-copy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Dropzone } from "./Dropzone";
import { PageDropOverlay } from "./PageDropOverlay";
import { FilePrepareGate } from "./FilePrepareGate";
import { StagedWorkspace } from "./StagedWorkspace";

type PanelStatus = "idle" | "preparing" | "staged" | "processing" | "success" | "error";

type StagedFile = { file: File; bytes: ArrayBuffer };
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

function buildDefaultOptions(specs: ToolDefinition["optionSpecs"]): TransmutationOptions {
  const opts: TransmutationOptions = {};
  if (!specs) return opts;
  for (const s of specs) {
    if (s.key === "background") {
      opts.background = s.defaultValue as import("@/lib/tools/types").RgbColor;
    } else {
      opts[s.key] = s.defaultValue as number;
    }
  }
  return opts;
}


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
  const [options, setOptions] = useState<TransmutationOptions>(() => buildDefaultOptions(tool.optionSpecs));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAlpha, setHasAlpha] = useState(false);
  const [oversizeConsented, setOversizeConsented] = useState(false);

  const deviceMemoryGb =
    typeof navigator !== "undefined"
      ? (navigator as { deviceMemory?: number }).deviceMemory
      : undefined;
  const hardLimit = getHardLimitBytes(deviceMemoryGb);

  const prepareIdRef = useRef(0);
  const preparedRef = useRef(prepared);
  preparedRef.current = prepared;

  const { transmutate, ready } = useTransmutationWorker();
  const { toast } = useToast();
  const profile = useAdaptiveResourceProfile(staged?.file?.size ?? pendingFile?.file.size ?? 0);
  const encodeSource: EncodeSource | undefined =
    tool.module === "transmutador_encode"
      ? tool.fromFormat === "PNG"
        ? "png"
        : "jpeg"
      : undefined;
  const metrics = useFileMetrics({
    file: staged?.file ?? null,
    module: tool.module,
    outputExtension: tool.outputExtension as OutputExtension,
    encodeSource,
    options,
    ready,
    profile,
    deviceMemoryGb,
    oversizeConsented,
    sourceMeta: prepared?.sourceMeta ?? null,
    holdEstimate: crossfading,
  });
  const accept = tool.acceptExtensions.join(",");

  const handleFileSelect = useCallback(async (file: File) => {
    if (!fileMatchesExtensions(file.name, tool.acceptExtensions)) {
      setStatus("error");
      setErrorMessage(t("panel.fmtError", { formats: tool.acceptExtensions.join(", ") }));
      return;
    }

    if (file.size > hardLimit) {
      setStatus("error");
      setErrorMessage(
        t("panel.hardLimit.body", { limit: formatHardLimitLabel(hardLimit) })
      );
      return;
    }

    const prepareId = ++prepareIdRef.current;
    releasePreparedContext(preparedRef.current);
    setPrepared(null);
    setStaged(null);
    setResult(null);
    setCrossfading(false);
    setOversizeConsented(false);
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
    const sessionLimit = effectiveSessionInputLimit(limitZone, hardLimit);

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
        { sessionInputLimitBytes: sessionLimit }
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
      setOptions({ ...buildDefaultOptions(tool.optionSpecs), frameIndex: 0 });
      setStatus("staged");
      setCrossfading(true);
      setTimeout(() => setCrossfading(false), CROSSFADE_MS);
    } catch {
      if (prepareId !== prepareIdRef.current) return;
      setPendingFile(null);
      setStatus("error");
      setErrorMessage(t("panel.prepareFailed"));
    }
  }, [tool, t, hardLimit]);

  const handleTransmutar = useCallback(async () => {
    if (!staged || !ready || !metrics.limitContext.canTransmute) return;
    setProcessingProgress(0.08);
    setStatus("processing");
    setErrorMessage(null);
    try {
      const response = await transmutate(
        tool.module,
        staged.bytes,
        options,
        metrics.transmuteMeta,
        tool.outputExtension as OutputExtension,
        encodeSource
      );
      if (response.ok) {
        metrics.setFinalSize(response.outputSize);
        setResult({
          inputSize: staged.file.size,
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
      const raw = err instanceof Error ? err.message : t("panel.unexpectedError");
      setErrorMessage(localizeError(raw, t));
    }
  }, [
    staged,
    ready,
    tool.module,
    tool.outputExtension,
    encodeSource,
    options,
    transmutate,
    metrics.setFinalSize,
    metrics.transmuteMeta,
    metrics.limitContext.canTransmute,
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
      } catch {
        setErrorMessage(t("panel.unexpectedError"));
        return;
      }
    }
    metrics.resetMetrics();
    setStatus("staged");
    setErrorMessage(null);
  }, [staged, metrics, t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadResult(result.outputBytes, result.fileName, result.mime, result.extension);
    toast({ message: t("toast.downloadStarted"), variant: "success" });
  }, [result, toast, t]);

  const handleReset = useCallback(() => {
    prepareIdRef.current++;
    releasePreparedContext(prepared);
    setPrepared(null);
    setPendingFile(null);
    setStaged(null);
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setHasAlpha(false);
    setPreviewUrl(null);
    setCrossfading(false);
    setOversizeConsented(false);
    setOptions(buildDefaultOptions(tool.optionSpecs));
    metrics.resetMetrics();
  }, [tool, metrics, prepared]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (status === "processing" || status === "preparing") return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  }, [status, handleFileSelect]);

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
    enabled: status === "idle" || status === "staged",
    onFile: handleFileSelect,
    acceptExtensions: tool.acceptExtensions,
  });

  const backgroundSpec = tool.optionSpecs?.find(
    (s): s is ColorOptionSpec => s.kind === "color" && s.key === "background"
  );
  const currentBackground =
    options.background ??
    backgroundSpec?.defaultValue ??
    { r: 255, g: 255, b: 255 };
  const backgroundSwatches = backgroundSpec
    ? getOptionSpecStrings(tool.id, backgroundSpec, t).swatches
    : [];

  const activeFile = pendingFile ?? staged;

  return (
    <div className="space-y-6">
      {status === "idle" && (
        <Dropzone accept={accept} status="idle" dragging={dragging} sourceFileName={null}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onFileSelect={handleFileSelect} idleLabel={t("dropzone.idleLabel")} processingLabel={t("dropzone.processingLabel")}
        />
      )}

      {/*
       * Single shell: workspace sizes the card in normal flow; gate overlays on top
       * during crossfade (absolute) so both never stack vertically in the document.
       */}
      {(status === "preparing" || status === "staged") && activeFile && (
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border bg-bg-surface",
            status === "preparing" && "min-h-[22rem]"
          )}
        >
          {status === "staged" && staged && prepared && (
            <div className={cn(crossfading && "workspace-crossfade-in")}>
              <StagedWorkspace
                tool={tool}
                fileName={staged.file.name}
                fileSize={staged.file.size}
                options={options}
                onOptionsChange={setOptions}
                hasAlpha={hasAlpha}
                gifSession={prepared.gifSession}
                sourceMeta={prepared.sourceMeta}
                panelOptionSpecs={panelOptionSpecs}
                hasOptions={hasOptions}
                backgroundSpec={backgroundSpec}
                backgroundSwatches={backgroundSwatches}
                currentBackground={currentBackground}
                limitContext={metrics.limitContext}
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
              />
            </div>
          )}

          {(status === "preparing" || crossfading) && (
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
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
          <FilePrepareGate
            fileName={staged.file.name}
            fileSize={staged.file.size}
            progress={processingProgress}
            phase="transmuting"
            phaseLabelKey="prepare.phases.transmuting"
          />
        </div>
      )}

      {status === "success" && result && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-bg-base">
            {previewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt={t("panel.previewAlt", { fileName: result.fileName })}
                className="mx-auto max-h-80 object-contain"
              />
            )}
          </div>
          <div className="rounded-xl border border-border bg-bg-surface px-4 py-2 text-xs">
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

      {status === "error" && errorMessage && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <p className="font-semibold">{t("panel.errorTitle")}</p>
          <p className="mt-1">{errorMessage}</p>
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
