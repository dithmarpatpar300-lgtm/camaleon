"use client";

import { useI18n } from "@/providers/I18nProvider";
import type { RgbColor } from "@/lib/tools/types";
import { cn } from "@/lib/utils";
import { BackgroundColorPill } from "./BackgroundColorPill";

type SwatchOption = { label: string; value: RgbColor };

type TransparencyNoticeProps = {
  background: RgbColor;
  swatches: SwatchOption[];
  allowCustom?: boolean;
  onBackgroundChange: (color: RgbColor) => void;
  className?: string;
};

export function TransparencyNotice({
  background,
  swatches,
  allowCustom,
  onBackgroundChange,
  className,
}: TransparencyNoticeProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm",
        className
      )}
    >
      <p className="font-semibold text-info">
        {t("panel.transparencyNotice.title")}
      </p>
      <div className="mt-1.5 text-sm leading-relaxed text-text-secondary">
        {t("panel.transparencyNotice.bodyPrefix")}
        <BackgroundColorPill
          color={background}
          swatches={swatches}
          allowCustom={allowCustom}
          onChange={onBackgroundChange}
          className="mx-1"
        />
        {t("panel.transparencyNotice.bodySuffix")}
      </div>
    </div>
  );
}
