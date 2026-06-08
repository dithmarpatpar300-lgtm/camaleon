"use client";

import type { ColorOptionSpec, ToolDefinition } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import type { ResourceProfile } from "@/lib/device/resource-profile";
import type { SizeDelta } from "@/lib/format/metrics";
import { formatBytes } from "@/lib/format/bytes";
import { getOptionSpecStrings } from "@/lib/i18n/tool-copy";
import { Button } from "@/components/ui/Button";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { OptionsControls } from "./OptionsControls";
import { MetricsPanel } from "./MetricsPanel";
import { TransparencyNotice } from "./TransparencyNotice";
import { GifFrameScrubber } from "./GifFrameScrubber";
import { LargeFileNotice } from "./LargeFileNotice";
import { useI18n } from "@/providers/I18nProvider";

type StagedWorkspaceProps = {
  tool: ToolDefinition;
  fileName: string;
  fileSize: number;
  options: TransmutationOptions;
  onOptionsChange: (next: TransmutationOptions) => void;
  hasAlpha: boolean;
  gifSession: GifSessionHandle | null;
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
    engineLimitExceeded: boolean;
    cacheWarm: boolean;
  };
  profile: ResourceProfile;
  ready: boolean;
  onRequestEstimate: () => void;
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
  panelOptionSpecs,
  hasOptions,
  backgroundSpec,
  backgroundSwatches,
  currentBackground,
  metrics,
  profile,
  ready,
  onRequestEstimate,
  onTransmutar,
  onReset,
}: StagedWorkspaceProps) {
  const { t } = useI18n();
  const isGifTool = tool.id === "gif-to-png" || tool.id === "gif-to-jpg";
  const frameIndex = options.frameIndex ?? 0;
  const canTransmute = ready && !metrics.engineLimitExceeded;

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <DisplayFilename
            name={fileName}
            className="text-sm font-medium text-text-primary"
          />
          <p className="text-xs text-text-muted">{formatBytes(fileSize)}</p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onReset}>
          {t("panel.changeFile")}
        </Button>
      </div>

      {metrics.engineLimitExceeded && <LargeFileNotice />}

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
          engineLimitExceeded={metrics.engineLimitExceeded}
          cacheWarm={metrics.cacheWarm}
          autoEstimate={profile.autoEstimate}
          ready={ready}
          onRequestEstimate={onRequestEstimate}
        />
      </div>

      <Button onClick={onTransmutar} disabled={!canTransmute} className="w-full">
        {!ready
          ? t("panel.initializing")
          : metrics.engineLimitExceeded
            ? t("panel.transmuteUnavailable")
            : t("panel.transmuteButton")}
      </Button>
    </div>
  );
}
