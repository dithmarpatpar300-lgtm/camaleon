import type { ReleaseHighlight } from "@/lib/releases/types";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";
import { ReleaseHighlightIcon } from "./ReleaseHighlightIcon";

type Props = {
  highlights: ReleaseHighlight[];
  className?: string;
  compact?: boolean;
};

export function ReleaseHighlightList({ highlights, className, compact }: Props) {
  const { t } = useI18n();

  return (
    <ul className={cn("space-y-3", className)}>
      {highlights.map((item) => (
        <li key={item.id} className="flex gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-bg-elevated/60",
              compact && "h-7 w-7"
            )}
          >
            <ReleaseHighlightIcon name={item.icon} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-semibold text-text-primary", compact && "text-[13px]")}>
              {t(item.titleKey)}
            </p>
            <p className={cn("mt-0.5 text-xs leading-relaxed text-text-secondary", compact && "text-[11px]")}>
              {t(item.bodyKey)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
