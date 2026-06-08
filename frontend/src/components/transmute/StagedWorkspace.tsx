"use client";

import type { ColorOptionSpec, ToolDefinition } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
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
    needsOversizeConsent: boolean;
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
  const canTransmute = ready && !metrics.needsOversizeConsent;
  const showBmpGrowthWarning =
    isBmpToPng &&
    metrics.estimateDelta != null &&
    metrics.estimateDelta.deltaPct > 0;

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

      {metrics.needsOversizeConsent && (
        <OversizeConsentPanel
          fileSize={fileSize}
          sourceMeta={sourceMeta}
          onConsent={onOversizeConsent}
        />
      )}

      {isGifTool && gifSession?.is_animated && (
        <GifFrameScrubber
          session={gifSession}
          frameIndex={frameIndex}
          onFrameIndexChange={(index) =>
            onOptionsChange({ ...options, frameIndex: index })
          }
        />
      )}

      {hasAlpha && backgroundSpec && (
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

      {hasOptions && (
        <div className="mb-5 border-t border-border pt-4">
          <OptionsControls
            toolId={tool.id}
            specs={panelOptionSpecs}
            values={options}
            onChange={onOptionsChange}
          />
        </div>
      )}

      <div className={hasOptions ? "mb-5" : "mb-5 border-t border-border pt-4"}>
        <MetricsPanel
          originalSize={metrics.originalSize}
          estimateDelta={metrics.estimateDelta}
          estimating={metrics.estimating}
          estimateError={metrics.estimateError}
          needsOversizeConsent={metrics.needsOversizeConsent}
          cacheWarm={metrics.cacheWarm}
          autoEstimate={profile.autoEstimate}
          ready={ready}
          onRequestEstimate={onRequestEstimate}
        />
      </div>
      {showBmpGrowthWarning && <BmpPngGrowthNotice />}

      <Button onClick={onTransmutar} disabled={!canTransmute} className="w-full">
        {!ready
          ? t("panel.initializing")
          : metrics.needsOversizeConsent
            ? t("panel.oversize.blockedButton")
            : t("panel.transmuteButton")}
      </Button>
    </div>
  );
}
