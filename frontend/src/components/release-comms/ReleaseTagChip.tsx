import type { ReleaseTag } from "@/lib/releases/types";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

const tagStyles: Record<ReleaseTag, string> = {
  feature: "bg-accent-subtle text-accent",
  fix: "bg-bg-elevated text-text-secondary",
  perf: "bg-bg-elevated text-text-secondary",
  security: "bg-bg-elevated text-lossy",
};

type Props = {
  tag: ReleaseTag;
  className?: string;
};

export function ReleaseTagChip({ tag, className }: Props) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tagStyles[tag],
        className
      )}
    >
      {t(`releaseComms.tags.${tag}`)}
    </span>
  );
}
