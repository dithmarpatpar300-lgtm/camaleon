"use client";

import { useI18n } from "@/providers/I18nProvider";
import { colorLabel } from "@/lib/format/color-label";
import type { RgbColor } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type TransparencyNoticeProps = {
  background: RgbColor;
  className?: string;
};

function ColorDisplay({
  color,
  isHex,
}: {
  color: RgbColor;
  isHex: boolean;
}) {
  const { t } = useI18n();

  if (!isHex) {
    return <strong>{colorLabel(color, t)}</strong>;
  }

  return (
    <span className="inline-flex items-center gap-1 align-middle leading-none">
      <span
        className="inline-block h-3 w-3 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }}
        aria-hidden="true"
      />
      <strong>{t("panel.transparencyNotice.thisColor")}</strong>
    </span>
  );
}

export function TransparencyNotice({ background, className }: TransparencyNoticeProps) {
  const { t } = useI18n();
  const label = colorLabel(background, t);
  const isHex = label.startsWith("#");

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
      <p className="mt-1 text-text-secondary">
        {isHex ? (
          <>
            {t("panel.transparencyNotice.bodyBefore")}
            <ColorDisplay color={background} isHex={true} />
            {t("panel.transparencyNotice.bodyAfter")}
          </>
        ) : (
          t("panel.transparencyNotice.body", { color: label })
        )}
      </p>
    </div>
  );
}
