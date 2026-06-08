"use client";

import { useMemo, useState } from "react";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import {
  RESIZE_PRESETS,
  EXTENDED_PRESET,
  computeTargetDimensions,
  allowsExtendedMaxEdge,
  presetExceedsPixelLimit,
  pickLargestValidPresetEdge,
} from "@/lib/imaging/downscale";
import {
  MAX_PIXELS,
  formatMegapixels,
} from "@/lib/transmutation/limit-context";
import { formatPeakRam, estimatePeakRamBytes } from "@/lib/transmutation/estimate-peak-ram";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/I18nProvider";

type AstroResizePanelProps = {
  sourceMeta: SourceImageMeta;
  fileSize: number;
  deviceMemoryGb?: number;
  onApply: (maxEdge: number) => void;
  onCancel: () => void;
  applying?: boolean;
};

function buildPresetList(deviceMemoryGb?: number) {
  const list = [...RESIZE_PRESETS];
  if (allowsExtendedMaxEdge(deviceMemoryGb)) {
    list.push(EXTENDED_PRESET);
  }
  return list;
}

export function AstroResizePanel({
  sourceMeta,
  fileSize,
  deviceMemoryGb,
  onApply,
  onCancel,
  applying = false,
}: AstroResizePanelProps) {
  const { t } = useI18n();
  const presets = useMemo(
    () => buildPresetList(deviceMemoryGb),
    [deviceMemoryGb]
  );

  const [selectedEdge, setSelectedEdge] = useState(() =>
    pickLargestValidPresetEdge(
      sourceMeta.width,
      sourceMeta.height,
      presets.map((p) => p.maxEdge)
    )
  );
  const [extendedConsented, setExtendedConsented] = useState(false);

  const target = useMemo(
    () => computeTargetDimensions(sourceMeta.width, sourceMeta.height, selectedEdge),
    [sourceMeta.width, sourceMeta.height, selectedEdge]
  );

  const exceedsPixelLimit = target.pixelCount > MAX_PIXELS;
  const maxMp = formatMegapixels(MAX_PIXELS);

  const peakRam = formatPeakRam(
    estimatePeakRamBytes(fileSize, target.width, target.height)
  );

  const needsExtendedConsent =
    selectedEdge === EXTENDED_PRESET.maxEdge &&
    !extendedConsented &&
    !exceedsPixelLimit;

  const canApply = !applying && !exceedsPixelLimit && !needsExtendedConsent;

  return (
    <div className="mb-4 rounded-xl border border-info/40 bg-info/10 px-4 py-3 text-sm">
      <p className="font-medium text-info">{t("panel.astroResize.title")}</p>
      <p className="mt-1 text-text-secondary">{t("panel.astroResize.body")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => {
          const overLimit = presetExceedsPixelLimit(
            sourceMeta.width,
            sourceMeta.height,
            preset.maxEdge
          );
          const isExtended = preset.maxEdge === EXTENDED_PRESET.maxEdge;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={applying || overLimit}
              title={overLimit ? t("panel.astroResize.presetOverLimit", { maxMp }) : undefined}
              onClick={() => {
                setSelectedEdge(preset.maxEdge);
                if (!isExtended) {
                  setExtendedConsented(false);
                }
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                overLimit && "cursor-not-allowed opacity-40",
                !overLimit &&
                  selectedEdge === preset.maxEdge &&
                  "border-accent bg-accent/20 text-accent",
                !overLimit &&
                  selectedEdge !== preset.maxEdge &&
                  "border-border bg-bg-surface text-text-secondary hover:border-accent/50"
              )}
            >
              {t(preset.labelKey)}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-text-muted">
        {t("panel.astroResize.target", {
          width: target.width,
          height: target.height,
          megapixels: formatMegapixels(target.pixelCount),
          peakRam,
        })}
      </p>

      {exceedsPixelLimit && (
        <p className="mt-2 text-xs text-warning" role="alert">
          {t("panel.astroResize.exceedsPixelLimit", {
            width: target.width,
            height: target.height,
            megapixels: formatMegapixels(target.pixelCount),
            maxMp,
          })}
        </p>
      )}

      {selectedEdge === EXTENDED_PRESET.maxEdge && !exceedsPixelLimit && (
        <>
          <p className="mt-2 text-xs text-text-muted">
            {t("panel.astroResize.extendedHint", { maxMp })}
          </p>
          <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={extendedConsented}
              disabled={applying}
              onChange={(e) => setExtendedConsented(e.target.checked)}
            />
            <span>{t("panel.astroResize.extendedConsent")}</span>
          </label>
        </>
      )}

      <p className="mt-2 text-xs text-text-muted">{t("panel.astroResize.privacy")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={!canApply} onClick={() => onApply(selectedEdge)}>
          {applying ? t("panel.astroResize.applying") : t("panel.astroResize.apply")}
        </Button>
        <Button variant="ghost" size="sm" disabled={applying} onClick={onCancel}>
          {t("panel.cancel")}
        </Button>
      </div>
    </div>
  );
}
