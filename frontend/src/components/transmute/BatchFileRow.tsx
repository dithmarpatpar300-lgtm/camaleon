"use client";

import type { BatchItem } from "@/lib/batch/batch-types";
import { formatBatchFileDetailsLine } from "@/lib/batch/format-batch-file-details";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { useI18n } from "@/providers/I18nProvider";
import { localizeError } from "@/lib/i18n/errors";
import { cn } from "@/lib/utils";

type BatchFileRowProps = {
  item: BatchItem;
  onToggle: (id: string) => void;
};

export function BatchFileRow({ item, onToggle }: BatchFileRowProps) {
  const { t } = useI18n();
  const checkboxEnabled =
    item.status === "ready" ||
    item.status === "needs_consent" ||
    item.status === "done" ||
    item.status === "error";

  const statusLabel = (() => {
    switch (item.status) {
      case "queued":
      case "preparing":
        return t("panel.batch.rowPreparing");
      case "ready":
        return item.blockReason === "consent"
          ? t("panel.batch.rowElevated")
          : t("panel.batch.rowReady");
      case "needs_consent":
        return t("panel.batch.rowElevated");
      case "blocked":
        return t("panel.batch.rowBlocked");
      case "processing":
        return t("panel.processingFallback");
      case "done":
        return t("panel.batch.rowDone");
      case "error":
        return t("panel.batch.rowError");
      default:
        return "";
    }
  })();

  const detailsLine = formatBatchFileDetailsLine(
    item.file.size,
    item.sourceMeta ?? item.prepared?.sourceMeta ?? null
  );

  const errorDetail =
    item.status === "error" && item.errorMessage
      ? item.errorMessage.startsWith("panel.") || item.errorMessage.startsWith("errors.")
        ? t(item.errorMessage)
        : localizeError(item.errorMessage, t)
      : null;

  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/50 bg-bg-elevated/40 px-3 py-3 text-sm transition-colors",
        item.status === "processing" && "border-accent/30 bg-accent-subtle/20",
        item.status === "done" && "border-accent/20 bg-accent-subtle/10",
        item.status === "error" && "border-error/30 bg-error/5",
        !checkboxEnabled && "opacity-70"
      )}
    >
      <input
        type="checkbox"
        checked={item.selected}
        disabled={!checkboxEnabled}
        onChange={() => onToggle(item.id)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        aria-label={item.file.name}
      />
      <div className="min-w-0 flex-1">
        <DisplayFilename name={item.file.name} className="truncate font-medium text-text-primary" />
        <p className="mt-0.5 font-mono text-xs tabular-nums text-text-muted">{detailsLine}</p>
        <div className="mt-1.5 flex flex-col gap-1">
          <span
            className={cn(
              "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
              item.status === "ready" && "bg-accent/15 text-accent",
              item.status === "needs_consent" && "bg-warning/15 text-warning",
              item.status === "processing" && "bg-accent/20 text-accent",
              item.status === "done" && "bg-accent/15 text-accent",
              item.status === "error" && "bg-error/15 text-error",
              (item.status === "blocked" || item.status === "preparing" || item.status === "queued") &&
                "bg-bg-base text-text-muted"
            )}
          >
            {statusLabel}
          </span>
          {errorDetail && (
            <span className="text-xs text-error/90">{errorDetail}</span>
          )}
        </div>
      </div>
    </label>
  );
}
