"use client";

import { formatBytes } from "@/lib/format/bytes";
import { formatPeakRam, estimatePeakRamBytes } from "@/lib/transmutation/estimate-peak-ram";
import { ENGINE_MAX_INPUT_LABEL } from "@/lib/transmutation/limits";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/providers/I18nProvider";

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
      <p className="mt-2 text-xs text-warning/80">{t("panel.oversize.privacy")}</p>
      <Button
        variant="subtle"
        size="sm"
        className="mt-3 border-warning/50 bg-warning/20 text-warning hover:bg-warning/30"
        onClick={onConsent}
      >
        {t("panel.oversize.consent")}
      </Button>
    </div>
  );
}
