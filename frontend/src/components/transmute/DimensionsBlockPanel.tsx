"use client";

import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import {
  MAX_PIXELS,
  formatMegapixels,
  pixelCountFromMeta,
} from "@/lib/transmutation/limit-context";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/providers/I18nProvider";

type DimensionsBlockPanelProps = {
  sourceMeta: SourceImageMeta | null;
  isAstronomicalScale: boolean;
  canResize?: boolean;
  onStartResize?: () => void;
};

export function DimensionsBlockPanel({
  sourceMeta,
  isAstronomicalScale,
  canResize = false,
  onStartResize,
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
      {canResize && onStartResize ? (
        <>
          <p className="mt-2 text-xs text-error/80">
            {t("panel.dimensionsBlock.resizeHint")}
          </p>
          <Button
            variant="subtle"
            size="sm"
            className="mt-3 border-error/40 bg-error/15 text-error hover:bg-error/25"
            onClick={onStartResize}
          >
            {t("panel.dimensionsBlock.resizeCta")}
          </Button>
        </>
      ) : (
        <p className="mt-2 text-xs text-error/80">
          {t("panel.dimensionsBlock.action")}
        </p>
      )}
    </div>
  );
}
