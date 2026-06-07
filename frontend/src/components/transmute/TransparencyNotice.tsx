import { useI18n } from "@/providers/I18nProvider";
import { colorLabel } from "@/lib/format/color-label";
import type { RgbColor } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type TransparencyNoticeProps = {
  background: RgbColor;
  className?: string;
};

export function TransparencyNotice({ background, className }: TransparencyNoticeProps) {
  const { t } = useI18n();
  const label = colorLabel(background, t);

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
        {t("panel.transparencyNotice.body", { color: label })}
      </p>
    </div>
  );
}
