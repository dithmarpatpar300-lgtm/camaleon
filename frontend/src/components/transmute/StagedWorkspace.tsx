"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sessionLimitForBytes } from "@/lib/transmutation/limits";
import type { ColorOptionSpec, ToolDefinition } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import type { AvifMeta } from "@/lib/avif/avif-wasm-client";
import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import { AvifFrameScrubber } from "./AvifFrameScrubber";
import type { IcoMeta } from "@/lib/ico/ico-wasm-client";
import type { SvgMeta } from "@/lib/svg/svg-wasm-client";
import { isSvgTool } from "@/lib/svg/svg-prepare";
import type { TiffMeta } from "@/lib/tiff/tiff-wasm-client";
import { probeWebpFormat } from "@/lib/format/probe-webp-format";
import { IcoEntryScrubber } from "./IcoEntryScrubber";
import { TiffPageScrubber } from "./TiffPageScrubber";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { LimitContext } from "@/lib/transmutation/limit-context";
import type { ResourceProfile } from "@/lib/device/resource-profile";
import type { SizeDelta } from "@/lib/format/metrics";
import { formatBytes } from "@/lib/format/bytes";
import { Button } from "@/components/ui/Button";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { OptionsControls } from "./OptionsControls";
import { MetricsPanel } from "./MetricsPanel";
import { TransparencyNotice } from "./TransparencyNotice";
import { GifFrameScrubber } from "./GifFrameScrubber";
import { OversizeConsentPanel } from "./OversizeConsentPanel";
import { DimensionsBlockPanel } from "./DimensionsBlockPanel";
import { AstroResizePanel } from "./AstroResizePanel";
import { SourceImageMetaLine } from "./SourceImageMetaLine";
import { ResizedMetaNotice } from "./ResizedMetaNotice";
import { NoticeRail } from "./NoticeRail";
import { useEstimateElapsed } from "@/hooks/useEstimateElapsed";
import { computeStagedNotices } from "@/lib/notices/compute-staged-notices";
import { computeCostTier } from "@/lib/notices/compute-performance-notices";
import type { ToolNoticeContext } from "@/lib/notices/tool-notice-profiles";
import type { NoticeAction } from "@/lib/notices/types";
import { stageForRecommendedTool } from "@/lib/transmutation/recommend-navigate";
import { useI18n } from "@/providers/I18nProvider";
import { useRiskMode } from "@/providers/RiskModeProvider";
import { RiskModeBanner } from "./RiskModeBanner";
import { RiskDeactivatedNotice } from "./RiskDeactivatedNotice";
import { HardFileBlockPanel } from "./HardFileBlockPanel";
import { RiskUnlockProceedPanel } from "./RiskUnlockProceedPanel";
import { UncachedToolNotice } from "./UncachedToolNotice";

type StagedWorkspaceProps = {
  tool: ToolDefinition;
  fileName: string;
  fileSize: number;
  options: TransmutationOptions;
  onOptionsChange: (next: TransmutationOptions) => void;
  hasAlpha: boolean;
  gifSession: GifSessionHandle | null;
  avifMeta: AvifMeta | null;
  tiffMeta: TiffMeta | null;
  icoMeta: IcoMeta | null;
  svgMeta: SvgMeta | null;
  fileBytes: Uint8Array | null;
  sourceMeta: SourceImageMeta | null;
  originalSourceMeta?: SourceImageMeta | null;
  limitContext: LimitContext;
  canClientResize: boolean;
  astroResizeMode: boolean;
  resizing?: boolean;
  deviceMemoryGb?: number;
  onStartResize: () => void;
  onApplyResize: (maxEdge: number) => void;
  onCancelResize: () => void;
  panelOptionSpecs: NonNullable<ToolDefinition["optionSpecs"]>;
  hasOptions: boolean;
  backgroundSpec?: ColorOptionSpec;
  backgroundSwatches: { label: string; value: import("@/lib/tools/types").RgbColor }[];
  currentBackground: import("@/lib/tools/types").RgbColor;
  metrics: {
    originalSize: number;
    estimateDelta: SizeDelta | null;
    estimating: boolean;
    estimateError: string | null;
    cacheWarm: boolean;
  };
  profile: ResourceProfile;
  ready: boolean;
  onRequestEstimate: () => void;
  onOversizeConsent: () => void;
  onTransmutar: () => void;
  onReset: () => void;
  showRiskDeactivatedNotice?: boolean;
  riskUnlockAwaitingConfirm?: boolean;
  onRiskUnlockContinue?: () => void;
};

