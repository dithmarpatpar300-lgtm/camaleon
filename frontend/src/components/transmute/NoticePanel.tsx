"use client";

import { useI18n } from "@/providers/I18nProvider";
import type { Notice, NoticeAction, NoticeSeverity } from "@/lib/notices/types";
import { cn } from "@/lib/utils";
import { ActionInlinePill } from "./ActionInlinePill";

type NoticePanelProps = {
  notice: Notice;
  /** Called when an inline action pill is clicked. Receives the action data. */
  onAction?: (action: NoticeAction) => void;
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

export function NoticePanel({ notice, onAction, className }: NoticePanelProps) {
  const { t } = useI18n();
  const styles = SEVERITY_STYLES[notice.severity];
  const message = resolveNoticeMessage(notice, t);
  const hasActions = notice.actions && notice.actions.length > 0;

  const containerClasses = cn(
    "rounded-xl border px-4 py-3 text-xs leading-relaxed",
    styles.container,
    styles.text,
    className,
  );

  if (!hasActions) {
    return (
      <p role={styles.role} className={containerClasses}>
        {message}
      </p>
    );
  }

  // Parse {action:N} markers and inject ActionInlinePill components inline
  const parts = message.split(/\{action:(\d+)\}/);
  const children: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) {
        children.push(parts[i]);
      }
    } else {
      const actionIdx = parseInt(parts[i], 10);
      const action = notice.actions![actionIdx];
      if (action) {
        children.push(
          <ActionInlinePill
            key={`action-${actionIdx}`}
            label={t(action.labelKey)}
            toolSlug={action.toolSlug}
            onClick={() => onAction?.(action)}
          />,
        );
      }
    }
  }

  return (
    <div role={styles.role} className={containerClasses}>
      {children}
    </div>
  );
}
