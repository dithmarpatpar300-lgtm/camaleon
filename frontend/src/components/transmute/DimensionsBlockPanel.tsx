"use client";

import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import {
  MAX_PIXELS,
  formatMegapixels,
  pixelCountFromMeta,
} from "@/lib/transmutation/limit-context";
import { useI18n } from "@/providers/I18nProvider";

type DimensionsBlockPanelProps = {
  sourceMeta: SourceImageMeta | null;
  isAstronomicalScale: boolean;
};

export function DimensionsBlockPanel({
  sourceMeta,
  isAstronomicalScale,
}: DimensionsBlockPanelProps) {
  const { t } = useI18n();
  const pixelCount = pixelCountFromMeta(sourceMeta);
  const maxMp = formatMegapixels(MAX_PIXELS);

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
    >
      <p className="font-medium">{t("panel.dimensionsBlock.title")}</p>
      {sourceMeta && pixelCount != null && (
        <p className="mt-1 text-error/90">
          {t("panel.dimensionsBlock.body", {
            width: sourceMeta.width,
            height: sourceMeta.height,
            megapixels: formatMegapixels(pixelCount),
            maxMp,
          })}
        </p>
      )}
      {isAstronomicalScale && (
        <p className="mt-2 text-xs text-error/80">
          {t("panel.dimensionsBlock.astroHint")}
        </p>
      )}
      <p className="mt-2 text-xs text-error/80">
        {t("panel.dimensionsBlock.action")}
      </p>
    </div>
  );
}
