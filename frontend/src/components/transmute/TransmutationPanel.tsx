"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColorOptionSpec, ToolDefinition } from "@/lib/tools/types";
import type { EncodeSource, OutputExtension, TransmutationOptions } from "@/workers/types";
import { fileMatchesExtensions } from "@/lib/tools/extensions";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { useFileMetrics } from "@/hooks/useFileMetrics";
import { useAdaptiveResourceProfile } from "@/hooks/useAdaptiveResourceProfile";
import { downloadResult } from "@/lib/transmutation/download";
import { formatBytes } from "@/lib/format/bytes";
import { detectBmpAlpha } from "@/lib/format/detect-bmp-alpha";
import { detectGifAlpha } from "@/lib/format/detect-gif-alpha";
import { detectPngAlpha } from "@/lib/format/detect-png-alpha";
import { detectWebpAlpha } from "@/lib/format/detect-webp-alpha";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { usePageFileDrop } from "@/hooks/usePageFileDrop";
import { localizeError } from "@/lib/i18n/errors";
import { getOptionSpecStrings, resolveToolFidelityHint } from "@/lib/i18n/tool-copy";
import { Button } from "@/components/ui/Button";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { Spinner } from "@/components/ui/Spinner";
import { truncateFilenameMiddle } from "@/lib/format/filename";
import { cn } from "@/lib/utils";
import { Dropzone } from "./Dropzone";
import { OptionsControls } from "./OptionsControls";
import { MetricsPanel } from "./MetricsPanel";
import { TransparencyNotice } from "./TransparencyNotice";
import { PageDropOverlay } from "./PageDropOverlay";

type PanelStatus = "idle" | "staged" | "processing" | "success" | "error";

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
  const [options, setOptions] = useState<TransmutationOptions>(() => buildDefaultOptions(tool.optionSpecs));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAlpha, setHasAlpha] = useState(false);

  const { transmutate, ready } = useTransmutationWorker();
  const { toast } = useToast();
  const profile = useAdaptiveResourceProfile(staged?.file?.size ?? 0);
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
  });
  const accept = tool.acceptExtensions.join(",");
  const hint = resolveToolFidelityHint(tool.id, t);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!fileMatchesExtensions(file.name, tool.acceptExtensions)) {
      setStatus("error");
      setErrorMessage(t("panel.fmtError", { formats: tool.acceptExtensions.join(", ") }));
      return;
    }
    const bytes = await file.arrayBuffer();
    setStaged({ file, bytes });
    setStatus("staged");
    setErrorMessage(null);
    setResult(null);

    const hasBackgroundOption = tool.optionSpecs?.some(
      (s) => s.kind === "color" && s.key === "background"
    );

    if (hasBackgroundOption && tool.id === "png-to-jpg") {
      setHasAlpha(detectPngAlpha(bytes).hasAlpha);
    } else if (hasBackgroundOption && tool.id === "webp-to-jpg") {
      setHasAlpha(detectWebpAlpha(bytes));
    } else if (hasBackgroundOption && tool.id === "gif-to-jpg") {
      setHasAlpha(detectGifAlpha(bytes));
    } else if (hasBackgroundOption && tool.id === "bmp-to-jpg") {
      setHasAlpha(detectBmpAlpha(bytes));
    } else {
      setHasAlpha(false);
    }
  }, [tool, t]);

  const handleTransmutar = useCallback(async () => {
    if (!staged || !ready) return;
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
    t,
  ]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadResult(result.outputBytes, result.fileName, result.mime, result.extension);
    toast({ message: t("toast.downloadStarted"), variant: "success" });
  }, [result, toast, t]);

  const handleReset = useCallback(() => {
    setStaged(null);
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setHasAlpha(false);
    setPreviewUrl(null);
    setOptions(buildDefaultOptions(tool.optionSpecs));
    metrics.resetMetrics();
  }, [tool, metrics]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (status === "processing") return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  }, [status, handleFileSelect]);

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

  return (
    <div className="space-y-6">
      {status === "idle" && (
        <Dropzone accept={accept} status="idle" dragging={dragging} sourceFileName={null}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onFileSelect={handleFileSelect} idleLabel={t("dropzone.idleLabel")} processingLabel={t("dropzone.processingLabel")}
        />
      )}

      {status === "staged" && staged && (
        <div className="rounded-2xl border border-border bg-bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DisplayFilename
                name={staged.file.name}
                className="text-sm font-medium text-text-primary"
              />
              <p className="text-xs text-text-muted">{formatBytes(staged.file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={handleReset}>
              {t("panel.changeFile")}
            </Button>
          </div>
          {hasAlpha && backgroundSpec && (
            <div className="mb-4">
              <TransparencyNotice
                background={currentBackground}
                swatches={backgroundSwatches}
                allowCustom={backgroundSpec.allowCustom}
                onBackgroundChange={(bg) =>
                  setOptions((prev) => ({ ...prev, background: bg }))
                }
              />
            </div>
          )}
          {hasOptions && (
            <div className="mb-5 border-t border-border pt-4">
              <OptionsControls toolId={tool.id} specs={panelOptionSpecs} values={options} onChange={setOptions} />
            </div>
          )}
          <div className={hasOptions ? "mb-5" : "mb-5 border-t border-border pt-4"}>
            <MetricsPanel
              originalSize={metrics.originalSize}
              estimateDelta={metrics.estimateDelta}
              estimating={metrics.estimating}
              cacheWarm={metrics.cacheWarm}
              autoEstimate={profile.autoEstimate}
              ready={ready}
              onRequestEstimate={metrics.requestEstimate}
            />
          </div>
          <Button onClick={handleTransmutar} disabled={!ready} className="w-full">
            {ready ? t("panel.transmuteButton") : t("panel.initializing")}
          </Button>
        </div>
      )}

      {status === "processing" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner label={t("panel.processingFallback")} />
          <p className="text-sm text-text-secondary">
            {staged
              ? t("panel.processing", {
                  fileName: truncateFilenameMiddle(staged.file.name, 36),
                })
              : t("panel.processingFallback")}
          </p>
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
              <Button variant="subtle" size="sm" onClick={() => setStatus("staged")}>{t("panel.adjustAndRetry")}</Button>
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