export function StagedWorkspace({
  tool,
  fileName,
  fileSize,
  options,
  onOptionsChange,
  hasAlpha,
  gifSession,
  avifMeta,
  tiffMeta,
  icoMeta,
  svgMeta,
  fileBytes,
  sourceMeta,
  originalSourceMeta,
  limitContext,
  canClientResize,
  astroResizeMode,
  resizing = false,
  deviceMemoryGb,
  onStartResize,
  onApplyResize,
  onCancelResize,
  panelOptionSpecs,
  hasOptions,
  backgroundSpec,
  backgroundSwatches,
  currentBackground,
  metrics,
  profile,
  ready,
  onRequestEstimate,
  onOversizeConsent,
  onTransmutar,
  onReset,
  showRiskDeactivatedNotice = false,
  riskUnlockAwaitingConfirm = false,
  onRiskUnlockContinue,
}: StagedWorkspaceProps) {
  const { t } = useI18n();
  const { riskModeEnabled } = useRiskMode();
  const router = useRouter();

  const handleNoticeAction = useCallback(
    async (action: NoticeAction) => {
      if (!fileBytes) return;
      const url = await stageForRecommendedTool(fileBytes, fileName, action.toolSlug);
      router.push(url);
    },
    [fileBytes, fileName, router],
  );
  const isGifTool = tool.id === "gif-to-png" || tool.id === "gif-to-jpg";
  const isAvifTool = tool.id === "avif-to-png" || tool.id === "avif-to-jpg";
  const isTiffTool = tool.id === "tiff-to-png" || tool.id === "tiff-to-jpg";
  const isIcoTool = tool.id === "ico-to-png";
  const isSvgToolRoute = isSvgTool(tool.id);
  const frameIndex = options.frameIndex ?? 0;
  const pageIndex = options.pageIndex ?? 0;
  const entryIndex = options.entryIndex ?? 0;
  const dimensionBlocked = limitContext.blockReason === "pixels";
  const hardFileBlocked = limitContext.blockReason === "hard_file";
  const limitBlocked = dimensionBlocked || hardFileBlocked;
  const awaitingRiskConfirm = riskUnlockAwaitingConfirm;
  const canTransmute = limitContext.canTransmute && !awaitingRiskConfirm;
  /**
   * Block transmute while a stale estimate is being refreshed (options changed),
   * or when the last estimate failed while limits still allow trying again.
   */
  const estimateSyncing =
    metrics.estimating &&
    !metrics.cacheWarm &&
    metrics.estimateDelta != null;
  const transmuteReady =
    canTransmute && !estimateSyncing && !metrics.estimateError;
  const estimateElapsedMs = useEstimateElapsed(metrics.estimating);

  const noticeContext: ToolNoticeContext = useMemo(
    () => ({
      sourceMeta,
      animatedFrameCount:
        gifSession?.is_animated ? gifSession.frame_count : undefined,
      tiffPageCount: tiffMeta?.pageCount,
      icoEntryCount: icoMeta?.entryCount,
      svgMeta: svgMeta ?? undefined,
      webpSourceFormat: fileBytes ? probeWebpFormat(fileBytes) ?? undefined : undefined,
    }),
    [sourceMeta, gifSession, tiffMeta, icoMeta, svgMeta, fileBytes]
  );

  const noticePhase = metrics.estimating ? ("estimating" as const) : ("staged" as const);

  const stagedNotices = useMemo(
    () =>
      computeStagedNotices({
        toolId: tool.id,
        sourceMeta,
        options,
        limitContext,
        resourceProfile: profile,
        estimateDelta: metrics.estimateDelta,
        estimatedOutputSize: metrics.estimateDelta?.finalSize ?? null,
        estimating: metrics.estimating,
        estimateElapsedMs,
        estimateError: metrics.estimateError,
        needsInputConsent: limitContext.needsInputConsent,
        canClientResize,
        dimensionBlocked: limitBlocked,
        canEstimate: limitContext.canEstimate,
        noticeContext,
        svgMeta,
        hasAlpha,
        phase: noticePhase,
      }),
    [
      tool.id,
      sourceMeta,
      options,
      limitContext,
      profile,
      metrics.estimateDelta,
      metrics.estimating,
      metrics.estimateError,
      estimateElapsedMs,
      canClientResize,
      limitBlocked,
      noticeContext,
      svgMeta,
      hasAlpha,
      noticePhase,
    ]
  );

  const costTier = useMemo(
    () =>
      computeCostTier({
        toolId: tool.id,
        sourceMeta,
        options,
        zone: limitContext.zone,
        resourceProfile: profile,
        noticeContext,
      }),
    [tool.id, sourceMeta, options, limitContext.zone, profile, noticeContext]
  );

  const avifSessionLimit = sessionLimitForBytes(fileSize, deviceMemoryGb, riskModeEnabled);

  return (
    <div className="p-5 sm:p-6">
      {riskModeEnabled && <RiskModeBanner />}
      {awaitingRiskConfirm && onRiskUnlockContinue && (
        <div className="mb-4">
          <RiskUnlockProceedPanel
            fileName={fileName}
            fileSize={fileSize}
            onContinue={onRiskUnlockContinue}
            onStartOver={onReset}
          />
        </div>
      )}
      {!riskModeEnabled && showRiskDeactivatedNotice && limitBlocked && (
        <RiskDeactivatedNotice />
      )}
      <UncachedToolNotice module={tool.module} />
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="min-w-0 flex-1">
          <DisplayFilename
            name={fileName}
            className="text-sm font-medium text-text-primary"
          />
          <p className="text-xs text-text-muted">{formatBytes(fileSize)}</p>
          <SourceImageMetaLine meta={sourceMeta} />
          {isSvgToolRoute && svgMeta && (
            <p className="text-xs text-text-muted">
              {t("panel.svgIntrinsic", {
                width: Math.round(svgMeta.intrinsicWidth),
                height: Math.round(svgMeta.intrinsicHeight),
              })}
            </p>
          )}
          {originalSourceMeta && <ResizedMetaNotice originalMeta={originalSourceMeta} />}
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onReset}>
          {t("panel.changeFile")}
        </Button>
      </div>

      {hardFileBlocked && !astroResizeMode && (
        <HardFileBlockPanel
          fileSize={fileSize}
          hardLimitBytes={limitContext.hardLimitBytes}
          canResize={canClientResize}
          onStartResize={canClientResize ? onStartResize : undefined}
        />
      )}

      {dimensionBlocked && !astroResizeMode && (
        <DimensionsBlockPanel
          sourceMeta={sourceMeta}
          isAstronomicalScale={limitContext.isAstronomicalScale}
          canResize={canClientResize}
          onStartResize={canClientResize ? onStartResize : undefined}
          blockActionKey={
            isSvgToolRoute ? "panel.dimensionsBlock.svgScaleHint" : undefined
          }
        />
      )}

      {(dimensionBlocked || hardFileBlocked) && astroResizeMode && sourceMeta && (
        <AstroResizePanel
          sourceMeta={sourceMeta}
          fileSize={fileSize}
          deviceMemoryGb={deviceMemoryGb}
          riskModeEnabled={riskModeEnabled}
          applying={resizing}
          onApply={onApplyResize}
          onCancel={onCancelResize}
        />
      )}

      {!limitBlocked && limitContext.needsInputConsent && (
        <OversizeConsentPanel
          fileSize={fileSize}
          sourceMeta={sourceMeta}
          onConsent={onOversizeConsent}
        />
      )}

      {!limitBlocked && isGifTool && gifSession?.is_animated && (
        <GifFrameScrubber
          session={gifSession}
          frameIndex={frameIndex}
          onFrameIndexChange={(index) =>
            onOptionsChange({ ...options, frameIndex: index })
          }
        />
      )}

      {!limitBlocked &&
        isAvifTool &&
        avifMeta &&
        avifMeta.frameCount > 1 &&
        fileBytes && (
          <AvifFrameScrubber
            bytes={fileBytes}
            meta={avifMeta}
            frameIndex={frameIndex}
            sessionInputLimitBytes={avifSessionLimit}
            onFrameIndexChange={(index) =>
              onOptionsChange({ ...options, frameIndex: index })
            }
          />
        )}

      {!limitBlocked &&
        isTiffTool &&
        tiffMeta &&
        tiffMeta.pageCount > 1 &&
        fileBytes && (
          <TiffPageScrubber
            bytes={fileBytes}
            meta={tiffMeta}
            pageIndex={pageIndex}
            onPageIndexChange={(index) =>
              onOptionsChange({ ...options, pageIndex: index })
            }
          />
        )}

      {!limitBlocked &&
        isIcoTool &&
        icoMeta &&
        icoMeta.entryCount > 1 &&
        fileBytes && (
          <IcoEntryScrubber
            bytes={fileBytes}
            meta={icoMeta}
            entryIndex={entryIndex}
            onEntryIndexChange={(index) =>
              onOptionsChange({ ...options, entryIndex: index })
            }
          />
        )}

      {!limitBlocked && hasAlpha && backgroundSpec && (
        <div className="mb-4">
          <TransparencyNotice
            background={currentBackground}
            swatches={backgroundSwatches}
            allowCustom={backgroundSpec.allowCustom}
            onBackgroundChange={(bg) =>
              onOptionsChange({ ...options, background: bg })
            }
          />
        </div>
      )}

      {(!dimensionBlocked || isSvgToolRoute) && hasOptions && (
        <div className="mb-5 border-t border-border pt-4">
          <OptionsControls
            toolId={tool.id}
            specs={panelOptionSpecs}
            values={options}
            onChange={onOptionsChange}
            sourceWidth={sourceMeta?.width}
            sourceHeight={sourceMeta?.height}
          />
        </div>
      )}

      {!limitBlocked && <NoticeRail notices={stagedNotices} onAction={handleNoticeAction} />}

      {!limitBlocked && (
        <div className={hasOptions ? "mb-5" : "mb-5 border-t border-border pt-4"}>
          <MetricsPanel
            originalSize={metrics.originalSize}
            estimateDelta={metrics.estimateDelta}
            estimating={metrics.estimating}
            estimateError={metrics.estimateError}
            blockReason={limitContext.blockReason}
            canEstimate={limitContext.canEstimate}
            cacheWarm={metrics.cacheWarm}
            autoEstimate={profile.autoEstimate}
            ready={ready}
            costTier={costTier}
            onRequestEstimate={onRequestEstimate}
          />
        </div>
      )}

      {!limitBlocked && (
        <Button onClick={onTransmutar} disabled={!transmuteReady} className="w-full">
          {!ready
            ? t("panel.initializing")
            : !canTransmute
              ? limitContext.blockReason === "hard_file" ||
                limitContext.blockReason === "pixels"
                ? t("panel.transmuteBlockedLimits")
                : limitContext.needsInputConsent
                  ? t("panel.oversize.blockedButton")
                  : t("panel.transmuteButton")
              : metrics.estimateError
                ? t("panel.transmuteBlockedEstimate")
                : estimateSyncing
                  ? t("panel.transmuteSyncing")
                  : t("panel.transmuteButton")}
        </Button>
      )}
    </div>
  );
}
