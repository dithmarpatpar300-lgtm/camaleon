"use client";

import { formatBytes } from "@/lib/format/bytes";
import { Button } from "@/components/ui/Button";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { useI18n } from "@/providers/I18nProvider";

type RiskUnlockProceedPanelProps = {
  fileName: string;
  fileSize: number;
  /** Batch: multiple files unlocked at once. */
  fileCount?: number;
  onContinue: () => void;
  onStartOver?: () => void;
};

export function RiskUnlockProceedPanel({
  fileName,
  fileSize,
  fileCount,
  onContinue,
  onStartOver,
}: RiskUnlockProceedPanelProps) {
  const { t } = useI18n();
  const isBatch = fileCount != null && fileCount > 1;

  return (
    <div
      role="status"
      className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-4 text-sm text-warning"
    >
      <p className="font-semibold">{t("panel.riskUnlock.title")}</p>
      <p className="mt-1 leading-relaxed text-warning/90">
        {isBatch
          ? t("panel.riskUnlock.bodyBatch", { count: fileCount })
          : t("panel.riskUnlock.body")}
      </p>
      {!isBatch && (
        <div className="mt-3 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2">
          <DisplayFilename name={fileName} className="text-sm font-medium text-warning" />
          <p className="mt-0.5 font-mono text-xs tabular-nums text-warning/80">
            {formatBytes(fileSize)}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="subtle"
          size="sm"
          className="border-warning/40 bg-warning/15 text-warning hover:bg-warning/25"
          onClick={onContinue}
        >
          {t("panel.riskUnlock.continue")}
        </Button>
        {onStartOver && (
          <Button variant="ghost" size="sm" className="text-warning/90" onClick={onStartOver}>
            {t("panel.startOver")}
          </Button>
        )}
      </div>
    </div>
  );
}
