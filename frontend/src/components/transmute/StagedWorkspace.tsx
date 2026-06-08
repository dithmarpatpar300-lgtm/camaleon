"use client";

import type { ColorOptionSpec, ToolDefinition } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
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
import { OutputSizeNotice } from "./OutputSizeNotice";
import { BmpPngGrowthNotice } from "./BmpPngGrowthNotice";
import { SourceImageMetaLine } from "./SourceImageMetaLine";
import { useI18n } from "@/providers/I18nProvider";

type StagedWorkspaceProps = {
  tool: ToolDefinition;
  fileName: string;
  fileSize: number;
  options: TransmutationOptions;
  onOptionsChange: (next: TransmutationOptions) => void;
  hasAlpha: boolean;
  gifSession: GifSessionHandle | null;
  sourceMeta: SourceImageMeta | null;
  limitContext: LimitContext;
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
};

export function StagedWorkspace({
  tool,
  fileName,
  fileSize,
  options,
  onOptionsChange,
  hasAlpha,
  gifSession,
  sourceMeta,
  limitContext,
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
}: StagedWorkspaceProps) {
  const { t } = useI18n();
  const isGifTool = tool.id === "gif-to-png" || tool.id === "gif-to-jpg";
  const isBmpToPng = tool.id === "bmp-to-png";
  const frameIndex = options.frameIndex ?? 0;
  const dimensionBlocked = limitContext.blockReason === "pixels";
  const canTransmute = limitContext.canTransmute;
  const showBmpGrowthWarning =
    isBmpToPng &&
    metrics.estimateDelta != null &&
    metrics.estimateDelta.deltaPct > 0;
  const showOutputWarning =
    limitContext.warnings.includes("output_may_exceed_hard_limit") &&
    metrics.estimateDelta != null;

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <DisplayFilename
            name={fileName}
            className="text-sm font-medium text-text-primary"
          />
          <p className="text-xs text-text-muted">{formatBytes(fileSize)}</p>
          <SourceImageMetaLine meta={sourceMeta} />
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onReset}>
          {t("panel.changeFile")}
        </Button>
      </div>

      {dimensionBlocked && (
        <DimensionsBlockPanel
          sourceMeta={sourceMeta}
          isAstronomicalScale={limitContext.isAstronomicalScale}
        />
      )}

      {!dimensionBlocked && limitContext.needsInputConsent && (
        <OversizeConsentPanel
          fileSize={fileSize}
          sourceMeta={sourceMeta}
          onConsent={onOversizeConsent}
        />
      )}

      {!dimensionBlocked && isGifTool && gifSession?.is_animated && (
        <GifFrameScrubber
          session={gifSession}
          frameIndex={frameIndex}
          onFrameIndexChange={(index) =>
            onOptionsChange({ ...options, frameIndex: index })
          }
        />
      )}

      {!dimensionBlocked && hasAlpha && backgroundSpec && (
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

      {!dimensionBlocked && hasOptions && (
        <div className="mb-5 border-t border-border pt-4">
          <OptionsControls
            toolId={tool.id}
            specs={panelOptionSpecs}
            values={options}
            onChange={onOptionsChange}
          />
        </div>
      )}

      {!dimensionBlocked && (
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
            onRequestEstimate={onRequestEstimate}
          />
        </div>
      )}

      {showOutputWarning && metrics.estimateDelta && (
        <OutputSizeNotice
          estimatedSize={metrics.estimateDelta.finalSize}
          hardLimitBytes={limitContext.hardLimitBytes}
        />
      )}

      {showBmpGrowthWarning && <BmpPngGrowthNotice />}

      {!dimensionBlocked && (
        <Button onClick={onTransmutar} disabled={!canTransmute} className="w-full">
          {!ready
            ? t("panel.initializing")
            : limitContext.needsInputConsent
              ? t("panel.oversize.blockedButton")
              : t("panel.transmuteButton")}
        </Button>
      )}
    </div>
  );
}
