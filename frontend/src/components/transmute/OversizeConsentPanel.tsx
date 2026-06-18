"use client";

import { formatBytes } from "@/lib/format/bytes";
import { formatPeakRam, estimatePeakRamBytes } from "@/lib/transmutation/estimate-peak-ram";
import { ENGINE_MAX_INPUT_LABEL } from "@/lib/transmutation/limits";
import {
  MAX_PIXELS,
  formatMegapixels,
  pixelCountFromMeta,
} from "@/lib/transmutation/limit-context";
import { isNearPixelLimit } from "@/lib/notices/pixel-limit";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/providers/I18nProvider";
import { LimitUnlockHint } from "./LimitUnlockHint";

type OversizeConsentPanelProps = {
  fileSize: number;
  sourceMeta: SourceImageMeta | null;
  onConsent: () => void;
};

export function OversizeConsentPanel({
  fileSize,
  sourceMeta,
  onConsent,
}: OversizeConsentPanelProps) {
  const { t } = useI18n();
  const peakRam = formatPeakRam(
    estimatePeakRamBytes(fileSize, sourceMeta?.width, sourceMeta?.height)
  );
  const pixelCount = pixelCountFromMeta(sourceMeta);
  const nearPixelLimit = isNearPixelLimit(pixelCount);

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
      <p className="font-medium">{t("panel.oversize.title")}</p>
      <p className="mt-1 text-warning/90">
        {t("panel.oversize.body", {
          size: formatBytes(fileSize),
          softLimit: ENGINE_MAX_INPUT_LABEL,
          peakRam,
        })}
      </p>
      {nearPixelLimit && pixelCount != null && (
        <p className="mt-2 text-xs text-warning/80">
          {t("panel.oversize.nearPixelLimit", {
            megapixels: formatMegapixels(pixelCount),
            maxMp: formatMegapixels(MAX_PIXELS),
          })}
        </p>
      )}
      <p className="mt-2 text-xs text-warning/80">{t("panel.oversize.outputHint")}</p>
      <p className="mt-1 text-xs text-warning/80">{t("panel.oversize.privacy")}</p>
      <Button
        variant="subtle"
        size="sm"
        className="mt-3 border-warning/50 bg-warning/20 text-warning hover:bg-warning/30"
        onClick={onConsent}
      >
        {t("panel.oversize.consent")}
      </Button>
      <LimitUnlockHint variant="warning" />
    </div>
  );
}
