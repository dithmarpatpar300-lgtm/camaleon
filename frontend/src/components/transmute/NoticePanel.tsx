"use client";

import { useI18n } from "@/providers/I18nProvider";
import type { Notice, NoticeSeverity } from "@/lib/notices/types";
import { cn } from "@/lib/utils";

type NoticePanelProps = {
  notice: Notice;
  className?: string;
};

const SEVERITY_STYLES: Record<
  NoticeSeverity,
  { container: string; text: string; role: "alert" | "status" | "note" }
> = {
  error: {
    container: "border-error/40 bg-error/10",
    text: "text-error",
    role: "alert",
  },
  warn: {
    container: "border-warning/40 bg-warning/10",
    text: "text-warning",
    role: "note",
  },
  info: {
    container: "border-info/30 bg-info/10",
    text: "text-info",
    role: "note",
  },
  status: {
    container: "border-border/60 bg-bg-elevated/80",
    text: "text-text-muted",
    role: "status",
  },
};

export function resolveNoticeMessage(
  notice: Notice,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (notice.messageKey === "notices.estimate.errorRaw") {
    return String(notice.params?.message ?? "");
  }
  return t(notice.messageKey, notice.params);
}

export function NoticePanel({ notice, className }: NoticePanelProps) {
  const { t } = useI18n();
  const styles = SEVERITY_STYLES[notice.severity];
  const message = resolveNoticeMessage(notice, t);

  return (
    <p
      role={styles.role}
      className={cn(
        "rounded-xl border px-4 py-3 text-xs leading-relaxed",
        styles.container,
        styles.text,
        className
      )}
    >
      {message}
    </p>
  );
}
